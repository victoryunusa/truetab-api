/*
  Warnings:

  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `total` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `quantity` on the `stock_adjustments` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,3)`.
  - Added the required column `basePrice` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linePrice` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "public"."RegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TaxScope" AS ENUM ('BRAND', 'BRANCH');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'READY', 'SERVED', 'PART_PAID', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."KitchenTicketStatus" AS ENUM ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."PrinterType" AS ENUM ('RECEIPT', 'KITCHEN');

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropIndex
DROP INDEX "public"."order_items_productId_idx";

-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "price",
DROP COLUMN "productId",
ADD COLUMN     "basePrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "isVoided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "linePrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "routeToId" TEXT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "covers" INTEGER,
ADD COLUMN     "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "service" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tip" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "type" "public"."OrderType" NOT NULL DEFAULT 'DINE_IN',
DROP COLUMN "status",
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "public"."stock_adjustments" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- CreateTable
CREATE TABLE "public"."recipes" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "itemId" TEXT,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recipe_items" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "wastePct" DECIMAL(5,2),

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "zoneId" TEXT,
    "status" "public"."TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registers" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."register_sessions" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "status" "public"."RegisterStatus" NOT NULL DEFAULT 'OPEN',
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "closingBalance" DECIMAL(12,2),
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "register_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT,
    "scope" "public"."TaxScope" NOT NULL,
    "name" TEXT NOT NULL,
    "ratePct" DECIMAL(5,2) NOT NULL,
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_charge_configs" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Service Charge',
    "type" "public"."DiscountType" NOT NULL DEFAULT 'PERCENT',
    "value" DECIMAL(7,2) NOT NULL,
    "minCovers" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_charge_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_modifiers" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "message" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sessionId" TEXT,
    "method" "public"."PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "tipAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_taxes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "taxRateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ratePct" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kitchen_stations" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_routes" (
    "stationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "item_routes_pkey" PRIMARY KEY ("stationId","itemId")
);

-- CreateTable
CREATE TABLE "public"."variant_routes" (
    "stationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "variant_routes_pkey" PRIMARY KEY ("stationId","variantId")
);

-- CreateTable
CREATE TABLE "public"."kitchen_tickets" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "status" "public"."KitchenTicketStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kitchen_ticket_items" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" "public"."KitchenTicketStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "kitchen_ticket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."printers" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PrinterType" NOT NULL DEFAULT 'RECEIPT',
    "deviceUri" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."print_jobs" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tableId" TEXT,
    "customerId" TEXT,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "covers" INTEGER NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waitlist" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "covers" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_brandId_idx" ON "public"."recipes"("brandId");

-- CreateIndex
CREATE INDEX "recipes_itemId_idx" ON "public"."recipes"("itemId");

-- CreateIndex
CREATE INDEX "recipes_variantId_idx" ON "public"."recipes"("variantId");

-- CreateIndex
CREATE INDEX "recipe_items_recipeId_idx" ON "public"."recipe_items"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_items_productId_idx" ON "public"."recipe_items"("productId");

-- CreateIndex
CREATE INDEX "idx_zone_branch_name" ON "public"."zones"("branchId", "name");

-- CreateIndex
CREATE INDEX "idx_table_branch_name" ON "public"."tables"("branchId", "name");

-- CreateIndex
CREATE INDEX "idx_table_zone" ON "public"."tables"("zoneId");

-- CreateIndex
CREATE INDEX "registers_brandId_idx" ON "public"."registers"("brandId");

-- CreateIndex
CREATE INDEX "registers_branchId_idx" ON "public"."registers"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "registers_branchId_name_key" ON "public"."registers"("branchId", "name");

-- CreateIndex
CREATE INDEX "register_sessions_brandId_idx" ON "public"."register_sessions"("brandId");

-- CreateIndex
CREATE INDEX "register_sessions_branchId_idx" ON "public"."register_sessions"("branchId");

-- CreateIndex
CREATE INDEX "register_sessions_registerId_idx" ON "public"."register_sessions"("registerId");

-- CreateIndex
CREATE INDEX "tax_rates_brandId_idx" ON "public"."tax_rates"("brandId");

-- CreateIndex
CREATE INDEX "tax_rates_branchId_idx" ON "public"."tax_rates"("branchId");

-- CreateIndex
CREATE INDEX "service_charge_configs_brandId_idx" ON "public"."service_charge_configs"("brandId");

-- CreateIndex
CREATE INDEX "service_charge_configs_branchId_idx" ON "public"."service_charge_configs"("branchId");

-- CreateIndex
CREATE INDEX "customers_brandId_idx" ON "public"."customers"("brandId");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "public"."customers"("phone");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customer_addresses_customerId_idx" ON "public"."customer_addresses"("customerId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_orderItemId_idx" ON "public"."order_item_modifiers"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_optionId_idx" ON "public"."order_item_modifiers"("optionId");

-- CreateIndex
CREATE INDEX "order_logs_orderId_idx" ON "public"."order_logs"("orderId");

-- CreateIndex
CREATE INDEX "order_logs_status_idx" ON "public"."order_logs"("status");

-- CreateIndex
CREATE INDEX "payments_brandId_idx" ON "public"."payments"("brandId");

-- CreateIndex
CREATE INDEX "payments_branchId_idx" ON "public"."payments"("branchId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "public"."payments"("orderId");

-- CreateIndex
CREATE INDEX "payment_refunds_paymentId_idx" ON "public"."payment_refunds"("paymentId");

-- CreateIndex
CREATE INDEX "order_taxes_orderId_idx" ON "public"."order_taxes"("orderId");

-- CreateIndex
CREATE INDEX "order_taxes_taxRateId_idx" ON "public"."order_taxes"("taxRateId");

-- CreateIndex
CREATE INDEX "kitchen_stations_brandId_idx" ON "public"."kitchen_stations"("brandId");

-- CreateIndex
CREATE INDEX "kitchen_stations_branchId_idx" ON "public"."kitchen_stations"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "kitchen_stations_branchId_name_key" ON "public"."kitchen_stations"("branchId", "name");

-- CreateIndex
CREATE INDEX "kitchen_tickets_brandId_idx" ON "public"."kitchen_tickets"("brandId");

-- CreateIndex
CREATE INDEX "kitchen_tickets_branchId_idx" ON "public"."kitchen_tickets"("branchId");

-- CreateIndex
CREATE INDEX "kitchen_tickets_orderId_idx" ON "public"."kitchen_tickets"("orderId");

-- CreateIndex
CREATE INDEX "kitchen_tickets_stationId_idx" ON "public"."kitchen_tickets"("stationId");

-- CreateIndex
CREATE INDEX "kitchen_ticket_items_ticketId_idx" ON "public"."kitchen_ticket_items"("ticketId");

-- CreateIndex
CREATE INDEX "kitchen_ticket_items_orderItemId_idx" ON "public"."kitchen_ticket_items"("orderItemId");

-- CreateIndex
CREATE INDEX "printers_brandId_idx" ON "public"."printers"("brandId");

-- CreateIndex
CREATE INDEX "printers_branchId_idx" ON "public"."printers"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "printers_branchId_name_key" ON "public"."printers"("branchId", "name");

-- CreateIndex
CREATE INDEX "print_jobs_brandId_idx" ON "public"."print_jobs"("brandId");

-- CreateIndex
CREATE INDEX "print_jobs_branchId_idx" ON "public"."print_jobs"("branchId");

-- CreateIndex
CREATE INDEX "print_jobs_printerId_idx" ON "public"."print_jobs"("printerId");

-- CreateIndex
CREATE INDEX "reservations_brandId_idx" ON "public"."reservations"("brandId");

-- CreateIndex
CREATE INDEX "reservations_branchId_idx" ON "public"."reservations"("branchId");

-- CreateIndex
CREATE INDEX "reservations_reservedAt_idx" ON "public"."reservations"("reservedAt");

-- CreateIndex
CREATE INDEX "waitlist_brandId_idx" ON "public"."waitlist"("brandId");

-- CreateIndex
CREATE INDEX "waitlist_branchId_idx" ON "public"."waitlist"("branchId");

-- CreateIndex
CREATE INDEX "order_items_itemId_idx" ON "public"."order_items"("itemId");

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "public"."order_items"("variantId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_type_idx" ON "public"."orders"("type");

-- AddForeignKey
ALTER TABLE "public"."recipes" ADD CONSTRAINT "recipes_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipes" ADD CONSTRAINT "recipes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipes" ADD CONSTRAINT "recipes_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."menu_item_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipe_items" ADD CONSTRAINT "recipe_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipe_items" ADD CONSTRAINT "recipe_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zones" ADD CONSTRAINT "zones_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tables" ADD CONSTRAINT "tables_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tables" ADD CONSTRAINT "tables_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tables" ADD CONSTRAINT "tables_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registers" ADD CONSTRAINT "registers_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registers" ADD CONSTRAINT "registers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."register_sessions" ADD CONSTRAINT "register_sessions_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "public"."registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."register_sessions" ADD CONSTRAINT "register_sessions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."register_sessions" ADD CONSTRAINT "register_sessions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."register_sessions" ADD CONSTRAINT "register_sessions_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."register_sessions" ADD CONSTRAINT "register_sessions_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_rates" ADD CONSTRAINT "tax_rates_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_rates" ADD CONSTRAINT "tax_rates_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_charge_configs" ADD CONSTRAINT "service_charge_configs_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_charge_configs" ADD CONSTRAINT "service_charge_configs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_routeToId_fkey" FOREIGN KEY ("routeToId") REFERENCES "public"."kitchen_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."modifier_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_logs" ADD CONSTRAINT "order_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_logs" ADD CONSTRAINT "order_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."register_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_refunds" ADD CONSTRAINT "payment_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_taxes" ADD CONSTRAINT "order_taxes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_taxes" ADD CONSTRAINT "order_taxes_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "public"."tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_stations" ADD CONSTRAINT "kitchen_stations_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_stations" ADD CONSTRAINT "kitchen_stations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_routes" ADD CONSTRAINT "item_routes_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "public"."kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_routes" ADD CONSTRAINT "item_routes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_routes" ADD CONSTRAINT "variant_routes_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "public"."kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_routes" ADD CONSTRAINT "variant_routes_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."menu_item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_tickets" ADD CONSTRAINT "kitchen_tickets_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_tickets" ADD CONSTRAINT "kitchen_tickets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_tickets" ADD CONSTRAINT "kitchen_tickets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_tickets" ADD CONSTRAINT "kitchen_tickets_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "public"."kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_ticket_items" ADD CONSTRAINT "kitchen_ticket_items_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."kitchen_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kitchen_ticket_items" ADD CONSTRAINT "kitchen_ticket_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."printers" ADD CONSTRAINT "printers_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."printers" ADD CONSTRAINT "printers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_jobs" ADD CONSTRAINT "print_jobs_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_jobs" ADD CONSTRAINT "print_jobs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_jobs" ADD CONSTRAINT "print_jobs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "public"."printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waitlist" ADD CONSTRAINT "waitlist_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waitlist" ADD CONSTRAINT "waitlist_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
