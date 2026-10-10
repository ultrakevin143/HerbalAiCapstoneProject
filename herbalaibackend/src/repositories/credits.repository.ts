import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CreditError, getCreditsConfig } from '../config/credits.js';
import { createTestCheckout, retrieveTestCheckout } from '../services/paymongo-test.service.js';

type Transaction = Prisma.TransactionClient;
type Usage = { id: string; userId: string; requestKey: string; inputHash: string; status: string; response: unknown; expiresAt: Date };
type Purchase = { id: string; userId: string; requestKey: string; packageId: string; credits: number; amountMinor: number; currency: string; status: string; checkoutId: string | null; checkoutUrl: string | null; paymentId: string | null };
export type CreditHandle = { id: string; userId: string; replay: unknown | null };

const lockWallet = async (transaction: Transaction, userId: string) => {
  const trial = getCreditsConfig().trialCredits;
  const created = await transaction.$queryRaw<{ userId: string }[]>`INSERT INTO "CreditWallet" ("userId", balance) VALUES (${userId}, ${trial}) ON CONFLICT ("userId") DO NOTHING RETURNING "userId"`;
  await transaction.$queryRaw`SELECT "userId" FROM "CreditWallet" WHERE "userId" = ${userId} FOR UPDATE`;
  if (created.length && trial > 0) await transaction.$executeRaw`INSERT INTO "CreditLedger" (id, "userId", "operationKey", kind, delta) VALUES (${randomUUID()}, ${userId}, ${`trial:${userId}`}, 'TRIAL', ${trial})`;
};

const refund = async (transaction: Transaction, usage: Usage) => {
  const changed = await transaction.$executeRaw`UPDATE "CreditRequest" SET status = 'RELEASED' WHERE id = ${usage.id} AND "userId" = ${usage.userId} AND status = 'RESERVED'`;
  if (changed === 1) {
    await transaction.$executeRaw`UPDATE "CreditWallet" SET balance = balance + 1 WHERE "userId" = ${usage.userId}`;
    await transaction.$executeRaw`INSERT INTO "CreditLedger" (id, "userId", "operationKey", kind, delta) VALUES (${randomUUID()}, ${usage.userId}, ${`refund:${usage.id}`}, 'REFUND', 1)`;
  }
};

const expireReservations = async (transaction: Transaction, userId: string) => {
  const expired = await transaction.$queryRaw<Usage[]>`SELECT * FROM "CreditRequest" WHERE "userId" = ${userId} AND status = 'RESERVED' AND "expiresAt" <= CURRENT_TIMESTAMP`;
  for (const usage of expired) await refund(transaction, usage);
};

const walletTransaction = async <Result>(userId: string, operation: (transaction: Transaction) => Promise<Result>): Promise<Result> => {
  const outcome = await prisma.$transaction(async transaction => {
    await lockWallet(transaction, userId);
    await expireReservations(transaction, userId);
    try { return { ok: true as const, result: await operation(transaction) }; }
    catch (error) {
      if (error instanceof CreditError) return { ok: false as const, error };
      throw error;
    }
  });
  if (!outcome.ok) throw outcome.error;
  return outcome.result;
};

export const reserveCreditRequest = async (userId: string, requestKey: string, input: unknown): Promise<CreditHandle> => {
  const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return walletTransaction(userId, async transaction => {
    const previous = await transaction.$queryRaw<Usage[]>`SELECT * FROM "CreditRequest" WHERE "userId" = ${userId} AND "requestKey" = ${requestKey}`;
    if (previous[0]) {
      const usage = previous[0];
      if (usage.inputHash !== inputHash) throw new CreditError(409, 'This request identifier belongs to a different question.');
      if (usage.status === 'COMPLETED' && usage.response) return { id: usage.id, userId, replay: usage.response };
      throw new CreditError(409, usage.status === 'RESERVED' ? 'This question is already being processed. Please wait.' : 'This request ended without a charge. Retry with a new request identifier.');
    }
    const changed = await transaction.$executeRaw`UPDATE "CreditWallet" SET balance = balance - 1 WHERE "userId" = ${userId} AND balance >= 1`;
    if (changed !== 1) throw new CreditError(402, 'You have no Dr. Ai test credits remaining. Open Credits to check your balance.');
    const id = randomUUID();
    await transaction.$executeRaw`INSERT INTO "CreditRequest" (id, "userId", "requestKey", "inputHash", status, "expiresAt") VALUES (${id}, ${userId}, ${requestKey}, ${inputHash}, 'RESERVED', CURRENT_TIMESTAMP + INTERVAL '3 minutes')`;
    await transaction.$executeRaw`INSERT INTO "CreditLedger" (id, "userId", "operationKey", kind, delta) VALUES (${randomUUID()}, ${userId}, ${`reserve:${id}`}, 'RESERVE', -1)`;
    return { id, userId, replay: null };
  });
};

export const completeCreditRequest = (handle: CreditHandle, response: unknown) => walletTransaction(handle.userId, async transaction => {
  if (!response || JSON.stringify(response).length > 200000) throw new CreditError(503, 'The completed answer could not be saved.');
  const changed = await transaction.$executeRaw`UPDATE "CreditRequest" SET status = 'COMPLETED', response = ${JSON.stringify(response)}::jsonb WHERE id = ${handle.id} AND "userId" = ${handle.userId} AND status = 'RESERVED'`;
  if (changed !== 1) throw new CreditError(409, 'The credit reservation ended. This answer was not charged.');
});

export const releaseCreditRequest = (handle: CreditHandle) => walletTransaction(handle.userId, async transaction => {
  const usages = await transaction.$queryRaw<Usage[]>`SELECT * FROM "CreditRequest" WHERE id = ${handle.id} AND "userId" = ${handle.userId}`;
  if (usages[0]) await refund(transaction, usages[0]);
});

export const getCreditWallet = (userId: string) => walletTransaction(userId, async transaction => {
  const wallets = await transaction.$queryRaw<{ balance: number }[]>`SELECT balance FROM "CreditWallet" WHERE "userId" = ${userId}`;
  const ledger = await transaction.$queryRaw`SELECT id, kind, delta, "createdAt" FROM "CreditLedger" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC, id DESC LIMIT 50`;
  const purchases = await transaction.$queryRaw`SELECT id, "packageId", "requestKey", "checkoutUrl", credits, "amountMinor", currency, status, "createdAt" FROM "CreditPurchase" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC, id DESC LIMIT 50`;
  const requests = await transaction.$queryRaw`SELECT "requestKey", status, "createdAt" FROM "CreditRequest" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC, id DESC LIMIT 20`;
  return { balance: wallets[0]!.balance, ledger, purchases, requests };
});

export const getCompletedCreditResponse = (userId: string, requestKey: string) => walletTransaction(userId, async transaction => {
  const records = await transaction.$queryRaw<{ response: unknown }[]>`SELECT response FROM "CreditRequest" WHERE "userId" = ${userId} AND "requestKey" = ${requestKey} AND status = 'COMPLETED'`;
  if (!records[0]) throw new CreditError(404, 'No completed answer is available for this account and request.');
  return records[0].response;
});

export const createCreditPurchase = async (userId: string, packageId: string, requestKey: string) => {
  const config = getCreditsConfig();
  const pack = config.packages.find(value => value.id === packageId);
  if (config.mode !== 'test' || !config.secretKey || !config.webhookSecret || !pack) throw new CreditError(400, 'This test package is not available.');
  const purchase = await walletTransaction(userId, async transaction => {
    const prior = await transaction.$queryRaw<Purchase[]>`SELECT * FROM "CreditPurchase" WHERE "userId" = ${userId} AND "requestKey" = ${requestKey}`;
    if (prior[0]) {
      if (prior[0].packageId !== packageId) throw new CreditError(409, 'This purchase identifier belongs to another package.');
      return { ...prior[0], fresh: false };
    }
    const unresolved = await transaction.$queryRaw<{ id: string }[]>`SELECT id FROM "CreditPurchase" WHERE "userId" = ${userId} AND "packageId" = ${packageId} AND status IN ('CREATING', 'PENDING', 'UNCERTAIN') LIMIT 1`;
    if (unresolved.length) throw new CreditError(409, 'An existing checkout for this package is awaiting payment or confirmation. Refresh your wallet and resume it from purchase history; no duplicate checkout was created.');
    const id = randomUUID();
    await transaction.$executeRaw`INSERT INTO "CreditPurchase" (id, "userId", "requestKey", "packageId", credits, "amountMinor", status) VALUES (${id}, ${userId}, ${requestKey}, ${pack.id}, ${pack.credits}, ${pack.amountMinor}, 'CREATING')`;
    return { id, fresh: true, status: 'CREATING', checkoutUrl: null as string | null };
  });
  if (!purchase.fresh) {
    if (purchase.status === 'PENDING' && purchase.checkoutUrl) return { purchaseId: purchase.id, checkoutUrl: purchase.checkoutUrl, testMode: true };
    throw new CreditError(409, 'This purchase is already completed or awaiting confirmation. Check purchase history; no duplicate checkout was created.');
  }
  try {
    const checkout = await createTestCheckout(purchase.id, pack);
    const changed = await prisma.$executeRaw`UPDATE "CreditPurchase" SET "checkoutId" = ${checkout.id}, "checkoutUrl" = ${checkout.url}, status = 'PENDING' WHERE id = ${purchase.id} AND status = 'CREATING'`;
    if (changed !== 1) throw new CreditError(409, 'The purchase status changed. Check your purchase history.');
    return { purchaseId: purchase.id, checkoutUrl: checkout.url, testMode: true };
  } catch (error) {
    await prisma.$executeRaw`UPDATE "CreditPurchase" SET status = 'UNCERTAIN' WHERE id = ${purchase.id} AND status = 'CREATING'`;
    throw error;
  }
};

export const fulfillTestPurchase = async (checkoutId: string) => {
  const session = await retrieveTestCheckout(checkoutId);
  const candidates = await prisma.$queryRaw<Purchase[]>`SELECT * FROM "CreditPurchase" WHERE "checkoutId" = ${checkoutId}`;
  const purchase = candidates[0];
  if (!purchase || session.attributes.reference_number !== purchase.id) throw new CreditError(400, 'The test checkout does not match an order.');
  const payments = session.attributes.payments?.filter(payment => payment.attributes.status === 'paid') ?? [];
  if (payments.length !== 1) throw new CreditError(400, 'Exactly one confirmed test payment is required.');
  const payment = payments[0]!;
  if (session.id !== checkoutId || payment.attributes.amount !== purchase.amountMinor || payment.attributes.currency !== purchase.currency || payment.attributes.refunds?.length || payment.attributes.disputed) throw new CreditError(400, 'The test payment identity, amount, currency or refund state does not match this order.');
  return walletTransaction(purchase.userId, async transaction => {
    const orders = await transaction.$queryRaw<Purchase[]>`SELECT * FROM "CreditPurchase" WHERE id = ${purchase.id} FOR UPDATE`;
    const current = orders[0];
    if (!current || current.checkoutId !== checkoutId) throw new CreditError(409, 'The test order changed.');
    if (current.status === 'PAID') {
      if (current.paymentId !== payment.id) throw new CreditError(409, 'A different payment was already recorded.');
      return { credited: false, duplicate: true };
    }
    if (current.status !== 'PENDING') throw new CreditError(409, 'This order is not awaiting payment.');
    const changed = await transaction.$executeRaw`UPDATE "CreditWallet" SET balance = balance + ${current.credits} WHERE "userId" = ${current.userId} AND balance <= 1000000000 - ${current.credits}`;
    if (changed !== 1) throw new CreditError(409, 'The test credit balance limit was reached.');
    await transaction.$executeRaw`UPDATE "CreditPurchase" SET status = 'PAID', "paymentId" = ${payment.id} WHERE id = ${current.id}`;
    await transaction.$executeRaw`INSERT INTO "CreditLedger" (id, "userId", "operationKey", kind, delta) VALUES (${randomUUID()}, ${current.userId}, ${`purchase:${current.id}`}, 'TOPUP', ${current.credits})`;
    return { credited: true, duplicate: false };
  });
};
