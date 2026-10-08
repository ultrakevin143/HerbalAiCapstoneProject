import { z } from 'zod';
import { ENV } from './env.js';

export const creditPackageSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().trim().min(1).max(80),
  credits: z.number().int().min(1).max(10000),
  amountMinor: z.number().int().min(1).max(10000000),
});

export const getCreditsConfig = () => {
  const mode = z.enum(['off', 'test']).parse(process.env['DR_AI_CREDITS_MODE'] ?? 'off');
  if (mode === 'off') return { mode, packages: [], trialCredits: 0, secretKey: '', webhookSecret: '', frontendUrl: ENV.FRONTEND_URL };
  const packages = z.array(creditPackageSchema).max(10).parse(JSON.parse(process.env['DR_AI_CREDIT_PACKAGES'] ?? '[]'));
  if (new Set(packages.map(pack => pack.id)).size !== packages.length) throw new Error('Credit package identifiers must be unique.');
  const trialCredits = z.coerce.number().int().min(0).max(100).parse(process.env['DR_AI_TRIAL_CREDITS'] ?? '0');
  const secretKey = process.env['PAYMONGO_TEST_SECRET_KEY'] ?? '';
  if (secretKey && !secretKey.startsWith('sk_test_')) throw new Error('Only PayMongo TEST keys are accepted. Real payments are disabled.');
  return { mode, packages, trialCredits, secretKey, webhookSecret: process.env['PAYMONGO_TEST_WEBHOOK_SECRET'] ?? '', frontendUrl: ENV.FRONTEND_URL };
};

export class CreditError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
