/*
  Warnings:

  - A unique constraint covering the columns `[polarCustomerId]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarProductIdMonthly]` on the table `subscription_plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarProductIdYearly]` on the table `subscription_plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarSubscriptionId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('STRIPE', 'POLAR');

-- AlterTable
ALTER TABLE "public"."brands" ADD COLUMN     "polarCustomerId" TEXT;

-- AlterTable
ALTER TABLE "public"."subscription_plans" ADD COLUMN     "polarProductIdMonthly" TEXT,
ADD COLUMN     "polarProductIdYearly" TEXT;

-- AlterTable
ALTER TABLE "public"."subscriptions" ADD COLUMN     "polarProductId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'STRIPE';

-- CreateIndex
CREATE UNIQUE INDEX "brands_polarCustomerId_key" ON "public"."brands"("polarCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_polarProductIdMonthly_key" ON "public"."subscription_plans"("polarProductIdMonthly");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_polarProductIdYearly_key" ON "public"."subscription_plans"("polarProductIdYearly");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_polarSubscriptionId_key" ON "public"."subscriptions"("polarSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_polarSubscriptionId_idx" ON "public"."subscriptions"("polarSubscriptionId");
