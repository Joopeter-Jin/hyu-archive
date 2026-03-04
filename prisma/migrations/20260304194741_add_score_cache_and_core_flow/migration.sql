-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "core_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "core_approved_at" TIMESTAMP(3),
ADD COLUMN     "core_approved_by" UUID,
ADD COLUMN     "core_candidate" BOOLEAN NOT NULL DEFAULT false;
