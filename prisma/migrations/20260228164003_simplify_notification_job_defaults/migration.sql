/*
  Warnings:

  - You are about to drop the column `created_at` on the `notification_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `notification_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `post_id` on the `notification_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `sent_at` on the `notification_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `notification_jobs` table. All the data in the column will be lost.
  - The `channel` column on the `notification_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `destination` column on the `notification_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `postId` to the `notification_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationDestination" AS ENUM ('SUBSCRIBERS');

-- DropForeignKey
ALTER TABLE "notification_jobs" DROP CONSTRAINT "notification_jobs_post_id_fkey";

-- DropIndex
DROP INDEX "notification_jobs_post_id_idx";

-- DropIndex
DROP INDEX "notification_jobs_status_created_at_idx";

-- AlterTable
ALTER TABLE "notification_jobs" DROP COLUMN "created_at",
DROP COLUMN "error",
DROP COLUMN "post_id",
DROP COLUMN "sent_at",
DROP COLUMN "status",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "postId" UUID NOT NULL,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
DROP COLUMN "destination",
ADD COLUMN     "destination" "NotificationDestination" NOT NULL DEFAULT 'SUBSCRIBERS';

-- CreateIndex
CREATE INDEX "notification_jobs_processed_idx" ON "notification_jobs"("processed");

-- AddForeignKey
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
