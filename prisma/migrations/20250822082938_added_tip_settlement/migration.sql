-- CreateTable
CREATE TABLE "public"."tip_settlements" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "registerId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(65,30) NOT NULL,
    "rule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tip_allocations" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tip_settlements_brandId_idx" ON "public"."tip_settlements"("brandId");

-- CreateIndex
CREATE INDEX "tip_settlements_branchId_idx" ON "public"."tip_settlements"("branchId");

-- CreateIndex
CREATE INDEX "tip_settlements_registerId_idx" ON "public"."tip_settlements"("registerId");

-- CreateIndex
CREATE INDEX "tip_allocations_settlementId_idx" ON "public"."tip_allocations"("settlementId");

-- CreateIndex
CREATE INDEX "tip_allocations_staffId_idx" ON "public"."tip_allocations"("staffId");

-- AddForeignKey
ALTER TABLE "public"."tip_settlements" ADD CONSTRAINT "tip_settlements_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_settlements" ADD CONSTRAINT "tip_settlements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_allocations" ADD CONSTRAINT "tip_allocations_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "public"."tip_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_allocations" ADD CONSTRAINT "tip_allocations_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
