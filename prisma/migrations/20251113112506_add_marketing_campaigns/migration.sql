-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('PROMOTIONAL', 'ANNOUNCEMENT', 'LOYALTY_REWARD', 'SEASONAL', 'BRAND_AWARENESS', 'RE_ENGAGEMENT', 'PRODUCT_LAUNCH', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CampaignChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'SOCIAL_MEDIA', 'QR_CODE', 'WEBSITE_BANNER');

-- CreateEnum
CREATE TYPE "public"."CampaignEventType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'CONVERTED', 'BOUNCED', 'UNSUBSCRIBED', 'COMPLAINT');

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CampaignType" NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "public"."CampaignChannel" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "targetAudience" JSONB,
    "content" JSONB NOT NULL,
    "imageUrl" TEXT,
    "callToAction" TEXT,
    "link" TEXT,
    "promoCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_audiences" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "segmentCriteria" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_metrics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalConverted" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "uniqueOpens" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DECIMAL(5,2),
    "conversionRate" DECIMAL(5,2),
    "roi" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_engagements" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "eventType" "public"."CampaignEventType" NOT NULL,
    "eventData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_brandId_idx" ON "public"."campaigns"("brandId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "public"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_type_idx" ON "public"."campaigns"("type");

-- CreateIndex
CREATE INDEX "campaigns_startDate_idx" ON "public"."campaigns"("startDate");

-- CreateIndex
CREATE INDEX "campaign_audiences_campaignId_idx" ON "public"."campaign_audiences"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_audiences_customerId_idx" ON "public"."campaign_audiences"("customerId");

-- CreateIndex
CREATE INDEX "campaign_audiences_email_idx" ON "public"."campaign_audiences"("email");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_campaignId_key" ON "public"."campaign_metrics"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_metrics_campaignId_idx" ON "public"."campaign_metrics"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_engagements_campaignId_idx" ON "public"."campaign_engagements"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_engagements_customerId_idx" ON "public"."campaign_engagements"("customerId");

-- CreateIndex
CREATE INDEX "campaign_engagements_eventType_idx" ON "public"."campaign_engagements"("eventType");

-- CreateIndex
CREATE INDEX "campaign_engagements_createdAt_idx" ON "public"."campaign_engagements"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_audiences" ADD CONSTRAINT "campaign_audiences_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_audiences" ADD CONSTRAINT "campaign_audiences_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_metrics" ADD CONSTRAINT "campaign_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_engagements" ADD CONSTRAINT "campaign_engagements_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_engagements" ADD CONSTRAINT "campaign_engagements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
