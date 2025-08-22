-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "waiterId" TEXT;

-- CreateTable
CREATE TABLE "public"."tips" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "orderId" TEXT,
    "registerId" TEXT,
    "staffId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tips_brandId_idx" ON "public"."tips"("brandId");

-- CreateIndex
CREATE INDEX "tips_branchId_idx" ON "public"."tips"("branchId");

-- CreateIndex
CREATE INDEX "tips_orderId_idx" ON "public"."tips"("orderId");

-- CreateIndex
CREATE INDEX "tips_registerId_idx" ON "public"."tips"("registerId");

-- CreateIndex
CREATE INDEX "tips_staffId_idx" ON "public"."tips"("staffId");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
