-- CreateTable
CREATE TABLE "public"."_BranchUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BranchUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BranchUsers_B_index" ON "public"."_BranchUsers"("B");

-- AddForeignKey
ALTER TABLE "public"."_BranchUsers" ADD CONSTRAINT "_BranchUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BranchUsers" ADD CONSTRAINT "_BranchUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
