-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "businessHours" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "paymentSettings" JSONB,
    "receiptSettings" JSONB,
    "orderSettings" JSONB,
    "notifications" JSONB,
    "taxSettings" JSONB,
    "features" JSONB,
    "emailSettings" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '12h',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_brandId_key" ON "public"."settings"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_branchId_key" ON "public"."settings"("branchId");

-- CreateIndex
CREATE INDEX "settings_brandId_idx" ON "public"."settings"("brandId");

-- CreateIndex
CREATE INDEX "settings_branchId_idx" ON "public"."settings"("branchId");
