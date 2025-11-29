-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."menu_categories" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."menu_items" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."modifier_groups" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."promotions" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."purchase_orders" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "public"."recipes" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modifier_groups" ADD CONSTRAINT "modifier_groups_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipes" ADD CONSTRAINT "recipes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
