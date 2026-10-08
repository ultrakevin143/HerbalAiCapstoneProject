import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ wallet: vi.fn(), purchase: vi.fn(), answer: vi.fn(), fulfill: vi.fn() }));
vi.mock('../src/repositories/credits.repository.js', () => ({ getCreditWallet: mocks.wallet, createCreditPurchase: mocks.purchase, getCompletedCreditResponse: mocks.answer, fulfillTestPurchase: mocks.fulfill }));
vi.mock('../src/middlewares/auth.middleware.js', () => ({ AuthMiddleware: class {
  execute(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userId = req.get('X-TEST-User');
    if (!userId) { res.status(401).end(); return; }
    Object.assign(req, { user: { userId, role: 'contributor' } }); next();
  }
} }));
import router from '../src/routes/credits.routes.js';
import { testCreditsWebhook } from '../src/controllers/credits-webhook.controller.js';

const app = express();
app.post('/webhook', express.raw({ type: 'application/json', limit: '64kb' }), testCreditsWebhook);
app.use(express.json()); app.use('/credits', router);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(error.status ?? 500).json({ message: error.message }); });
const key = '7a463e2d-9f94-4ed2-90ab-e29ad36e2b6e';
const secret = 'TEST ONLY webhook secret';
const event = { data: { id: 'evt_TEST', type: 'event', attributes: { type: 'checkout_session.payment.paid', livemode: false, data: { id: 'cs_TEST', attributes: { livemode: false } } } } };
const signed = (raw: string) => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return `t=${timestamp},te=${createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')},li=`;
};
const postEvent = (raw: string, signature = signed(raw)) => request(app).post('/webhook').set('Content-Type', 'application/json').set('Paymongo-Signature', signature).send(raw);

describe('test wallet HTTP boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv('DR_AI_CREDITS_MODE', 'test'); vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[]'); vi.stubEnv('DR_AI_TRIAL_CREDITS', '0'); vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', 'sk_test_SYNTHETIC'); vi.stubEnv('PAYMONGO_TEST_WEBHOOK_SECRET', secret);
    mocks.wallet.mockResolvedValue({ balance: 3, ledger: [], purchases: [], requests: [] });
    mocks.purchase.mockResolvedValue({ checkoutUrl: 'https://checkout.paymongo.com/TEST', testMode: true });
    mocks.answer.mockResolvedValue({ reply: 'TEST saved answer.' });
    mocks.fulfill.mockResolvedValue({ credited: true });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['/credits', `/credits/answers/${key}`])('requires authentication at %s', async path => {
    expect((await request(app).get(path)).status).toBe(401);
    expect(mocks.wallet).not.toHaveBeenCalled(); expect(mocks.answer).not.toHaveBeenCalled();
  });
  it('does not query wallet tables when disabled', async () => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'off');
    const response = await request(app).get('/credits').set('X-TEST-User', 'TEST-owner');
    expect(response.body.data.enabled).toBe(false); expect(response.headers['cache-control']).toBe('private, no-store'); expect(mocks.wallet).not.toHaveBeenCalled();
  });
  it('ignores attempted account overrides and returns only the authenticated wallet', async () => {
    const response = await request(app).get('/credits?userId=TEST-other').set('X-TEST-User', 'TEST-owner');
    expect(response.status).toBe(200); expect(mocks.wallet).toHaveBeenCalledWith('TEST-owner'); expect(response.headers['cache-control']).toBe('private, no-store');
  });
  it('rejects client-supplied prices, credits and owners before checkout', async () => {
    const response = await request(app).post('/credits/checkout').set('X-TEST-User', 'TEST-owner').send({ packageId: 'test', requestId: key, amountMinor: 1, credits: 999, userId: 'TEST-other' });
    expect(response.status).toBe(400); expect(mocks.purchase).not.toHaveBeenCalled();
  });
  it('passes only a validated package, key and authenticated owner to checkout', async () => {
    expect((await request(app).post('/credits/checkout').set('X-TEST-User', 'TEST-owner').send({ packageId: 'test', requestId: key })).status).toBe(201);
    expect(mocks.purchase).toHaveBeenCalledWith('TEST-owner', 'test', key);
  });
  it('scopes saved-answer reads to the authenticated account', async () => {
    expect((await request(app).get(`/credits/answers/${key}?userId=TEST-other`).set('X-TEST-User', 'TEST-owner')).status).toBe(200);
    expect(mocks.answer).toHaveBeenCalledWith('TEST-owner', key);
  });
  it('never fulfills unsigned, altered or non-JSON events', async () => {
    const raw = JSON.stringify(event);
    expect((await request(app).post('/webhook').send(event)).status).toBe(400);
    expect((await postEvent(`${raw} `, signed(raw))).status).toBe(400);
    expect((await postEvent('not JSON')).status).toBe(400);
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });
  it('rejects live or unrelated signed events', async () => {
    expect((await postEvent(JSON.stringify({ data: { ...event.data, attributes: { ...event.data.attributes, livemode: true } } }))).status).toBe(400);
    expect((await postEvent(JSON.stringify({ data: { ...event.data, attributes: { ...event.data.attributes, type: 'payment.refunded' } } }))).status).toBe(400);
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });
  it('accepts only verified test checkout events and leaves duplicate protection to the transaction', async () => {
    expect((await postEvent(JSON.stringify(event))).status).toBe(200);
    expect(mocks.fulfill).toHaveBeenCalledWith('cs_TEST');
  });
  it('rejects disabled webhooks and oversized payloads', async () => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'off'); expect((await postEvent(JSON.stringify(event))).status).toBe(404);
    expect((await postEvent('x'.repeat(65537))).status).toBe(413); expect(mocks.fulfill).not.toHaveBeenCalled();
  });
});
