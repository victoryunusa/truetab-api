/*
  Warnings:

  - You are about to alter the column `quantity` on the `stock_transfer_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - A unique constraint covering the columns `[email]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `brands` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('SALE', 'REFUND', 'PAID_IN', 'PAID_OUT', 'ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "public"."registers" DROP CONSTRAINT "registers_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."registers" DROP CONSTRAINT "registers_brandId_fkey";

-- DropIndex
DROP INDEX "public"."registers_branchId_idx";

-- DropIndex
DROP INDEX "public"."registers_branchId_name_key";

-- DropIndex
DROP INDEX "public"."registers_brandId_idx";

-- AlterTable
ALTER TABLE "public"."brands" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."registers" ALTER COLUMN "brandId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."stock_transfer_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "public"."zones" ADD COLUMN     "brandId" TEXT;

-- CreateTable
CREATE TABLE "public"."cash_sessions" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openingFloat" DECIMAL(12,2) NOT NULL,
    "cashSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refunds" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidOut" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expectedClose" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "countedClose" DECIMAL(12,2),
    "overShort" DECIMAL(12,2),
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT,
    "branchId" TEXT,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_movements" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "public"."MovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT,
    "branchId" TEXT,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_session_register_status" ON "public"."cash_sessions"("registerId", "status");

-- CreateIndex
CREATE INDEX "idx_session_opened_at" ON "public"."cash_sessions"("openedAt");

-- CreateIndex
CREATE INDEX "idx_movement_session_type" ON "public"."cash_movements"("sessionId", "type");

-- CreateIndex
CREATE INDEX "idx_movement_order" ON "public"."cash_movements"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_email_key" ON "public"."brands"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_url_key" ON "public"."brands"("url");

-- CreateIndex
CREATE INDEX "idx_register_branch_name" ON "public"."registers"("branchId", "name");

-- AddForeignKey
ALTER TABLE "public"."zones" ADD CONSTRAINT "zones_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registers" ADD CONSTRAINT "registers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registers" ADD CONSTRAINT "registers_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "public"."registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."cash_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
