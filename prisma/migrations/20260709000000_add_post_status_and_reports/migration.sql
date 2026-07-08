-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PUBLISHED', 'UNLISTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('INVESTMENT_CONTENT', 'SPAM', 'ABUSE', 'COPYRIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "LogAction" ADD VALUE 'POST_STATUS_CHANGE';
ALTER TYPE "LogAction" ADD VALUE 'REPORT_CREATE';
ALTER TYPE "LogAction" ADD VALUE 'REPORT_RESOLVE';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "detail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "resolution_note" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_post_id_reporter_id_key" ON "reports"("post_id", "reporter_id");

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "posts_category_status_created_at_idx" ON "posts"("category", "status", "created_at");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
