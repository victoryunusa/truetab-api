/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `tables` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."tables" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tables_code_key" ON "public"."tables"("code");
