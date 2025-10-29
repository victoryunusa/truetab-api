-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "currentBranchId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_currentBranchId_fkey" FOREIGN KEY ("currentBranchId") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
