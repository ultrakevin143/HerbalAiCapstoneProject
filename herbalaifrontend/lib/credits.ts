import { z } from 'zod';

export const creditWalletSchema = z.object({
  enabled: z.boolean(), testMode: z.literal(true), balance: z.number().int().nonnegative().default(0), checkoutAvailable: z.boolean().default(false),
  packages: z.array(z.object({ id: z.string(), name: z.string(), credits: z.number().int().positive(), amountMinor: z.number().int().positive() })).default([]),
  ledger: z.array(z.object({ id: z.string(), kind: z.string(), delta: z.number().int(), createdAt: z.string() })).default([]),
  purchases: z.array(z.object({ id: z.string(), packageId: z.string().optional(), requestKey: z.uuid().optional(), checkoutUrl: z.string().nullable().optional(), credits: z.number().int(), amountMinor: z.number().int(), status: z.string(), createdAt: z.string() })).default([]),
  requests: z.array(z.object({ requestKey: z.uuid(), status: z.string(), createdAt: z.string() })).default([]),
});
export type CreditWallet = z.infer<typeof creditWalletSchema>;

export const safeTestCheckoutUrl = (value: unknown): string => {
  const url = new URL(z.string().parse(value));
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.paymongo.com' || url.username || url.password) throw new Error('The test checkout URL could not be verified.');
  return url.href;
};

export const resumableCheckoutUrl = (purchase: CreditWallet['purchases'][number]): string | null => {
  if (purchase.status !== 'PENDING' || !purchase.checkoutUrl) return null;
  try { return safeTestCheckoutUrl(purchase.checkoutUrl); }
  catch { return null; }
};
