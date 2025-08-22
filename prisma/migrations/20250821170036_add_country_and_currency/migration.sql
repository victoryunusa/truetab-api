/*
  Warnings:

  - You are about to drop the column `country` on the `brands` table. All the data in the column will be lost.
  - Added the required column `currency` to the `brands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "countryId" TEXT;

-- AlterTable
ALTER TABLE "public"."brands" DROP COLUMN "country",
ADD COLUMN     "countryId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "public"."countries"("code");

-- AddForeignKey
ALTER TABLE "public"."brands" ADD CONSTRAINT "brands_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
