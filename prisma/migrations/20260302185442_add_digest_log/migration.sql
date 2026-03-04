/*
  Warnings:

  - The `channel` column on the `notification_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `channel` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'BOOKMARK');

-- CreateEnum
CREATE TYPE "EndorsementType" AS ENUM ('PROFESSOR', 'GRAD');

-- CreateEnum
CREATE TYPE "EndorsementSentiment" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('POST_CREATE', 'POST_UPDATE', 'POST_DELETE', 'REACTION_LIKE_ON', 'REACTION_LIKE_OFF', 'REACTION_BOOKMARK_ON', 'REACTION_BOOKMARK_OFF', 'CITATION_CREATE', 'CITATION_DELETE', 'ENDORSEMENT_CREATE', 'ENDORSEMENT_DELETE', 'ARCHIVE_PICK_ON', 'ARCHIVE_PICK_OFF', 'MERIT_BADGE_GRANT', 'MERIT_BADGE_REVOKE', 'POST_PIN_ON', 'POST_PIN_OFF', 'ROLE_REQUEST_CREATE', 'ROLE_REQUEST_DECIDE', 'DM_THREAD_CREATE', 'DM_MESSAGE_SEND');

-- AlterTable
ALTER TABLE "notification_jobs" DROP COLUMN "channel",
ADD COLUMN     "channel" "NotifyChannel" NOT NULL DEFAULT 'EMAIL';

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "channel",
ADD COLUMN     "channel" "NotifyChannel" NOT NULL DEFAULT 'EMAIL';

-- DropEnum
DROP TYPE "NotificationChannel";

-- DropEnum
DROP TYPE "NotificationDestination";

-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "from_post_id" UUID NOT NULL,
    "to_post_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "endorser_id" TEXT NOT NULL,
    "type" "EndorsementType" NOT NULL,
    "sentiment" "EndorsementSentiment" NOT NULL DEFAULT 'POSITIVE',
    "endorser_role_snapshot" "Role" NOT NULL DEFAULT 'USER',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_picks" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "admin_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archive_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merit_badges" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merit_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_merit_badges" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" UUID NOT NULL,
    "granted_by" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_merit_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_pins" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "pinned_by_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unpinned_at" TIMESTAMP(3),

    CONSTRAINT "post_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "actor_id" TEXT,
    "action" "LogAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reactions_user_id_created_at_idx" ON "reactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reactions_post_id_created_at_idx" ON "reactions"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_post_id_user_id_type_key" ON "reactions"("post_id", "user_id", "type");

-- CreateIndex
CREATE INDEX "citations_to_post_id_created_at_idx" ON "citations"("to_post_id", "created_at");

-- CreateIndex
CREATE INDEX "citations_from_post_id_created_at_idx" ON "citations"("from_post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "citations_from_post_id_to_post_id_key" ON "citations"("from_post_id", "to_post_id");

-- CreateIndex
CREATE INDEX "endorsements_post_id_created_at_idx" ON "endorsements"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "endorsements_endorser_id_created_at_idx" ON "endorsements"("endorser_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_post_id_endorser_id_type_key" ON "endorsements"("post_id", "endorser_id", "type");

-- CreateIndex
CREATE INDEX "archive_picks_admin_id_created_at_idx" ON "archive_picks"("admin_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "archive_picks_post_id_key" ON "archive_picks"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "merit_badges_code_key" ON "merit_badges"("code");

-- CreateIndex
CREATE INDEX "user_merit_badges_user_id_created_at_idx" ON "user_merit_badges"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_merit_badges_badge_id_created_at_idx" ON "user_merit_badges"("badge_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_merit_badges_user_id_badge_id_key" ON "user_merit_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "post_pins_category_active_order_pinned_at_idx" ON "post_pins"("category", "active", "order", "pinned_at");

-- CreateIndex
CREATE INDEX "post_pins_post_id_idx" ON "post_pins"("post_id");

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_target_type_target_id_created_at_idx" ON "activity_logs"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_category_channel_key" ON "subscriptions"("userId", "category", "channel");

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_from_post_id_fkey" FOREIGN KEY ("from_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_to_post_id_fkey" FOREIGN KEY ("to_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_picks" ADD CONSTRAINT "archive_picks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_picks" ADD CONSTRAINT "archive_picks_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_merit_badges" ADD CONSTRAINT "user_merit_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_merit_badges" ADD CONSTRAINT "user_merit_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "merit_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_pins" ADD CONSTRAINT "post_pins_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_pins" ADD CONSTRAINT "post_pins_pinned_by_id_fkey" FOREIGN KEY ("pinned_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
