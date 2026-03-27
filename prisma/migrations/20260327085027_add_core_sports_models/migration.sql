/*
  Warnings:

  - Changed the type of `mode` on the `CoachProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."CoachSessionMode" AS ENUM ('PLAYER_TRAVELS', 'COACH_TRAVELS');

-- CreateEnum
CREATE TYPE "public"."ChallengeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."PostType" AS ENUM ('COMMUNITY', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "public"."CoachingSessionStatus" AS ENUM ('PENDING', 'APPROVED', 'UPCOMING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."CoachProfile" DROP COLUMN "mode",
ADD COLUMN     "mode" "public"."CoachSessionMode" NOT NULL;

-- DropEnum
DROP TYPE "public"."CoachMode";

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "category" "public"."PlayerPosition" NOT NULL,
    "video" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "difficulty" "public"."ChallengeDifficulty" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionBooking" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionType" "public"."CoachSessionType" NOT NULL,
    "sessionMode" "public"."CoachSessionMode" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."CoachingSessionStatus" NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomSessionBooking" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerIds" TEXT[],
    "sessionType" "public"."CoachSessionType" NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "mode" "public"."CoachSessionMode" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."CoachingSessionStatus" NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSessionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invitation" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "trialDate" TIMESTAMP(3) NOT NULL,
    "street" TEXT NOT NULL,
    "buildingNumber" TEXT NOT NULL,
    "postCode" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "video" TEXT NOT NULL,
    "position" "public"."PlayerPosition" NOT NULL,
    "difficultyType" "public"."ChallengeDifficulty" NOT NULL,
    "type" "public"."PostType" NOT NULL,
    "status" "public"."PostStatus" NOT NULL,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Following" (
    "id" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,

    CONSTRAINT "Following_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerBookmark" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "PlayerBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerShortlist" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "PlayerShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingApprovalRequest" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "public"."ApprovalRequestStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostApprovalRequest" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" "public"."ApprovalRequestStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeApprovalRequest" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "public"."ApprovalRequestStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomSessionBooking" ADD CONSTRAINT "CustomSessionBooking_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "public"."ScoutProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Following" ADD CONSTRAINT "Following_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Following" ADD CONSTRAINT "Following_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBookmark" ADD CONSTRAINT "PlayerBookmark_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBookmark" ADD CONSTRAINT "PlayerBookmark_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerShortlist" ADD CONSTRAINT "PlayerShortlist_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "public"."ScoutProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerShortlist" ADD CONSTRAINT "PlayerShortlist_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingApprovalRequest" ADD CONSTRAINT "BookingApprovalRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingApprovalRequest" ADD CONSTRAINT "BookingApprovalRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."SessionBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostApprovalRequest" ADD CONSTRAINT "PostApprovalRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostApprovalRequest" ADD CONSTRAINT "PostApprovalRequest_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeApprovalRequest" ADD CONSTRAINT "ChallengeApprovalRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeApprovalRequest" ADD CONSTRAINT "ChallengeApprovalRequest_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Child" ADD CONSTRAINT "Child_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
