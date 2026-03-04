-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "contributor_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score_90d_activity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score_90d_impact" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score_90d_scholarly" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score_90d_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score_updated_at" TIMESTAMP(3);
