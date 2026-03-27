/*
  Warnings:

  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[authId,purpose]` on the table `otp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `purpose` to the `otp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OTPPurpose" AS ENUM ('VERIFY_ACCOUNT', 'RESET_PASSWORD');

-- DropForeignKey
ALTER TABLE "public"."admins" DROP CONSTRAINT "admins_authId_fkey";

-- AlterTable
ALTER TABLE "public"."otp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "purpose" "public"."OTPPurpose" NOT NULL;

-- DropTable
DROP TABLE "public"."admins";

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_authId_key" ON "public"."profiles"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "otp_authId_purpose_key" ON "public"."otp"("authId", "purpose");

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
