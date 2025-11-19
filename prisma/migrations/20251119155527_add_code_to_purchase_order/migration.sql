/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."purchase_orders" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_code_key" ON "public"."purchase_orders"("code");
