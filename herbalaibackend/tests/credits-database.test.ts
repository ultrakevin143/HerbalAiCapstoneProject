import { createHmac, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import express from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ client: null as PrismaClient | null, create: vi.fn(), retrieve: vi.fn(), ask: vi.fn(), stream: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ get prisma() { return state.client; } }));
vi.mock('../src/services/paymongo-test.service.js', async importOriginal => ({ ...await importOriginal<typeof import('../src/services/paymongo-test.service.js')>(), createTestCheckout: state.create, retrieveTestCheckout: state.retrieve }));
vi.mock('../src/services/chat.service.js', () => ({ askDrAi: state.ask, streamDrAi: state.stream }));
import { completeCreditRequest, createCreditPurchase, fulfillTestPurchase, getCompletedCreditResponse, getCreditWallet, reconcileTestPurchase, releaseCreditRequest, reserveCreditRequest } from '../src/repositories/credits.repository.js';
import creditsRouter from '../src/routes/credits.routes.js';
import chatRouter from '../src/routes/chat.routes.js';
import { testCreditsWebhook } from '../src/controllers/credits-webhook.controller.js';
import { generateAccessToken } from '../src/utils/jwt.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'];
if (!connectionUrl && process.env['CI']) throw new Error('CI must configure HERBALAI_TEST_DATABASE_URL; do not silently skip wallet transaction checks.');
if (connectionUrl) {
  const connection = new URL(connectionUrl);
  if (connection.protocol !== 'postgresql:' || connection.hostname !== '127.0.0.1' || connection.pathname !== '/herbalai_test') throw new Error('Credits require an isolated loopback herbalai_test database.');
}
const schema = `qa_credits_${randomUUID().replaceAll('-', '')}`;
let pool: pg.Pool;
const owner = 'TEST-credit-owner';
const other = 'TEST-other-owner';
const question = { message: 'TEST ONLY question.', history: [] };
const response = { reply: 'TEST ONLY answer.', history: [], sources: [] };
const walletBalance = async () => (await getCreditWallet(owner)).balance;
const paidSession = (orderId: string, amount = 10000) => ({ id: 'cs_TEST', attributes: { livemode: false, reference_number: orderId, payments: [{ id: 'pay_TEST', attributes: { livemode: false, amount, currency: 'PHP', status: 'paid', refunds: [], disputed: false } }] } });

const app = express();
app.post('/webhook', express.raw({ type: 'application/json', limit: '64kb' }), testCreditsWebhook);
app.use(express.json()); app.use('/credits', creditsRouter); app.use('/chat', chatRouter);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(error.status ?? 500).json({ message: error.message }); });
const bearer = (userId = owner) => `Bearer ${generateAccessToken({ userId, role: 'contributor', sessionVersion: 0 })}`;
const chat = (key: string, path = '/chat') => request(app).post(path).set('Authorization', bearer()).set('X-Idempotency-Key', key).send(question);

describe.skipIf(!connectionUrl)('real PostgreSQL test wallet transactions', () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: connectionUrl, max: 4, connectionTimeoutMillis: 3000, options: `-c search_path=${schema},public` });
    await pool.query(`CREATE SCHEMA "${schema}"`);
    await pool.query(`CREATE TABLE "User" (id TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'contributor', session_version INTEGER NOT NULL DEFAULT 0, "isBanned" BOOLEAN NOT NULL DEFAULT false, "banExpiresAt" TIMESTAMP(3), "banReason" VARCHAR(500))`);
    await pool.query(await readFile(new URL('../prisma/migrations/20261008110000_add_test_credit_wallet/migration.sql', import.meta.url), 'utf8'));
    await pool.query(await readFile(new URL('../prisma/migrations/20261010120000_add_expired_credit_purchase/migration.sql', import.meta.url), 'utf8'));
    state.client = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  });
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('DR_AI_CREDITS_MODE', 'test');
    vi.stubEnv('DR_AI_TRIAL_CREDITS', '3');
    vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[{"id":"test-pack","name":"TEST ONLY","credits":10,"amountMinor":10000}]');
    vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', 'sk_test_SYNTHETIC');
    vi.stubEnv('PAYMONGO_TEST_WEBHOOK_SECRET', 'TEST ONLY');
    await pool.query('TRUNCATE "CreditWallet", "CreditLedger", "CreditRequest", "CreditPurchase", "User"');
    await pool.query('INSERT INTO "User" (id) VALUES ($1), ($2)', [owner, other]);
    state.create.mockResolvedValue({ id: 'cs_TEST', url: 'https://checkout.paymongo.com/TEST' });
    state.ask.mockResolvedValue(response);
    state.stream.mockResolvedValue({ sources: [], chunks: (async function* () { yield response.reply; })(), getResult: () => response });
  });
  afterEach(() => vi.unstubAllEnvs());
  afterAll(async () => {
    if (state.client) await state.client.$disconnect();
    if (pool) { try { await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await pool.end(); } }
  });

  it('grants trial credits once under concurrent wallet reads', async () => {
    const wallets = await Promise.all([getCreditWallet(owner), getCreditWallet(owner)]);
    expect(wallets.map(wallet => wallet.balance)).toEqual([3, 3]);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger"')).rows[0].count).toBe(1);
  });
  it('grants the ten-credit default once and independently for each account', async () => {
    vi.stubEnv('DR_AI_TRIAL_CREDITS', undefined);
    const wallets = await Promise.all([getCreditWallet(owner), getCreditWallet(owner), getCreditWallet(other)]);
    expect(wallets.map(wallet => wallet.balance)).toEqual([10, 10, 10]);
    const trials = await pool.query('SELECT "userId", delta FROM "CreditLedger" WHERE kind = $1 ORDER BY "userId"', ['TRIAL']);
    expect(trials.rows).toEqual([owner, other].sort().map(userId => ({ userId, delta: 10 })));
    const handle = await reserveCreditRequest(owner, randomUUID(), question);
    await completeCreditRequest(handle, response);
    vi.stubEnv('DR_AI_TRIAL_CREDITS', '100');
    expect(await walletBalance()).toBe(9);
    expect((await getCreditWallet(other)).balance).toBe(10);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind = $1', ['TRIAL'])).rows[0].count).toBe(2);
  });
  it('charges ten completed questions once each then blocks both chat endpoints without refilling', async () => {
    vi.stubEnv('DR_AI_TRIAL_CREDITS', undefined);
    const firstKey = randomUUID();
    for (const index of Array.from({ length: 10 }, (_, index) => index)) {
      const handle = await reserveCreditRequest(owner, index === 0 ? firstKey : randomUUID(), question);
      await completeCreditRequest(handle, response);
      expect(await walletBalance()).toBe(9 - index);
    }
    expect((await reserveCreditRequest(owner, firstKey, question)).replay).toEqual(response);
    expect(await walletBalance()).toBe(0);
    expect((await chat(randomUUID())).status).toBe(402);
    expect((await chat(randomUUID(), '/chat/stream')).status).toBe(402);
    expect(state.ask).not.toHaveBeenCalled();
    expect(state.stream).not.toHaveBeenCalled();
    const wallet = await request(app).get('/credits').set('Authorization', bearer());
    expect(wallet.status).toBe(200);
    expect(wallet.body.data.balance).toBe(0);
    const ledger = await pool.query('SELECT kind, COUNT(*)::int AS count, SUM(delta)::int AS total FROM "CreditLedger" WHERE "userId" = $1 GROUP BY kind ORDER BY kind', [owner]);
    expect(ledger.rows).toEqual([{ kind: 'RESERVE', count: 10, total: -10 }, { kind: 'TRIAL', count: 1, total: 10 }]);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditRequest" WHERE "userId"=$1 AND status=$2', [owner, 'COMPLETED'])).rows[0].count).toBe(10);
  });
  it('serializes simultaneous questions without allowing a negative balance', async () => {
    vi.stubEnv('DR_AI_TRIAL_CREDITS', '1');
    const results = await Promise.allSettled([reserveCreditRequest(owner, randomUUID(), question), reserveCreditRequest(owner, randomUUID(), question)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(await walletBalance()).toBe(0);
  });
  it('rejects a concurrent duplicate identifier and refunds exactly once', async () => {
    const key = randomUUID();
    const handle = await reserveCreditRequest(owner, key, question);
    await expect(reserveCreditRequest(owner, key, question)).rejects.toMatchObject({ status: 409 });
    await Promise.all([releaseCreditRequest(handle), releaseCreditRequest(handle)]);
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind = $1', ['REFUND'])).rows[0].count).toBe(1);
  });
  it('settles once and replays the saved response without consuming another credit', async () => {
    const key = randomUUID();
    const handle = await reserveCreditRequest(owner, key, question);
    await completeCreditRequest(handle, response);
    expect((await reserveCreditRequest(owner, key, question)).replay).toEqual(response);
    await releaseCreditRequest(handle);
    expect(await walletBalance()).toBe(2);
    await expect(reserveCreditRequest(owner, key, { message: 'Different' })).rejects.toMatchObject({ status: 409 });
    await expect(completeCreditRequest(handle, response)).rejects.toMatchObject({ status: 409 });
  });
  it('keeps saved answers private to their owner', async () => {
    const key = randomUUID();
    await completeCreditRequest(await reserveCreditRequest(owner, key, question), response);
    expect(await getCompletedCreditResponse(owner, key)).toEqual(response);
    await expect(getCompletedCreditResponse(other, key)).rejects.toMatchObject({ status: 404 });
    expect((await getCreditWallet(other)).requests).toEqual([]);
  });
  it('commits expiry refunds even when the old request key is rejected', async () => {
    const key = randomUUID();
    const handle = await reserveCreditRequest(owner, key, question);
    await pool.query('UPDATE "CreditRequest" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL \'1 second\' WHERE id = $1', [handle.id]);
    await expect(reserveCreditRequest(owner, key, question)).rejects.toMatchObject({ status: 409 });
    expect(await walletBalance()).toBe(3);
    await expect(completeCreditRequest(handle, response)).rejects.toMatchObject({ status: 409 });
  });
  it('rolls back a debit if its ledger write fails', async () => {
    await getCreditWallet(owner);
    await pool.query('ALTER TABLE "CreditLedger" ADD CONSTRAINT test_block_reserve CHECK (kind <> \'RESERVE\')');
    try { await expect(reserveCreditRequest(owner, randomUUID(), question)).rejects.toThrow(); }
    finally { await pool.query('ALTER TABLE "CreditLedger" DROP CONSTRAINT test_block_reserve'); }
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditRequest"')).rows[0].count).toBe(0);
  });
  it('reuses an existing checkout and grants a verified top-up exactly once', async () => {
    const key = randomUUID();
    const purchase = await createCreditPurchase(owner, 'test-pack', key);
    expect(await createCreditPurchase(owner, 'test-pack', key)).toEqual(purchase);
    expect(state.create).toHaveBeenCalledOnce();
    state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
    const results = await Promise.all([fulfillTestPurchase('cs_TEST'), fulfillTestPurchase('cs_TEST')]);
    expect(results.filter(result => result.credited)).toHaveLength(1);
    expect(await walletBalance()).toBe(13);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind = $1', ['TOPUP'])).rows[0].count).toBe(1);
  });
  it.each(['amount', 'currency', 'refunded', 'disputed', 'identity', 'reference'])('does not credit a mismatched %s', async mismatch => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    const session = paidSession(purchase.purchaseId);
    if (mismatch === 'amount') session.attributes.payments[0]!.attributes.amount = 1;
    if (mismatch === 'currency') session.attributes.payments[0]!.attributes.currency = 'USD';
    if (mismatch === 'refunded') Object.assign(session.attributes.payments[0]!.attributes, { refunds: [{}] });
    if (mismatch === 'disputed') session.attributes.payments[0]!.attributes.disputed = true;
    if (mismatch === 'identity') session.id = 'cs_OTHER';
    if (mismatch === 'reference') session.attributes.reference_number = 'other-order';
    state.retrieve.mockResolvedValue(session);
    await expect(fulfillTestPurchase('cs_TEST')).rejects.toMatchObject({ status: 400 });
    expect(await walletBalance()).toBe(3);
  });
  it('does not retry an uncertain provider creation or accept client package overrides', async () => {
    state.create.mockRejectedValue(new Error('TEST timeout'));
    const key = randomUUID();
    await expect(createCreditPurchase(owner, 'test-pack', key)).rejects.toThrow();
    await expect(createCreditPurchase(owner, 'test-pack', key)).rejects.toMatchObject({ status: 409 });
    await expect(createCreditPurchase(owner, 'unknown', randomUUID())).rejects.toMatchObject({ status: 400 });
    expect(state.create).toHaveBeenCalledOnce();
    expect(await walletBalance()).toBe(3);
  });
  it('rolls back a top-up and paid marker when its ledger write fails', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
    await pool.query('ALTER TABLE "CreditLedger" ADD CONSTRAINT test_block_topup CHECK (kind <> \'TOPUP\')');
    try { await expect(fulfillTestPurchase('cs_TEST')).rejects.toThrow(); }
    finally { await pool.query('ALTER TABLE "CreditLedger" DROP CONSTRAINT test_block_topup'); }
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT status, "paymentId" FROM "CreditPurchase"')).rows[0]).toEqual({ status: 'PENDING', paymentId: null });
    await fulfillTestPurchase('cs_TEST'); expect(await walletBalance()).toBe(13);
  });
  it('blocks another request identifier while the same package has an unpaid checkout', async () => {
    const first = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.create.mockResolvedValue({ id: 'cs_SECOND', url: 'https://checkout.paymongo.com/SECOND' });
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
    expect(state.create).toHaveBeenCalledOnce();
    const wallet = await getCreditWallet(owner);
    expect(wallet.purchases).toEqual([expect.objectContaining({ id: first.purchaseId, requestKey: expect.any(String), checkoutUrl: first.checkoutUrl, packageId: 'test-pack', status: 'PENDING' })]);
    expect(wallet.balance).toBe(3);
  });
  it('blocks a fresh identifier after uncertain creation instead of creating a second checkout', async () => {
    state.create.mockRejectedValue(new Error('TEST ambiguous provider timeout'));
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toThrow();
    state.create.mockResolvedValue({ id: 'cs_SECOND', url: 'https://checkout.paymongo.com/SECOND' });
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
    expect(state.create).toHaveBeenCalledOnce();
  });
  it('rejects the same payment on another order without a partial grant', async () => {
    const first = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue(paidSession(first.purchaseId)); await fulfillTestPurchase('cs_TEST');
    state.create.mockResolvedValue({ id: 'cs_OTHER', url: 'https://checkout.paymongo.com/OTHER' });
    const second = await createCreditPurchase(other, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue({ ...paidSession(second.purchaseId), id: 'cs_OTHER' });
    await expect(fulfillTestPurchase('cs_OTHER')).rejects.toThrow();
    expect((await getCreditWallet(other)).balance).toBe(3);
    expect((await pool.query('SELECT status FROM "CreditPurchase" WHERE id = $1', [second.purchaseId])).rows[0].status).toBe('PENDING');
  });
  it('serializes fresh checkout identifiers while provider creation is in flight', async () => {
    let finishCheckout!: (value: { id: string; url: string }) => void;
    let reportStarted!: () => void;
    const started = new Promise<void>(resolve => { reportStarted = resolve; });
    state.create.mockImplementation(() => { reportStarted(); return new Promise(resolve => { finishCheckout = resolve; }); });
    const first = createCreditPurchase(owner, 'test-pack', randomUUID());
    await started;
    try {
      await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
      expect(state.create).toHaveBeenCalledOnce();
    } finally {
      finishCheckout({ id: 'cs_TEST', url: 'https://checkout.paymongo.com/TEST' });
      await first;
    }
    expect((await getCreditWallet(owner)).purchases).toHaveLength(1);
  });
  it('keeps checkout metadata private and scopes the unresolved guard to owner and package', async () => {
    vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[{"id":"test-pack","name":"TEST ONLY","credits":10,"amountMinor":10000},{"id":"other-pack","name":"OTHER TEST ONLY","credits":20,"amountMinor":20000}]');
    await createCreditPurchase(owner, 'test-pack', randomUUID());
    expect((await getCreditWallet(other)).purchases).toEqual([]);
    state.create.mockResolvedValue({ id: 'cs_OTHER', url: 'https://checkout.paymongo.com/OTHER' });
    await createCreditPurchase(other, 'test-pack', randomUUID());
    state.create.mockResolvedValue({ id: 'cs_PACKAGE', url: 'https://checkout.paymongo.com/PACKAGE' });
    await createCreditPurchase(owner, 'other-pack', randomUUID());
    expect((await getCreditWallet(owner)).purchases).toHaveLength(2);
    expect((await getCreditWallet(other)).purchases).toHaveLength(1);
    expect(state.create).toHaveBeenCalledTimes(3);
  });
  it('allows a deliberate new purchase only after the previous one is paid', async () => {
    const key = randomUUID();
    const first = await createCreditPurchase(owner, 'test-pack', key);
    state.retrieve.mockResolvedValue(paidSession(first.purchaseId));
    await fulfillTestPurchase('cs_TEST');
    await expect(createCreditPurchase(owner, 'test-pack', key)).rejects.toMatchObject({ status: 409 });
    state.create.mockResolvedValue({ id: 'cs_NEXT', url: 'https://checkout.paymongo.com/NEXT' });
    await createCreditPurchase(owner, 'test-pack', randomUUID());
    expect(state.create).toHaveBeenCalledTimes(2);
    expect(await walletBalance()).toBe(13);
  });
  it('recovers a paid checkout without a webhook and races settlement without double crediting', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
    const outcomes = await Promise.all([reconcileTestPurchase(owner, purchase.purchaseId), fulfillTestPurchase('cs_TEST'), reconcileTestPurchase(owner, purchase.purchaseId)]);
    expect(outcomes[0]).toMatchObject({ status: 'PAID' });
    expect(outcomes[2]).toMatchObject({ status: 'PAID' });
    expect(await walletBalance()).toBe(13);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind=\'TOPUP\'')).rows[0].count).toBe(1);
  });
  it('unlocks a new checkout only after provider-confirmed expiration with no payment attempt', async () => {
    const requestKey = randomUUID();
    const purchase = await createCreditPurchase(owner, 'test-pack', requestKey);
    state.retrieve.mockResolvedValue({ id: 'cs_TEST', attributes: { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: null, payments: [] } });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'EXPIRED' });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'EXPIRED' });
    expect(await walletBalance()).toBe(3);
    await expect(createCreditPurchase(owner, 'test-pack', requestKey)).rejects.toMatchObject({ status: 409 });
    state.create.mockResolvedValue({ id: 'cs_NEXT', url: 'https://checkout.paymongo.com/NEXT' });
    await createCreditPurchase(owner, 'test-pack', randomUUID());
    expect(state.create).toHaveBeenCalledTimes(2);
  });
  it('does not treat a failed payment attempt on an active checkout as expiry', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    const session = paidSession(purchase.purchaseId);
    session.attributes.payments[0]!.attributes.status = 'failed';
    state.retrieve.mockResolvedValue({ ...session, attributes: { ...session.attributes, status: 'active', payment_intent: { attributes: { status: 'awaiting_payment_method', livemode: false } } } });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'PENDING' });
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
    expect(await walletBalance()).toBe(3);
  });
  it('accepts failed-only expiration only when the last intent is not processing', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    const session = paidSession(purchase.purchaseId);
    session.attributes.payments[0]!.attributes.status = 'failed';
    state.retrieve.mockResolvedValue({ ...session, attributes: { ...session.attributes, status: 'expired', payment_intent: { attributes: { status: 'awaiting_payment_method', livemode: false } } } });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'EXPIRED' });
    expect(await walletBalance()).toBe(3);
  });
  it.each(['processing', 'awaiting_next_action', 'succeeded', 'unknown'])('does not unlock an expired checkout with %s intent', async intentStatus => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue({ id: 'cs_TEST', attributes: { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: { attributes: { status: intentStatus, livemode: false } }, payments: [] } });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'PENDING' });
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
  });
  it.each(['missing-intent', 'missing-payments', 'processing-payment', 'live', 'wrong-reference', 'wrong-identity'])('fails closed on %s expiration evidence', async mismatch => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    const attributes: Record<string, unknown> = { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: null, payments: [] };
    if (mismatch === 'missing-intent') delete attributes['payment_intent'];
    if (mismatch === 'missing-payments') delete attributes['payments'];
    if (mismatch === 'processing-payment') attributes['payments'] = [{ id: 'pay_TEST', attributes: { livemode: false, status: 'processing', amount: 10000, currency: 'PHP' } }];
    if (mismatch === 'live') attributes['livemode'] = true;
    if (mismatch === 'wrong-reference') attributes['reference_number'] = 'OTHER-order';
    state.retrieve.mockResolvedValue({ id: mismatch === 'wrong-identity' ? 'cs_OTHER' : 'cs_TEST', attributes });
    if (['live', 'wrong-reference', 'wrong-identity'].includes(mismatch)) await expect(reconcileTestPurchase(owner, purchase.purchaseId)).rejects.toMatchObject({ status: 503 });
    else expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'PENDING' });
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
    expect(await walletBalance()).toBe(3);
  });
  it('does not expose another owner purchase or query the provider for it', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    await expect(reconcileTestPurchase(other, purchase.purchaseId)).rejects.toMatchObject({ status: 404 });
    expect(state.retrieve).not.toHaveBeenCalled();
  });
  it.each(['amount', 'currency', 'refunded', 'disputed', 'multiple-paid', 'live-payment'])('does not settle invalid %s payment through status recovery', async mismatch => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    const session = paidSession(purchase.purchaseId);
    if (mismatch === 'amount') session.attributes.payments[0]!.attributes.amount = 1;
    if (mismatch === 'currency') session.attributes.payments[0]!.attributes.currency = 'USD';
    if (mismatch === 'refunded') Object.assign(session.attributes.payments[0]!.attributes, { refunds: [{}] });
    if (mismatch === 'disputed') session.attributes.payments[0]!.attributes.disputed = true;
    if (mismatch === 'multiple-paid') session.attributes.payments.push({ ...session.attributes.payments[0]!, id: 'pay_SECOND' });
    if (mismatch === 'live-payment') session.attributes.payments[0]!.attributes.livemode = true;
    state.retrieve.mockResolvedValue(session);
    await expect(reconcileTestPurchase(owner, purchase.purchaseId)).rejects.toMatchObject({ status: mismatch === 'live-payment' ? 503 : 400 });
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT status FROM "CreditPurchase" WHERE id=$1', [purchase.purchaseId])).rows[0].status).toBe('PENDING');
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind=\'TOPUP\'')).rows[0].count).toBe(0);
  });
  it('rolls back failed recovery settlement and grants exactly once on retry', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
    await pool.query('ALTER TABLE "CreditLedger" ADD CONSTRAINT test_block_recovered_topup CHECK (kind <> \'TOPUP\')');
    try { await expect(reconcileTestPurchase(owner, purchase.purchaseId)).rejects.toThrow(); }
    finally { await pool.query('ALTER TABLE "CreditLedger" DROP CONSTRAINT test_block_recovered_topup'); }
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT status FROM "CreditPurchase" WHERE id=$1', [purchase.purchaseId])).rows[0].status).toBe('PENDING');
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'PAID' });
    expect(await reconcileTestPurchase(owner, purchase.purchaseId)).toMatchObject({ status: 'PAID' });
    expect(await walletBalance()).toBe(13);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind=\'TOPUP\'')).rows[0].count).toBe(1);
  });
  it('runs status recovery through authenticated HTTP without trusting an owner query parameter', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue({ id: 'cs_TEST', attributes: { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: null, payments: [] } });
    expect((await request(app).post(`/credits/purchases/${purchase.purchaseId}/reconcile`).send({})).status).toBe(401);
    expect((await request(app).post(`/credits/purchases/${purchase.purchaseId}/reconcile?userId=${owner}`).set('Authorization', bearer(other)).send({})).status).toBe(404);
    expect(state.retrieve).not.toHaveBeenCalled();
    const checked = await request(app).post(`/credits/purchases/${purchase.purchaseId}/reconcile`).set('Authorization', bearer()).send({});
    expect(checked.status).toBe(200);
    expect(checked.headers['cache-control']).toBe('private, no-store');
    expect(checked.body.data.status).toBe('EXPIRED');
    expect(await walletBalance()).toBe(3);
  });
  it('keeps unknown provider creations locked without inventing a checkout identifier', async () => {
    state.create.mockRejectedValue(new Error('TEST ONLY timeout'));
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toThrow();
    const purchase = (await pool.query('SELECT id FROM "CreditPurchase" WHERE "userId"=$1', [owner])).rows[0];
    expect(await reconcileTestPurchase(owner, purchase.id)).toMatchObject({ status: 'UNCERTAIN' });
    expect(state.retrieve).not.toHaveBeenCalled();
    await expect(createCreditPurchase(owner, 'test-pack', randomUUID())).rejects.toMatchObject({ status: 409 });
  });
  it('keeps provider timeouts locked without modifying the wallet or purchase', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockRejectedValue(new Error('TEST ONLY unavailable'));
    await expect(reconcileTestPurchase(owner, purchase.purchaseId)).rejects.toThrow();
    expect((await pool.query('SELECT status FROM "CreditPurchase" WHERE id=$1', [purchase.purchaseId])).rows[0].status).toBe('PENDING');
    expect(await walletBalance()).toBe(3);
  });
  it('does not let stale expiry overwrite a racing paid webhook', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    let finishRead!: (value: unknown) => void;
    let reportRead!: () => void;
    const started = new Promise<void>(resolve => { reportRead = resolve; });
    state.retrieve.mockImplementationOnce(() => { reportRead(); return new Promise(resolve => { finishRead = resolve; }); });
    const pending = reconcileTestPurchase(owner, purchase.purchaseId);
    await started;
    try {
      state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
      await fulfillTestPurchase('cs_TEST');
    } finally {
      finishRead({ id: 'cs_TEST', attributes: { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: null, payments: [] } });
    }
    expect(await pending).toMatchObject({ status: 'PAID' });
    expect(await walletBalance()).toBe(13);
  });
  it('settles a late authoritative payment after expiry exactly once rather than losing paid credits', async () => {
    const purchase = await createCreditPurchase(owner, 'test-pack', randomUUID());
    state.retrieve.mockResolvedValue({ id: 'cs_TEST', attributes: { livemode: false, reference_number: purchase.purchaseId, status: 'expired', payment_intent: null, payments: [] } });
    await reconcileTestPurchase(owner, purchase.purchaseId);
    state.retrieve.mockResolvedValue(paidSession(purchase.purchaseId));
    await fulfillTestPurchase('cs_TEST');
    await fulfillTestPurchase('cs_TEST');
    expect(await walletBalance()).toBe(13);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind=\'TOPUP\'')).rows[0].count).toBe(1);
  });
  it('rolls back a failed refund and recovers it exactly once afterward', async () => {
    const handle = await reserveCreditRequest(owner, randomUUID(), question);
    await pool.query('ALTER TABLE "CreditLedger" ADD CONSTRAINT test_block_refund CHECK (kind <> \'REFUND\')');
    try { await expect(releaseCreditRequest(handle)).rejects.toThrow(); }
    finally { await pool.query('ALTER TABLE "CreditLedger" DROP CONSTRAINT test_block_refund'); }
    expect(await walletBalance()).toBe(2);
    expect((await pool.query('SELECT status FROM "CreditRequest" WHERE id = $1', [handle.id])).rows[0].status).toBe('RESERVED');
    await releaseCreditRequest(handle); await releaseCreditRequest(handle); expect(await walletBalance()).toBe(3);
  });
  it('settles or refunds a simultaneous completion/cancellation, but never both', async () => {
    const handle = await reserveCreditRequest(owner, randomUUID(), question);
    await Promise.allSettled([completeCreditRequest(handle, response), releaseCreditRequest(handle)]);
    const status = (await pool.query('SELECT status FROM "CreditRequest" WHERE id = $1', [handle.id])).rows[0].status;
    expect(['COMPLETED', 'RELEASED']).toContain(status);
    expect(await walletBalance()).toBe(status === 'COMPLETED' ? 2 : 3);
    const refunds = (await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind = $1', ['REFUND'])).rows[0].count;
    expect(refunds).toBe(status === 'COMPLETED' ? 0 : 1);
  });
  it('does not mutate balances for an oversized saved response or forged release owner', async () => {
    const handle = await reserveCreditRequest(owner, randomUUID(), question);
    await expect(completeCreditRequest(handle, { reply: 'x'.repeat(200001) })).rejects.toMatchObject({ status: 503 });
    await releaseCreditRequest({ ...handle, userId: other }); expect(await walletBalance()).toBe(2);
    await releaseCreditRequest(handle); expect(await walletBalance()).toBe(3);
  });
  it('requires real JWT authentication and rejects banned or revoked sessions without wallet writes', async () => {
    expect((await request(app).get('/credits')).status).toBe(401);
    const token = bearer();
    await pool.query('UPDATE "User" SET session_version = 1 WHERE id = $1', [owner]);
    expect((await request(app).get('/credits').set('Authorization', token)).status).toBe(401);
    await pool.query('UPDATE "User" SET session_version = 0, "isBanned" = true WHERE id = $1', [owner]);
    expect((await request(app).get('/credits').set('Authorization', token)).status).toBe(403);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditWallet"')).rows[0].count).toBe(0);
  });
  it('runs signed checkout confirmation through HTTP and consumes one credit for an authenticated question', async () => {
    const checkout = await request(app).post('/credits/checkout').set('Authorization', bearer()).send({ packageId: 'test-pack', requestId: randomUUID() });
    expect(checkout.status).toBe(201);
    state.retrieve.mockResolvedValue(paidSession(checkout.body.data.purchaseId));
    const event = { data: { id: 'evt_TEST', type: 'event', attributes: { type: 'checkout_session.payment.paid', livemode: false, data: { id: 'cs_TEST', attributes: { livemode: false } } } } };
    const raw = JSON.stringify(event), timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `t=${timestamp},te=${createHmac('sha256', 'TEST ONLY').update(`${timestamp}.${raw}`).digest('hex')},li=`;
    const notify = () => request(app).post('/webhook').set('Content-Type', 'application/json').set('Paymongo-Signature', signature).send(raw);
    expect((await notify()).status).toBe(200); expect((await notify()).body.data.duplicate).toBe(true);
    const key = randomUUID(); expect((await chat(key)).status).toBe(200); expect((await chat(key)).status).toBe(200);
    expect(state.ask).toHaveBeenCalledOnce();
    const wallet = await request(app).get('/credits').set('Authorization', bearer());
    expect(wallet.status).toBe(200); expect(wallet.body.data.balance).toBe(12);
    expect((await request(app).get(`/credits/answers/${key}`).set('Authorization', bearer(other))).status).toBe(404);
    expect((await request(app).get(`/credits/answers/${key}`).set('Authorization', bearer())).body.data.reply).toBe(response.reply);
  });
  it.each(['/chat', '/chat/stream'])('refunds failed generation through authenticated HTTP %s', async path => {
    state.ask.mockRejectedValue(new Error('TEST ONLY provider failure'));
    state.stream.mockRejectedValue(new Error('TEST ONLY provider failure'));
    const result = await chat(randomUUID(), path);
    expect(path === '/chat' ? result.status : result.text.includes('event: error')).toBe(path === '/chat' ? 503 : true);
    expect(await walletBalance()).toBe(3);
    expect((await pool.query('SELECT status FROM "CreditRequest"')).rows[0].status).toBe('RELEASED');
  });
  it.each(['/chat', '/chat/stream'])('refunds an actual client disconnect exactly once through %s', async path => {
    let generating = false;
    const waitForAbort = (signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
      if (signal.aborted) { reject(signal.reason); return; }
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      generating = true;
    });
    state.ask.mockImplementation((_message, _history, options) => waitForAbort(options.signal));
    const getResult = vi.fn(() => response);
    state.stream.mockImplementation(async (_message, _history, options) => ({ sources: [], getResult, chunks: (async function* () {
      yield 'TEST ONLY partial answer.';
      await waitForAbort(options.signal);
    })() }));
    const server = app.listen(0, '127.0.0.1');
    const controller = new AbortController();
    try {
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('A loopback test listener is required.');
      const key = randomUUID();
      const pending = fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: bearer(), 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
        body: JSON.stringify(question),
      }).then(result => result.text()).catch(error => error);
      await expect.poll(() => generating, { timeout: 3000 }).toBe(true);
      expect(await walletBalance()).toBe(2);
      controller.abort(); await pending;
      await expect.poll(async () => (await pool.query('SELECT status FROM "CreditRequest" WHERE "requestKey" = $1', [key])).rows[0]?.status, { timeout: 3000 }).toBe('RELEASED');
      expect(await walletBalance()).toBe(3);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM "CreditLedger" WHERE kind = $1', ['REFUND'])).rows[0].count).toBe(1);
      expect(getResult).not.toHaveBeenCalled();
    } finally {
      controller.abort(); server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
