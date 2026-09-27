import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { environment, smtpSend } = vi.hoisted(() => ({
  environment: {
    APP_NAME: 'Herbal-Ai',
    EMAIL_DELIVERY_MODE: 'live',
    EMAIL_ALLOWED_RECIPIENTS: [] as string[],
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 'test-api-key',
    RESEND_FROM_EMAIL: 'verified@example.com',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_FROM: '',
  },
  smtpSend: vi.fn(),
}));

vi.mock('../src/config/env.js', () => ({ ENV: environment }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: smtpSend }) } }));

import { ensureMailReady, sendMail } from '../src/lib/mailer.js';

const message = { to: 'recipient@example.com', subject: 'Verify your email', html: '<p>Verify</p>' };

beforeEach(() => {
  environment.EMAIL_DELIVERY_MODE = 'live';
  environment.EMAIL_PROVIDER = 'resend';
  environment.RESEND_API_KEY = 'test-api-key';
  environment.RESEND_FROM_EMAIL = 'verified@example.com';
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('email delivery', () => {
  it('uses the HTTPS email API with a verified sender', async () => {
    const apiCall = vi.mocked(fetch);
    apiCall.mockResolvedValue(new Response(JSON.stringify({ id: 'sent-123' }), { status: 200 }));

    await expect(sendMail(message)).resolves.toEqual({ id: 'sent-123' });
    expect(apiCall).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
      body: JSON.stringify({
        from: '"Herbal-Ai" <verified@example.com>',
        to: ['recipient@example.com'],
        subject: message.subject,
        html: message.html,
      }),
    }));
    expect(smtpSend).not.toHaveBeenCalled();
  });

  it('fails before sending when the API is not configured', () => {
    environment.RESEND_API_KEY = '';
    expect(() => ensureMailReady(message.to)).toThrow('Email delivery is not configured.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports provider rejection without exposing the response body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('private provider details', { status: 403 }));
    await expect(sendMail(message)).rejects.toThrow('Email provider rejected the request (HTTP 403).');
  });

  it('keeps local log mode free of external delivery', async () => {
    environment.EMAIL_DELIVERY_MODE = 'log';
    await expect(sendMail(message)).resolves.toMatchObject({ suppressed: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});
