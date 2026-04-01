-- CreateTable
CREATE TABLE "public"."challenge_submission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "video" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."challenge_submission" ADD CONSTRAINT "challenge_submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."challenge_submission" ADD CONSTRAINT "challenge_submission_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
