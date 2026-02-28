/*
  Warnings:

  - You are about to drop the column `createdAt` on the `notification_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `notification_jobs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "notification_jobs_processed_idx";

-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "mime_type" SET DEFAULT 'application/octet-stream',
ALTER COLUMN "size" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "notification_jobs" DROP COLUMN "createdAt",
DROP COLUMN "destination",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "processed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notification_jobs_processed_created_at_idx" ON "notification_jobs"("processed", "created_at");

-- CreateIndex
CREATE INDEX "notification_jobs_postId_idx" ON "notification_jobs"("postId");
