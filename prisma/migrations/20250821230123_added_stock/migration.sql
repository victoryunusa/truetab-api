/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `reorderLevel` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `costPrice` on the `products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `branchId` on the `stock_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `stock_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `stock_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,3)`.
  - You are about to alter the column `unitCost` on the `stock_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[barcode]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sellPrice` to the `products` table without a default value. This is not possible if the table is not empty.
  - Made the column `costPrice` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `stock_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."StockTxType" AS ENUM ('PURCHASE', 'ADJUSTMENT', 'WASTAGE', 'TRANSFER', 'SALE', 'RETURN');

-- DropIndex
DROP INDEX "public"."products_category_idx";

-- DropIndex
DROP INDEX "public"."stock_transactions_branchId_idx";

-- DropIndex
DROP INDEX "public"."stock_transactions_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "category",
DROP COLUMN "reorderLevel",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "sellPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "trackStock" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "costPrice" SET NOT NULL,
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."stock_transactions" DROP COLUMN "branchId",
DROP COLUMN "referenceId",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "userId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."StockTxType" NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "location" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_brandId_idx" ON "public"."categories"("brandId");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "public"."categories"("name");

-- CreateIndex
CREATE INDEX "stock_items_productId_idx" ON "public"."stock_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "public"."products"("barcode");

-- CreateIndex
CREATE INDEX "stock_transactions_type_idx" ON "public"."stock_transactions"("type");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_items" ADD CONSTRAINT "stock_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_transactions" ADD CONSTRAINT "stock_transactions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_transactions" ADD CONSTRAINT "stock_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
