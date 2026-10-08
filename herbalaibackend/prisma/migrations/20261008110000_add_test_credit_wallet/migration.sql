CREATE TABLE "CreditWallet" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE RESTRICT,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);
CREATE TABLE "CreditLedger" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "operationKey" TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('TRIAL', 'TOPUP', 'RESERVE', 'REFUND')),
  delta INTEGER NOT NULL CHECK (delta <> 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");
CREATE TABLE "CreditRequest" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "requestKey" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RESERVED', 'COMPLETED', 'RELEASED')),
  response JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "requestKey")
);
CREATE INDEX "CreditRequest_userId_status_expiresAt_idx" ON "CreditRequest"("userId", status, "expiresAt");
CREATE TABLE "CreditPurchase" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "requestKey" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 10000),
  "amountMinor" INTEGER NOT NULL CHECK ("amountMinor" > 0),
  currency TEXT NOT NULL DEFAULT 'PHP' CHECK (currency = 'PHP'),
  status TEXT NOT NULL CHECK (status IN ('CREATING', 'PENDING', 'PAID', 'UNCERTAIN')),
  "checkoutId" TEXT UNIQUE,
  "checkoutUrl" TEXT,
  "paymentId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "requestKey")
);
CREATE INDEX "CreditPurchase_userId_createdAt_idx" ON "CreditPurchase"("userId", "createdAt");
