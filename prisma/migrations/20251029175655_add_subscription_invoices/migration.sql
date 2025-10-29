-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'VOID');

-- CreateTable
CREATE TABLE "public"."subscription_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "period" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "provider" "public"."PaymentProvider" NOT NULL,
    "stripeInvoiceId" TEXT,
    "stripePaymentIntentId" TEXT,
    "polarInvoiceId" TEXT,
    "polarPaymentId" TEXT,
    "lineItems" JSONB NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_invoiceNumber_key" ON "public"."subscription_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_stripeInvoiceId_key" ON "public"."subscription_invoices"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_polarInvoiceId_key" ON "public"."subscription_invoices"("polarInvoiceId");

-- CreateIndex
CREATE INDEX "subscription_invoices_subscriptionId_idx" ON "public"."subscription_invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_invoices_brandId_idx" ON "public"."subscription_invoices"("brandId");

-- CreateIndex
CREATE INDEX "subscription_invoices_status_idx" ON "public"."subscription_invoices"("status");

-- CreateIndex
CREATE INDEX "subscription_invoices_createdAt_idx" ON "public"."subscription_invoices"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
