/*
  Warnings:

  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_branchId_fkey";

-- DropIndex
DROP INDEX "public"."users_branchId_idx";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "branchId";

-- CreateTable
CREATE TABLE "public"."user_branches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_branches_userId_branchId_key" ON "public"."user_branches"("userId", "branchId");

-- AddForeignKey
ALTER TABLE "public"."user_branches" ADD CONSTRAINT "user_branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_branches" ADD CONSTRAINT "user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
