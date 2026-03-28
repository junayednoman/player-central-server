/*
  Warnings:

  - Changed the type of `experience` on the `CoachProfile` table. This migration casts existing values.

*/
-- AlterTable
ALTER TABLE "public"."CoachProfile"
  ALTER COLUMN "experience" TYPE INTEGER
  USING NULLIF("experience", '')::INTEGER;
