/*
  Warnings:

  - You are about to drop the column `playerId` on the `BookingApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `ChallengeApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `parentIds` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `CoachAvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `CustomSessionBooking` table. All the data in the column will be lost.
  - You are about to drop the column `playerIds` on the `CustomSessionBooking` table. All the data in the column will be lost.
  - You are about to drop the column `followerId` on the `Following` table. All the data in the column will be lost.
  - You are about to drop the column `followingId` on the `Following` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `scoutId` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `PlayerBookmark` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `PlayerBookmark` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `PlayerShortlist` table. All the data in the column will be lost.
  - You are about to drop the column `scoutId` on the `PlayerShortlist` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `PostApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `giverId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `SessionBooking` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `SessionBooking` table. All the data in the column will be lost.
  - Added the required column `playerAuthId` to the `BookingApprovalRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `ChallengeApprovalRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `CoachAvailabilityBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `CustomSessionBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `followerAuthId` to the `Following` table without a default value. This is not possible if the table is not empty.
  - Added the required column `followingAuthId` to the `Following` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoutAuthId` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `PlayerBookmark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `PlayerBookmark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `PlayerShortlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoutAuthId` to the `PlayerShortlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `PostApprovalRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `giverAuthId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachAuthId` to the `SessionBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAuthId` to the `SessionBooking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BookingApprovalRequest" DROP CONSTRAINT "BookingApprovalRequest_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Challenge" DROP CONSTRAINT "Challenge_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChallengeApprovalRequest" DROP CONSTRAINT "ChallengeApprovalRequest_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Child" DROP CONSTRAINT "Child_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CoachAvailabilityBlock" DROP CONSTRAINT "CoachAvailabilityBlock_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustomSessionBooking" DROP CONSTRAINT "CustomSessionBooking_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Following" DROP CONSTRAINT "Following_followerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Following" DROP CONSTRAINT "Following_followingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invitation" DROP CONSTRAINT "Invitation_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invitation" DROP CONSTRAINT "Invitation_scoutId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerBookmark" DROP CONSTRAINT "PlayerBookmark_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerBookmark" DROP CONSTRAINT "PlayerBookmark_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerShortlist" DROP CONSTRAINT "PlayerShortlist_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerShortlist" DROP CONSTRAINT "PlayerShortlist_scoutId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Post" DROP CONSTRAINT "Post_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PostApprovalRequest" DROP CONSTRAINT "PostApprovalRequest_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_giverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SessionBooking" DROP CONSTRAINT "SessionBooking_coachId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SessionBooking" DROP CONSTRAINT "SessionBooking_playerId_fkey";

-- AlterTable
ALTER TABLE "public"."BookingApprovalRequest" DROP COLUMN "playerId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Challenge" DROP COLUMN "coachId",
ADD COLUMN     "coachAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ChallengeApprovalRequest" DROP COLUMN "playerId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Child" DROP COLUMN "parentIds",
DROP COLUMN "playerId",
ADD COLUMN     "parentAuthIds" TEXT[],
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."CoachAvailabilityBlock" DROP COLUMN "coachId",
ADD COLUMN     "coachAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."CustomSessionBooking" DROP COLUMN "coachId",
DROP COLUMN "playerIds",
ADD COLUMN     "coachAuthId" TEXT NOT NULL,
ADD COLUMN     "playerAuthIds" TEXT[];

-- AlterTable
ALTER TABLE "public"."Following" DROP COLUMN "followerId",
DROP COLUMN "followingId",
ADD COLUMN     "followerAuthId" TEXT NOT NULL,
ADD COLUMN     "followingAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invitation" DROP COLUMN "playerId",
DROP COLUMN "scoutId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL,
ADD COLUMN     "scoutAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PlayerBookmark" DROP COLUMN "coachId",
DROP COLUMN "playerId",
ADD COLUMN     "coachAuthId" TEXT NOT NULL,
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PlayerShortlist" DROP COLUMN "playerId",
DROP COLUMN "scoutId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL,
ADD COLUMN     "scoutAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "playerId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PostApprovalRequest" DROP COLUMN "playerId",
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "coachId",
DROP COLUMN "giverId",
ADD COLUMN     "coachAuthId" TEXT NOT NULL,
ADD COLUMN     "giverAuthId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SessionBooking" DROP COLUMN "coachId",
DROP COLUMN "playerId",
ADD COLUMN     "coachAuthId" TEXT NOT NULL,
ADD COLUMN     "playerAuthId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."CoachAvailabilityBlock" ADD CONSTRAINT "CoachAvailabilityBlock_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomSessionBooking" ADD CONSTRAINT "CustomSessionBooking_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_scoutAuthId_fkey" FOREIGN KEY ("scoutAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Following" ADD CONSTRAINT "Following_followingAuthId_fkey" FOREIGN KEY ("followingAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Following" ADD CONSTRAINT "Following_followerAuthId_fkey" FOREIGN KEY ("followerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBookmark" ADD CONSTRAINT "PlayerBookmark_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBookmark" ADD CONSTRAINT "PlayerBookmark_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerShortlist" ADD CONSTRAINT "PlayerShortlist_scoutAuthId_fkey" FOREIGN KEY ("scoutAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerShortlist" ADD CONSTRAINT "PlayerShortlist_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingApprovalRequest" ADD CONSTRAINT "BookingApprovalRequest_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostApprovalRequest" ADD CONSTRAINT "PostApprovalRequest_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeApprovalRequest" ADD CONSTRAINT "ChallengeApprovalRequest_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_giverAuthId_fkey" FOREIGN KEY ("giverAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_coachAuthId_fkey" FOREIGN KEY ("coachAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Child" ADD CONSTRAINT "Child_playerAuthId_fkey" FOREIGN KEY ("playerAuthId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
