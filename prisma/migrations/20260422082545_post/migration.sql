/*
  Warnings:

  - You are about to drop the column `difficultyType` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "difficultyType",
DROP COLUMN "position";
