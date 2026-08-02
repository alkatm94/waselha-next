-- Additive Paylink payment tracking fields. Existing purchase orders remain unpaid.
ALTER TABLE "PurchaseOrder"
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "paylinkTransactionNo" TEXT,
ADD COLUMN "paylinkPaymentUrl" TEXT,
ADD COLUMN "paylinkOrderStatus" TEXT,
ADD COLUMN "paidAmount" DECIMAL(12,2),
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentReceiptUrl" TEXT,
ADD COLUMN "paymentReceiptPasscode" TEXT,
ADD COLUMN "paymentCardLastFour" TEXT,
ADD COLUMN "paymentCreatedAt" TIMESTAMP(3),
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "paymentFailureReason" TEXT,
ADD COLUMN "paylinkQrUrl" TEXT,
ADD COLUMN "paylinkMobileUrl" TEXT,
ADD COLUMN "paylinkCheckUrl" TEXT;

CREATE UNIQUE INDEX "PurchaseOrder_paylinkTransactionNo_key" ON "PurchaseOrder"("paylinkTransactionNo");
CREATE INDEX "PurchaseOrder_paymentStatus_idx" ON "PurchaseOrder"("paymentStatus");
