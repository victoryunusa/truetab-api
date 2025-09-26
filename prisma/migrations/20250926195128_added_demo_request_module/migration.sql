/*
  Warnings:

  - The `status` column on the `stock_transfers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `method` column on the `tips` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `tips` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."StockTransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TipMethod" AS ENUM ('CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TipType" AS ENUM ('DIRECT', 'POOLED', 'BRANCH');

-- CreateEnum
CREATE TYPE "public"."TipSettlementRule" AS ENUM ('EQUAL', 'HOURS', 'SALES');

-- CreateEnum
CREATE TYPE "public"."WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'SEATED', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."PrintJobStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DemoRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."stock_transfers" DROP COLUMN "status",
ADD COLUMN     "status" "public"."StockTransferStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."tips" DROP COLUMN "method",
ADD COLUMN     "method" "public"."TipMethod" NOT NULL DEFAULT 'CASH',
DROP COLUMN "type",
ADD COLUMN     "type" "public"."TipType" NOT NULL DEFAULT 'DIRECT';

-- CreateTable
CREATE TABLE "public"."demo_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "message" TEXT,
    "status" "public"."DemoRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoRequestId" TEXT,

    CONSTRAINT "registration_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_requests_email_key" ON "public"."demo_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "registration_codes_code_key" ON "public"."registration_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "registration_codes_demoRequestId_key" ON "public"."registration_codes"("demoRequestId");

-- CreateIndex
CREATE INDEX "stock_transfers_status_idx" ON "public"."stock_transfers"("status");

-- AddForeignKey
ALTER TABLE "public"."registration_codes" ADD CONSTRAINT "registration_codes_demoRequestId_fkey" FOREIGN KEY ("demoRequestId") REFERENCES "public"."demo_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
