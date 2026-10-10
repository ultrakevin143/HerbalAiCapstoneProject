import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCreditsConfig } from '../src/config/credits.js';
import { checkoutSessionSchema, createTestCheckout, retrieveTestCheckout, verifyTestWebhook, testPaidEventSchema } from '../src/services/paymongo-test.service.js';

const raw = Buffer.from('{"TEST_ONLY":true}');
const secret = 'TEST ONLY synthetic webhook secret';
const now = 1791475200000;
const timestamp = String(now / 1000);
const signature = createHmac('sha256', secret).update(`${timestamp}.`).update(raw).digest('hex');
const header = `t=${timestamp},te=${signature},li=`;

describe('test-only credit configuration and payment verification', () => {
  beforeEach(() => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'off');
    vi.stubEnv('DR_AI_CREDIT_PACKAGES', '[]');
    vi.stubEnv('DR_AI_TRIAL_CREDITS', '0');
    vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', '');
    vi.stubEnv('PAYMONGO_TEST_WEBHOOK_SECRET', '');
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('defaults to unchanged free access with payments disabled', () => { expect(getCreditsConfig().mode).toBe('off'); });
  it.each(['live', 'paid', 'unknown'])('rejects unsupported mode %s', mode => { vi.stubEnv('DR_AI_CREDITS_MODE', mode); expect(getCreditsConfig).toThrow(); });
  it('rejects live secret keys even when test mode is selected', () => { vi.stubEnv('DR_AI_CREDITS_MODE', 'test'); vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', 'sk_live_TEST_ONLY'); expect(getCreditsConfig).toThrow('TEST'); });
  it.each(['[{"id":"test","name":"Test","credits":-1,"amountMinor":10000}]', '[{"id":"test","name":"Test","credits":1.2,"amountMinor":10000}]', '[{"id":"test","name":"Test","credits":10,"amountMinor":0}]'])('rejects invalid package settings', value => { vi.stubEnv('DR_AI_CREDITS_MODE', 'test'); vi.stubEnv('DR_AI_CREDIT_PACKAGES', value); expect(getCreditsConfig).toThrow(); });
  it('accepts a fresh valid raw-body test signature', () => { expect(() => verifyTestWebhook(raw, header, secret, now)).not.toThrow(); });
  it.each([undefined, `t=${timestamp},te=${signature},li=${signature}`, `t=${timestamp},te=00,li=`, `${header},te=${signature}`])('rejects malformed/live/duplicate signatures', value => { expect(() => verifyTestWebhook(raw, value, secret, now)).toThrow(); });
  it('rejects altered bytes and expired/future signatures', () => {
    expect(() => verifyTestWebhook(Buffer.from('changed'), header, secret, now)).toThrow();
    expect(() => verifyTestWebhook(raw, header, secret, now + 301000)).toThrow();
    expect(() => verifyTestWebhook(raw, header, secret, now - 301000)).toThrow();
  });
  it('rejects a live checkout or live paid event', () => {
    expect(checkoutSessionSchema.safeParse({ id: 'cs_TEST', attributes: { livemode: true } }).success).toBe(false);
    expect(testPaidEventSchema.safeParse({ data: { id: 'evt_TEST', type: 'event', attributes: { type: 'checkout_session.payment.paid', livemode: true, data: { id: 'cs_TEST', attributes: { livemode: true } } } } }).success).toBe(false);
  });
  it('makes no provider request when disabled or missing credentials', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(retrieveTestCheckout('cs_TEST')).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('retains checkout lifecycle evidence and refuses live or malformed payment intents', () => {
    const attributes = { livemode: false, status: 'expired', payment_intent: null, payments: [] };
    expect(checkoutSessionSchema.parse({ id: 'cs_TEST', attributes }).attributes).toEqual(attributes);
    expect(checkoutSessionSchema.safeParse({ id: 'cs_TEST', attributes: { ...attributes, status: 'unknown' } }).success).toBe(false);
    expect(checkoutSessionSchema.safeParse({ id: 'cs_TEST', attributes: { ...attributes, payment_intent: { attributes: { livemode: true, status: 'processing' } } } }).success).toBe(false);
    expect(checkoutSessionSchema.safeParse({ id: 'cs_TEST', attributes: { ...attributes, payment_intent: {} } }).success).toBe(false);
  });
  it('creates only a bounded server-priced GCash test checkout and rejects unsafe redirects', async () => {
    vi.stubEnv('DR_AI_CREDITS_MODE', 'test'); vi.stubEnv('PAYMONGO_TEST_SECRET_KEY', 'sk_test_SYNTHETIC'); vi.stubEnv('PAYMONGO_TEST_WEBHOOK_SECRET', secret);
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'cs_TEST', attributes: { livemode: false, checkout_url: 'https://checkout.paymongo.com/TEST' } } }) });
    vi.stubGlobal('fetch', fetcher);
    expect((await createTestCheckout('TEST-order', { id: 'test', name: 'Herbal-Ai Credits', credits: 10, amountMinor: 10000 })).url).toContain('checkout.paymongo.com');
    const payload = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(payload.data.attributes.line_items[0].name).toBe('Herbal-Ai Credits — TEST ONLY');
    expect(payload.data.attributes.line_items[0].amount).toBe(10000);
    expect(payload.data.attributes.reference_number).toBe('TEST-order');
    expect(payload.data.attributes.payment_method_types).toEqual(['gcash']);
    expect(new URL(payload.data.attributes.cancel_url).pathname).toBe('/chat');
    expect(new URL(payload.data.attributes.success_url).pathname).toBe('/credits');
    expect(new URL(payload.data.attributes.cancel_url).origin).toBe(new URL(payload.data.attributes.success_url).origin);
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://api.paymongo.com/v2/checkout_sessions');
    await retrieveTestCheckout('cs_TEST');
    expect(fetcher.mock.calls[1]?.[0]).toBe('https://api.paymongo.com/v1/checkout_sessions/cs_TEST');
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'cs_TEST', attributes: { livemode: false, checkout_url: 'https://example.invalid/phishing' } } }) });
    await expect(createTestCheckout('TEST-order', { id: 'test', name: 'Test', credits: 10, amountMinor: 10000 })).rejects.toThrow();
  });
});
