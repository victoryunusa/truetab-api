-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."GiftCardStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GiftCardTxnType" AS ENUM ('PURCHASE', 'REDEMPTION', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."StoreCreditTxnType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT', 'EXPIRATION');

-- CreateEnum
CREATE TYPE "public"."DeliveryOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."kitchen_tickets" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "actualPrepTime" INTEGER,
ADD COLUMN     "bumpedAt" TIMESTAMP(3),
ADD COLUMN     "delayReason" TEXT,
ADD COLUMN     "estimatedTime" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "servedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "foodRating" INTEGER,
    "serviceRating" INTEGER,
    "ambianceRating" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_responses" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_media" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gift_cards" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialAmount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."GiftCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchasedBy" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gift_card_transactions" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "public"."GiftCardTxnType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_credits" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_credit_transactions" (
    "id" TEXT NOT NULL,
    "storeCreditId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "public"."StoreCreditTxnType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiEndpoint" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_integrations" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT,
    "providerId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "credentials" JSONB NOT NULL,
    "settings" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_orders" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "public"."DeliveryOrderStatus" NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "deliveryAddress" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "deliveryFee" DECIMAL(12,2) NOT NULL,
    "serviceFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tip" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2),
    "estimatedPickup" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "actualPickup" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "driverName" TEXT,
    "driverPhone" TEXT,
    "specialInstructions" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_brandId_idx" ON "public"."reviews"("brandId");

-- CreateIndex
CREATE INDEX "reviews_customerId_idx" ON "public"."reviews"("customerId");

-- CreateIndex
CREATE INDEX "reviews_orderId_idx" ON "public"."reviews"("orderId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_isPublished_idx" ON "public"."reviews"("isPublished");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "public"."reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_responses_reviewId_key" ON "public"."review_responses"("reviewId");

-- CreateIndex
CREATE INDEX "review_responses_reviewId_idx" ON "public"."review_responses"("reviewId");

-- CreateIndex
CREATE INDEX "review_media_reviewId_idx" ON "public"."review_media"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_code_key" ON "public"."gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_brandId_idx" ON "public"."gift_cards"("brandId");

-- CreateIndex
CREATE INDEX "gift_cards_code_idx" ON "public"."gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_status_idx" ON "public"."gift_cards"("status");

-- CreateIndex
CREATE INDEX "gift_cards_expiresAt_idx" ON "public"."gift_cards"("expiresAt");

-- CreateIndex
CREATE INDEX "gift_card_transactions_giftCardId_idx" ON "public"."gift_card_transactions"("giftCardId");

-- CreateIndex
CREATE INDEX "gift_card_transactions_orderId_idx" ON "public"."gift_card_transactions"("orderId");

-- CreateIndex
CREATE INDEX "gift_card_transactions_createdAt_idx" ON "public"."gift_card_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "store_credits_customerId_idx" ON "public"."store_credits"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "store_credits_brandId_customerId_key" ON "public"."store_credits"("brandId", "customerId");

-- CreateIndex
CREATE INDEX "store_credit_transactions_storeCreditId_idx" ON "public"."store_credit_transactions"("storeCreditId");

-- CreateIndex
CREATE INDEX "store_credit_transactions_orderId_idx" ON "public"."store_credit_transactions"("orderId");

-- CreateIndex
CREATE INDEX "store_credit_transactions_createdAt_idx" ON "public"."store_credit_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_providers_name_key" ON "public"."delivery_providers"("name");

-- CreateIndex
CREATE INDEX "delivery_integrations_brandId_idx" ON "public"."delivery_integrations"("brandId");

-- CreateIndex
CREATE INDEX "delivery_integrations_providerId_idx" ON "public"."delivery_integrations"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_integrations_brandId_providerId_key" ON "public"."delivery_integrations"("brandId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_orderId_key" ON "public"."delivery_orders"("orderId");

-- CreateIndex
CREATE INDEX "delivery_orders_integrationId_idx" ON "public"."delivery_orders"("integrationId");

-- CreateIndex
CREATE INDEX "delivery_orders_orderId_idx" ON "public"."delivery_orders"("orderId");

-- CreateIndex
CREATE INDEX "delivery_orders_externalOrderId_idx" ON "public"."delivery_orders"("externalOrderId");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "public"."delivery_orders"("status");

-- CreateIndex
CREATE INDEX "delivery_orders_createdAt_idx" ON "public"."delivery_orders"("createdAt");

-- CreateIndex
CREATE INDEX "kitchen_tickets_status_idx" ON "public"."kitchen_tickets"("status");

-- CreateIndex
CREATE INDEX "kitchen_tickets_priority_idx" ON "public"."kitchen_tickets"("priority");

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_responses" ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_media" ADD CONSTRAINT "review_media_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_cards" ADD CONSTRAINT "gift_cards_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "public"."gift_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_credits" ADD CONSTRAINT "store_credits_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_credits" ADD CONSTRAINT "store_credits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_credit_transactions" ADD CONSTRAINT "store_credit_transactions_storeCreditId_fkey" FOREIGN KEY ("storeCreditId") REFERENCES "public"."store_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_credit_transactions" ADD CONSTRAINT "store_credit_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_integrations" ADD CONSTRAINT "delivery_integrations_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_integrations" ADD CONSTRAINT "delivery_integrations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."delivery_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."delivery_integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_orders" ADD CONSTRAINT "delivery_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
