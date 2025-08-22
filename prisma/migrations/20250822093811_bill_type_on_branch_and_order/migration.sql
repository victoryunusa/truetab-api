-- CreateEnum
CREATE TYPE "public"."BillType" AS ENUM ('FINE_DINE', 'QUICK_BILL');

-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "defaultBillType" "public"."BillType" NOT NULL DEFAULT 'FINE_DINE';

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "billType" "public"."BillType" NOT NULL DEFAULT 'FINE_DINE';
