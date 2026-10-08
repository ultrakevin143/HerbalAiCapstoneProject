import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ reserve: vi.fn(), complete: vi.fn(), release: vi.fn(), ask: vi.fn(), stream: vi.fn() }));
vi.mock('../src/repositories/credits.repository.js', () => ({ reserveCreditRequest: mocks.reserve, completeCreditRequest: mocks.complete, releaseCreditRequest: mocks.release }));
vi.mock('../src/services/chat.service.js', () => ({ askDrAi: mocks.ask, streamDrAi: mocks.stream }));
import { sendMessage, streamMessage } from '../src/controllers/chat.controller.js';
import { CreditError } from '../src/config/credits.js';

const app = express(); app.use(express.json());
app.use((req, _res, next) => { Object.assign(req, { user: { userId: 'TEST-credits-user', role: 'contributor' } }); next(); });
app.post('/chat', sendMessage); app.post('/stream', streamMessage);
const key = '7a463e2d-9f94-4ed2-90ab-e29ad36e2b6e';
const send = (path = '/chat') => request(app).post(path).set('X-Idempotency-Key', key).send({ message: 'TEST ONLY herb question.', history: [] });

describe('credit settlement around streaming and nonstreaming chat', () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv('DR_AI_CREDITS_MODE', 'test'); vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[]'); vi.stubEnv('DR_AI_TRIAL_CREDITS', '0'); vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', '');
    mocks.reserve.mockResolvedValue({ id: 'TEST-reservation', userId: 'TEST-credits-user', replay: null });
    mocks.complete.mockResolvedValue(undefined); mocks.release.mockResolvedValue(undefined);
    mocks.ask.mockResolvedValue({ reply: 'TEST ONLY completed answer.', sources: [] });
    mocks.stream.mockResolvedValue({ sources: [], chunks: (async function* () { yield 'TEST ONLY completed answer.'; })(), getResult: () => ({ reply: 'TEST ONLY completed answer.', sources: [] }) });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['/chat', '/stream'])('settles one reservation on completed %s', async path => {
    expect((await send(path)).status).toBe(200);
    expect(mocks.reserve).toHaveBeenCalledOnce(); expect(mocks.complete).toHaveBeenCalledOnce(); expect(mocks.release).not.toHaveBeenCalled();
  });
  it.each(['/chat', '/stream'])('refuses zero balance before generating %s', async path => {
    mocks.reserve.mockRejectedValue(new CreditError(402, 'No test credits.'));
    expect((await send(path)).status).toBe(402);
    expect(mocks.ask).not.toHaveBeenCalled(); expect(mocks.stream).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it.each(['/chat', '/stream'])('replays a completed answer without another charge or generation: %s', async path => {
    mocks.reserve.mockResolvedValue({ id: 'TEST-existing', userId: 'TEST-credits-user', replay: { reply: 'TEST saved answer.', history: [], sources: [] } });
    expect((await send(path)).status).toBe(200);
    expect(mocks.ask).not.toHaveBeenCalled(); expect(mocks.stream).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled(); expect(mocks.release).not.toHaveBeenCalled();
  });
  it('refunds a failed nonstreaming request exactly once', async () => {
    mocks.ask.mockRejectedValue(new Error('TEST provider failed'));
    expect((await send()).status).toBe(503); expect(mocks.release).toHaveBeenCalledOnce(); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('refunds an incomplete stream and does not emit a completion event', async () => {
    mocks.stream.mockResolvedValue({ sources: [], chunks: (async function* () { yield 'partial'; throw new Error('TEST stream failed'); })(), getResult: () => ({ reply: 'partial', sources: [] }) });
    const response = await send('/stream'); expect(response.text).toContain('event: error'); expect(response.text).not.toContain('event: done'); expect(mocks.release).toHaveBeenCalledOnce(); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('does not charge an empty answer or unsuccessful settlement', async () => {
    mocks.ask.mockResolvedValue({ reply: '', sources: [] }); expect((await send()).status).toBe(503); expect(mocks.release).toHaveBeenCalledOnce();
    mocks.ask.mockResolvedValue({ reply: 'test', sources: [] }); mocks.complete.mockRejectedValue(new Error('TEST save failure'));
    expect((await send()).status).toBe(503); expect(mocks.release).toHaveBeenCalledTimes(2);
  });
  it('requires a valid request identifier in test billing mode', async () => {
    expect((await request(app).post('/chat').send({ message: 'test' })).status).toBe(400); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it('keeps the existing free path unchanged while billing is off', async () => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'off'); expect((await send()).status).toBe(200); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled();
  });
});
