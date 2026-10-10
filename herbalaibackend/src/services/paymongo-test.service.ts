import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { CreditError, getCreditsConfig } from '../config/credits.js';
import type { creditPackageSchema } from '../config/credits.js';

export const checkoutSessionSchema = z.object({
  id: z.string().regex(/^cs_[A-Za-z0-9]+$/),
  attributes: z.object({
    livemode: z.literal(false),
    status: z.enum(['active', 'expired']).optional(),
    payment_intent: z.object({ attributes: z.object({ livemode: z.literal(false), status: z.string() }) }).nullable().optional(),
    checkout_url: z.url().optional(),
    reference_number: z.string().optional(),
    payments: z.array(z.object({ id: z.string().min(1), attributes: z.object({ status: z.string(), livemode: z.literal(false), amount: z.number().int(), currency: z.string(), refunds: z.array(z.unknown()).optional(), disputed: z.boolean().optional() }) })).optional(),
  }),
});

const providerCall = async (path: string, body?: unknown) => {
  const config = getCreditsConfig();
  if (config.mode !== 'test' || !config.secretKey || !config.webhookSecret) throw new CreditError(503, 'Test payments are not configured. No real payment is available.');
  try {
    const version = body === undefined ? 'v1' : 'v2';
    const response = await fetch(`https://api.paymongo.com/${version}/checkout_sessions${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${config.secretKey}:`).toString('base64')}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Provider request rejected.');
    const responseSchema = z.object({ data: checkoutSessionSchema });
    return responseSchema.parse(await response.json()).data;
  } catch {
    throw new CreditError(503, 'The test payment provider could not confirm this request. Check the purchase history before retrying.');
  }
};

export const createTestCheckout = async (purchaseId: string, pack: z.infer<typeof creditPackageSchema>) => {
  const config = getCreditsConfig();
  const returnUrl = new URL('/credits', config.frontendUrl);
  if (returnUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(returnUrl.hostname)) throw new CreditError(503, 'A secure return URL is required.');
  const session = await providerCall('', { data: { attributes: {
    line_items: [{ name: `${pack.name} — TEST ONLY`, amount: pack.amountMinor, currency: 'PHP', quantity: 1 }],
    payment_method_types: ['gcash'], reference_number: purchaseId,
    success_url: returnUrl.href, cancel_url: new URL('/chat', config.frontendUrl).href,
  } } });
  const url = new URL(session.attributes.checkout_url ?? '');
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.paymongo.com' || url.username || url.password) throw new CreditError(503, 'An invalid test checkout URL was returned.');
  return { id: session.id, url: url.href };
};

export const retrieveTestCheckout = (id: string) => {
  if (!/^cs_[A-Za-z0-9]+$/.test(id)) throw new CreditError(400, 'Invalid checkout identifier.');
  return providerCall(`/${id}`);
};

export const verifyTestWebhook = (raw: Buffer, header: string | undefined, secret: string, now = Date.now()) => {
  if (!secret || !header) throw new CreditError(400, 'Invalid test payment signature.');
  const parts = header.split(',').map(part => part.trim().split('='));
  const values = new Map(parts.map(part => [part[0], part[1]]));
  const timestamp = values.get('t');
  const signature = values.get('te');
  if (parts.length !== 3 || values.size !== 3 || !timestamp || !/^\d{10}$/.test(timestamp)
      || !signature || !/^[a-f0-9]{64}$/i.test(signature) || values.get('li') !== ''
      || Math.abs(now / 1000 - Number(timestamp)) > 300) throw new CreditError(400, 'Invalid or expired test payment signature.');
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new CreditError(400, 'Invalid test payment signature.');
};

export const testPaidEventSchema = z.object({ data: z.object({
  id: z.string().min(1), type: z.literal('event'),
  attributes: z.object({ type: z.literal('checkout_session.payment.paid'), livemode: z.literal(false), data: checkoutSessionSchema }),
}) });
