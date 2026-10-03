import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), create: vi.fn(), revokeAll: vi.fn(), revoke: vi.fn(), older: vi.fn(), mail: vi.fn(), ready: vi.fn(),
}));
vi.mock('../src/repositories/user.repository.js', () => ({ findUserByEmail: mocks.user }));
vi.mock('../src/repositories/token.repository.js', () => ({
  createToken: mocks.create, revokeAllUserTokensByType: mocks.revokeAll,
  revokeToken: mocks.revoke, revokeOlderUserTokensByType: mocks.older,
}));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: mocks.mail, ensureMailReady: mocks.ready }));

import { resendEmailVerification } from '../src/services/auth.service.js';
import { ENV } from '../src/config/env.js';
import { AuthController } from '../src/controllers/auth.controller.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
const controller = new AuthController();
app.use(express.json());
app.post('/resend', controller.resendEmailVerification);
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});

type VerificationRecord = { id: string; createdAt: Date; revoked: boolean };
const previousRequirement = ENV.REQUIRE_EMAIL_VERIFICATION;
const recipient = { id: 'qa-user', email: 'qa@example.invalid', name: 'QA', emailVerified: null };
let tokens: VerificationRecord[];

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ENV.REQUIRE_EMAIL_VERIFICATION = true;
  tokens = [{ id: 'older-link', createdAt: new Date(1_000), revoked: false }];
  mocks.user.mockResolvedValue(recipient);
  mocks.create.mockImplementation(async () => {
    const record = { id: `replacement-${tokens.length}`, createdAt: new Date((tokens.length + 1) * 1_000), revoked: false };
    tokens.push(record);
    return record;
  });
  mocks.revokeAll.mockImplementation(async () => { tokens.forEach(record => { record.revoked = true; }); });
  mocks.revoke.mockImplementation(async (id: string) => {
    const record = tokens.find(token => token.id === id);
    if (record) record.revoked = true;
  });
  mocks.older.mockImplementation(async (_userId: string, _type: string, currentId: string, createdAt: Date) => {
    tokens.forEach(record => {
      if (record.id !== currentId && record.createdAt < createdAt) record.revoked = true;
    });
  });
  mocks.mail.mockResolvedValue({ messageId: 'intercepted' });
});

afterEach(() => {
  ENV.REQUIRE_EMAIL_VERIFICATION = previousRequirement;
  vi.restoreAllMocks();
});

describe('Verification replacement delivery ordering', () => {
  it('keeps the previous link and revokes only the replacement when delivery fails', async () => {
    mocks.mail.mockRejectedValueOnce(new Error('private provider detail'));
    await expect(resendEmailVerification(recipient.email)).rejects.toMatchObject({ status: 503 });
    expect(tokens[0]?.revoked).toBe(false);
    expect(tokens[1]?.revoked).toBe(true);
    expect(mocks.revokeAll).not.toHaveBeenCalled();
    expect(mocks.older).not.toHaveBeenCalled();
  });

  it('does not report a suppressed message as a delivered replacement', async () => {
    mocks.mail.mockResolvedValueOnce({ suppressed: true });
    await expect(resendEmailVerification(recipient.email)).rejects.toMatchObject({ status: 503 });
    expect(tokens[0]?.revoked).toBe(false);
    expect(tokens[1]?.revoked).toBe(true);
    expect(mocks.older).not.toHaveBeenCalled();
  });

  it('returns actionable HTTP feedback without leaking provider details', async () => {
    mocks.mail.mockRejectedValueOnce(new Error('private mail provider credential detail'));
    const response = await request(app).post('/resend').send({ email: recipient.email });
    expect(response.status).toBe(503);
    expect(response.body.message).toContain('previous unexpired verification link is unchanged');
    expect(JSON.stringify(response.body)).not.toContain('private');
    expect(response.body).not.toHaveProperty('stack');
    expect(tokens[0]?.revoked).toBe(false);
  });

  it('preserves the previous link if replacement persistence fails', async () => {
    const unavailable = new Error('database unavailable');
    mocks.create.mockRejectedValueOnce(unavailable);
    await expect(resendEmailVerification(recipient.email)).rejects.toBe(unavailable);
    expect(tokens[0]?.revoked).toBe(false);
    expect(mocks.mail).not.toHaveBeenCalled();
    expect(mocks.revokeAll).not.toHaveBeenCalled();
  });

  it('retires older links only after accepted delivery', async () => {
    await expect(resendEmailVerification(recipient.email)).resolves.toMatchObject({ message: expect.stringContaining('If') });
    expect(tokens[0]?.revoked).toBe(true);
    expect(tokens[1]?.revoked).toBe(false);
    expect(mocks.older).toHaveBeenCalledWith(recipient.id, 'EMAIL_VERIFY', tokens[1]?.id, tokens[1]?.createdAt);
    expect(mocks.mail.mock.invocationCallOrder[0]).toBeLessThan(mocks.older.mock.invocationCallOrder[0]!);
  });

  it('does not turn delivered mail into a failed request when older-link cleanup fails', async () => {
    mocks.older.mockRejectedValueOnce(new Error('cleanup unavailable'));
    await expect(resendEmailVerification(recipient.email)).resolves.toMatchObject({ message: expect.stringContaining('If') });
    expect(tokens[1]?.revoked).toBe(false);
    expect(mocks.revoke).not.toHaveBeenCalled();
  });

  it('does not revoke a newer delivered link when an older mail request finishes last', async () => {
    const completions: Array<() => void> = [];
    mocks.mail.mockImplementation(() => new Promise(resolve => {
      completions.push(() => resolve({ messageId: 'intercepted' }));
    }));
    const first = resendEmailVerification(recipient.email);
    const second = resendEmailVerification(recipient.email);
    await vi.waitFor(() => expect(completions).toHaveLength(2));
    completions[1]!();
    await second;
    completions[0]!();
    await first;
    expect(tokens[2]?.revoked).toBe(false);
    expect(tokens[1]?.revoked).toBe(true);
    expect(mocks.revokeAll).not.toHaveBeenCalled();
  });

  it('keeps an earlier successful link if a newer concurrent delivery fails', async () => {
    mocks.mail.mockResolvedValueOnce({ messageId: 'first accepted' }).mockRejectedValueOnce(new Error('second delivery failed'));
    const outcomes = await Promise.allSettled([
      resendEmailVerification(recipient.email), resendEmailVerification(recipient.email),
    ]);
    expect(outcomes[0]?.status).toBe('fulfilled');
    expect(outcomes[1]?.status).toBe('rejected');
    expect(tokens[1]?.revoked).toBe(false);
    expect(tokens[2]?.revoked).toBe(true);
  });

  it('does not mutually revoke concurrent links with identical creation timestamps', async () => {
    mocks.create.mockImplementation(async () => {
      const record = { id: `replacement-${tokens.length}`, createdAt: new Date(2_000), revoked: false };
      tokens.push(record);
      return record;
    });
    await Promise.all([resendEmailVerification(recipient.email), resendEmailVerification(recipient.email)]);
    expect(tokens[0]?.revoked).toBe(true);
    expect(tokens[1]?.revoked).toBe(false);
    expect(tokens[2]?.revoked).toBe(false);
  });

  it('keeps recovery neutral for unknown or already verified addresses', async () => {
    mocks.user.mockResolvedValueOnce(null);
    const unknown = await resendEmailVerification('unknown@example.invalid');
    mocks.user.mockResolvedValueOnce({ ...recipient, emailVerified: new Date() });
    const verified = await resendEmailVerification(recipient.email);
    expect(unknown).toEqual(verified);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.mail).not.toHaveBeenCalled();
  });
});
