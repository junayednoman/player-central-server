/*
  Warnings:

  - You are about to drop the column `authId` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `parentAuthIds` on the `Child` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Child" DROP CONSTRAINT "Child_authId_fkey";

-- AlterTable
ALTER TABLE "public"."Child" DROP COLUMN "authId",
DROP COLUMN "parentAuthIds";

-- CreateTable
CREATE TABLE "public"."_ParentToChildren" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParentToChildren_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ParentToChildren_B_index" ON "public"."_ParentToChildren"("B");

-- AddForeignKey
ALTER TABLE "public"."_ParentToChildren" ADD CONSTRAINT "_ParentToChildren_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ParentToChildren" ADD CONSTRAINT "_ParentToChildren_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
