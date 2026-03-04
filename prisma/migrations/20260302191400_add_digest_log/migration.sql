/*
  Warnings:

  - You are about to drop the column `target_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `activity_logs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[category,post_id]` on the table `post_pins` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "activity_logs_action_created_at_idx";

-- DropIndex
DROP INDEX "activity_logs_target_type_target_id_created_at_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "post_id" UUID,
ADD COLUMN     "target_user_id" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_post_id_created_at_idx" ON "activity_logs"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_target_user_id_created_at_idx" ON "activity_logs"("target_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_pins_category_post_id_key" ON "post_pins"("category", "post_id");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
