CREATE TABLE "challenge_bookmark" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "playerAuthId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_bookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "challenge_bookmark_challengeId_playerAuthId_key"
ON "challenge_bookmark"("challengeId", "playerAuthId");

ALTER TABLE "challenge_bookmark"
ADD CONSTRAINT "challenge_bookmark_challengeId_fkey"
FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge_bookmark"
ADD CONSTRAINT "challenge_bookmark_playerAuthId_fkey"
FOREIGN KEY ("playerAuthId") REFERENCES "auth"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
