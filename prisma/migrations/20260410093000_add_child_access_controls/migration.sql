-- CreateEnum
CREATE TYPE "ChildAccessScope" AS ENUM ('EVERYONE', 'COACH', 'SCOUT');

-- AlterTable
ALTER TABLE "Child"
ADD COLUMN "whoCanComment" "ChildAccessScope" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN "whoCanFollow" "ChildAccessScope" NOT NULL DEFAULT 'EVERYONE';
