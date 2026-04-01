-- CreateTable
CREATE TABLE "public"."PostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostShare_postId_authId_key" ON "public"."PostShare"("postId", "authId");

-- AddForeignKey
ALTER TABLE "public"."PostShare" ADD CONSTRAINT "PostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostShare" ADD CONSTRAINT "PostShare_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
