/*
  Warnings:

  - You are about to drop the column `poId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `purchase_order_items` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,3)`.
  - You are about to alter the column `unitCost` on the `purchase_order_items` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `orderedAt` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `purchase_orders` table. All the data in the column will be lost.
  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `totalAmount` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - Added the required column `purchaseOrderId` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."POStatus" AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'PARTIAL', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_poId_fkey";

-- DropIndex
DROP INDEX "public"."purchase_order_items_poId_idx";

-- DropIndex
DROP INDEX "public"."purchase_orders_status_idx";

-- AlterTable
ALTER TABLE "public"."purchase_order_items" DROP COLUMN "poId",
ADD COLUMN     "purchaseOrderId" TEXT NOT NULL,
ADD COLUMN     "receivedQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."purchase_orders" DROP COLUMN "orderedAt",
DROP COLUMN "receivedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."POStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "totalAmount" DROP DEFAULT,
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "public"."StockAdjustment" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAdjustment_brandId_idx" ON "public"."StockAdjustment"("brandId");

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "public"."StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "public"."purchase_order_items"("purchaseOrderId");

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAdjustment" ADD CONSTRAINT "StockAdjustment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAdjustment" ADD CONSTRAINT "StockAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
