/*
  Warnings:

  - You are about to drop the column `created_at` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `subscriptions` table. All the data in the column will be lost.
  - The `channel` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,category,channel]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_fkey";

-- DropIndex
DROP INDEX "subscriptions_category_is_active_idx";

-- DropIndex
DROP INDEX "subscriptions_destination_idx";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "created_at",
DROP COLUMN "destination",
DROP COLUMN "is_active",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL';

-- CreateIndex
CREATE INDEX "subscriptions_category_active_idx" ON "subscriptions"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_category_channel_key" ON "subscriptions"("userId", "category", "channel");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
