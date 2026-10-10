ALTER TABLE "CreditPurchase" DROP CONSTRAINT "CreditPurchase_status_check";
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_status_check"
  CHECK (status IN ('CREATING', 'PENDING', 'PAID', 'UNCERTAIN', 'EXPIRED'));
