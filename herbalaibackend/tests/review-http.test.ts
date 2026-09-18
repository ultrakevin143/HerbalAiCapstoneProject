import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ find: vi.fn(), approve: vi.fn(), requestChanges: vi.fn(), reject: vi.fn(), notify: vi.fn(), embed: vi.fn(), mail: vi.fn(), emit: vi.fn(), resubmit: vi.fn(), upload: vi.fn(), user: vi.fn() }));
vi.mock('../src/repositories/suggest.repository.js', () => ({ findSuggestionById: mocks.find, approveSuggestion: mocks.approve, requestChanges: mocks.requestChanges, rejectSuggestion: mocks.reject, resubmitSuggestion: mocks.resubmit }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { herb: { findFirst: vi.fn(async () => null) }, suggestedHerb: { findFirst: vi.fn(async () => null) }, user: { findUnique: mocks.user } } }));
vi.mock('../src/repositories/herb.repository.js', () => ({ invalidateHerbCache: vi.fn() }));
vi.mock('../src/repositories/notification.repository.js', () => ({ createNotification: mocks.notify }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed }));
vi.mock('../src/services/cloudinary.service.js', () => ({ uploadToCloudinary: mocks.upload }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: mocks.mail }));
vi.mock('../src/server.js', () => ({ io: { to: () => ({ emit: mocks.emit }) } }));

import { SuggestController } from '../src/controllers/suggest.controller.js';
import { approveSuggestionSchema, requestSuggestionChangesSchema, rejectSuggestionSchema } from '../src/schema/suggest.schema.js';
import { validateSchema } from '../src/middlewares/validate.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
const controller = new SuggestController();
app.use(express.json());
app.use((req, _res, next) => { Object.assign(req, { user: { userId: 'qa-admin', role: 'admin' } }); next(); });
app.post('/:id/approve', validateSchema(approveSuggestionSchema), controller.approveSuggestion);
app.post('/:id/request-changes', validateSchema(requestSuggestionChangesSchema), controller.requestChanges);
app.post('/:id/reject', validateSchema(rejectSuggestionSchema), controller.rejectSuggestion);
app.post('/:id/resubmit', controller.resubmit);
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const response = errorResponse(error, false);
  res.status(response.status).json(response.body);
});

const content = { localName: 'QA', scientificName: 'QA only', category: 'Test', medicinalUses: 'None', preparationMethod: 'None', dosage: 'None', informationSource: 'QA citation' };
const body = { revision: 2, evidenceClass: 'DOCUMENTED_TRADITIONAL_USE', reviewNotes: 'Please clarify the source.' };
describe('Review HTTP results and side effects', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.find.mockResolvedValue({ ...content, id: 7, status: 'Pending', revision: 2, submitterId: 'qa-owner', references: [{ title: 'QA source', citation: 'QA citation', supports: ['identity'] }] });
    mocks.embed.mockResolvedValue([1, 0]);
    mocks.notify.mockResolvedValue({ id: 1 });
    mocks.user.mockResolvedValue({ name: 'QA', email: 'qa@example.invalid' });
    mocks.mail.mockResolvedValue(undefined);
  });

  it.each(['approve', 'request-changes', 'reject'])('requires a browser revision for %s', async (action) => {
    const { revision, ...withoutRevision } = body;
    expect((await request(app).post(`/7/${action}`).send(withoutRevision)).status).toBe(400);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.requestChanges).not.toHaveBeenCalled();
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it.each(['approve', 'request-changes', 'reject'])('returns conflict for a lost %s race without notifications', async (action) => {
    mocks.approve.mockResolvedValue(null);
    mocks.requestChanges.mockResolvedValue(null);
    mocks.reject.mockResolvedValue(null);
    const response = await request(app).post(`/7/${action}`).send(body);
    expect(response.status).toBe(409);
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.mail).not.toHaveBeenCalled();
  });

  it('returns a safe error when a transaction cannot start', async () => {
    mocks.requestChanges.mockRejectedValue(Object.assign(new Error('Transaction API error: Unable to start a transaction in the given time.'), { code: 'P2028' }));
    const response = await request(app).post('/7/request-changes').send(body);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('DATABASE_UNAVAILABLE');
    expect(response.body.message).toContain('Refresh');
    expect(response.body).not.toHaveProperty('stack');
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it.each(['approve', 'request-changes', 'reject'])('returns conflict for %s on an already decided submission', async (action) => {
    mocks.find.mockResolvedValue({ id: 7, status: 'Approved', revision: 3 });
    expect((await request(app).post(`/7/${action}`).send(body)).status).toBe(409);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.requestChanges).not.toHaveBeenCalled();
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it('stops publication when embedding generation fails', async () => {
    mocks.embed.mockRejectedValue(new Error('Test provider failure'));
    expect((await request(app).post('/7/approve').send(body)).status).toBe(503);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it('publishes once and sends notification only after repository success', async () => {
    mocks.approve.mockResolvedValue({ id: 'qa-herb' });
    const response = await request(app).post('/7/approve').send(body);
    expect(response.status).toBe(200);
    expect(mocks.approve).toHaveBeenCalledWith(7, 'qa-admin', '[1,0]', body.evidenceClass, body.reviewNotes, 2);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.mail).toHaveBeenCalledTimes(1);
    expect(mocks.approve.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]!);
  });

  it('does not turn a committed publication into a failure when notifications fail', async () => {
    mocks.approve.mockResolvedValue({ id: 'qa-herb' });
    mocks.notify.mockRejectedValue(new Error('Test notification failure'));
    expect((await request(app).post('/7/approve').send(body)).status).toBe(200);
    expect(mocks.approve).toHaveBeenCalledTimes(1);
  });

  it('does not repeat or report failed publication when email delivery fails', async () => {
    mocks.approve.mockResolvedValue({ id: 'qa-herb' });
    mocks.mail.mockRejectedValue(new Error('Test mail failure'));
    expect((await request(app).post('/7/approve').send(body)).status).toBe(200);
    expect(mocks.approve).toHaveBeenCalledTimes(1);
    expect(mocks.mail).toHaveBeenCalledTimes(1);
  });

  it('preserves an existing image when the owner resubmits without uploading', async () => {
    mocks.find.mockResolvedValue({ ...content, id: 7, submitterId: 'qa-admin', status: 'ChangesRequested', imageUrl: '/images/herbs/qa.jpg' });
    mocks.resubmit.mockResolvedValue({ id: 7, status: 'Pending' });
    expect((await request(app).post('/7/resubmit').send(content)).status).toBe(200);
    expect(mocks.resubmit).toHaveBeenCalledWith(7, 'qa-admin', expect.objectContaining({ imageUrl: '/images/herbs/qa.jpg' }));
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
