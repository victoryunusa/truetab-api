/*
  Warnings:

  - Added the required column `currency` to the `branches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "currency" TEXT NOT NULL;
