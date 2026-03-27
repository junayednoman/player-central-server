-- CreateEnum
CREATE TYPE "public"."PlayerPosition" AS ENUM ('MIDFIELDER', 'ATTACKER', 'DEFENDER', 'GOALKEEPER');

-- CreateEnum
CREATE TYPE "public"."CoachSessionType" AS ENUM ('ONE_TO_ONE', 'GROUP', 'SKILL_BASED');

-- CreateEnum
CREATE TYPE "public"."CoachMode" AS ENUM ('PLAYER_TRAVELS', 'COACH_TRAVELS');

-- CreateEnum
CREATE TYPE "public"."ScoutLevel" AS ENUM ('LOCAL', 'REGIONAL', 'NATIONAL');

-- CreateEnum
CREATE TYPE "public"."CoachAvailabilityType" AS ENUM ('AVAILABLE', 'BLACKOUT');

-- CreateEnum
CREATE TYPE "public"."CoachAvailabilityDaysOfWeek" AS ENUM ('D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6');

-- CreateEnum
CREATE TYPE "public"."ChildRelationShip" AS ENUM ('FATHER', 'MOTHER', 'UNCLE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ChildStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "public"."otp" ADD COLUMN     "resetTokenExpires" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;

-- CreateTable
CREATE TABLE "public"."PlayerProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "height" TEXT NOT NULL,
    "position" "public"."PlayerPosition" NOT NULL,
    "bio" TEXT NOT NULL,
    "completedChallenges" INTEGER NOT NULL DEFAULT 0,
    "uploadStreaks" INTEGER NOT NULL DEFAULT 0,
    "shortListedCount" INTEGER NOT NULL DEFAULT 0,
    "invitationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "teams" TEXT[],
    "certificate" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "sessionTypes" "public"."CoachSessionType"[],
    "mode" "public"."CoachMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoutProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "level" "public"."ScoutLevel" NOT NULL,
    "badge" TEXT NOT NULL,
    "intro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "defaultChildId" TEXT,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "type" "public"."CoachAvailabilityType" NOT NULL,
    "isRecurring" BOOLEAN NOT NULL,
    "dayOfWeek" "public"."CoachAvailabilityDaysOfWeek",
    "startTime" TIME,
    "endTime" TIME,
    "startAt" TIMESTAMPTZ,
    "endAt" TIMESTAMPTZ,
    "validFrom" DATE,
    "validUntil" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Child" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "parentIds" TEXT[],
    "relationship" "public"."ChildRelationShip" NOT NULL,
    "status" "public"."ChildStatus" NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_authId_key" ON "public"."PlayerProfile"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_authId_key" ON "public"."CoachProfile"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutProfile_authId_key" ON "public"."ScoutProfile"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_authId_key" ON "public"."ParentProfile"("authId");

-- AddForeignKey
ALTER TABLE "public"."PlayerProfile" ADD CONSTRAINT "PlayerProfile_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachProfile" ADD CONSTRAINT "CoachProfile_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoutProfile" ADD CONSTRAINT "ScoutProfile_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentProfile" ADD CONSTRAINT "ParentProfile_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachAvailabilityBlock" ADD CONSTRAINT "CoachAvailabilityBlock_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
