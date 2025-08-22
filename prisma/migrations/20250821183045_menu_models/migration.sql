-- CreateTable
CREATE TABLE "public"."menu_categories" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_items" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "defaultName" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_i18n" (
    "itemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "menu_item_i18n_pkey" PRIMARY KEY ("itemId","locale")
);

-- CreateTable
CREATE TABLE "public"."menu_item_variants" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "costPrice" DECIMAL(12,2),
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modifier_groups" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modifier_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_categories" (
    "itemId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("itemId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."item_modifier_groups" (
    "itemId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_modifier_groups_pkey" PRIMARY KEY ("itemId","groupId")
);

-- CreateTable
CREATE TABLE "public"."item_variant_modifier_groups" (
    "variantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "item_variant_modifier_groups_pkey" PRIMARY KEY ("variantId","groupId")
);

-- CreateTable
CREATE TABLE "public"."branch_item_variants" (
    "branchId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "menuItemId" TEXT,

    CONSTRAINT "branch_item_variants_pkey" PRIMARY KEY ("branchId","variantId")
);

-- CreateIndex
CREATE INDEX "menu_categories_brandId_idx" ON "public"."menu_categories"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_sku_key" ON "public"."menu_items"("sku");

-- CreateIndex
CREATE INDEX "menu_items_brandId_idx" ON "public"."menu_items"("brandId");

-- CreateIndex
CREATE INDEX "menu_item_variants_itemId_idx" ON "public"."menu_item_variants"("itemId");

-- CreateIndex
CREATE INDEX "modifier_groups_brandId_idx" ON "public"."modifier_groups"("brandId");

-- CreateIndex
CREATE INDEX "modifier_options_groupId_idx" ON "public"."modifier_options"("groupId");

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_i18n" ADD CONSTRAINT "menu_item_i18n_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_variants" ADD CONSTRAINT "menu_item_variants_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modifier_groups" ADD CONSTRAINT "modifier_groups_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modifier_options" ADD CONSTRAINT "modifier_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_categories" ADD CONSTRAINT "item_categories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_categories" ADD CONSTRAINT "item_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_modifier_groups" ADD CONSTRAINT "item_modifier_groups_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_modifier_groups" ADD CONSTRAINT "item_modifier_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_variant_modifier_groups" ADD CONSTRAINT "item_variant_modifier_groups_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."menu_item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_variant_modifier_groups" ADD CONSTRAINT "item_variant_modifier_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_item_variants" ADD CONSTRAINT "branch_item_variants_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_item_variants" ADD CONSTRAINT "branch_item_variants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."menu_item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_item_variants" ADD CONSTRAINT "branch_item_variants_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
