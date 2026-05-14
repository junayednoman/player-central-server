/*
  Warnings:

  - Added the required column `authId` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionCancellationPolicy` to the `legal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Child" ADD COLUMN     "authId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."legal" ADD COLUMN     "sessionCancellationPolicy" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Child" ADD CONSTRAINT "Child_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
