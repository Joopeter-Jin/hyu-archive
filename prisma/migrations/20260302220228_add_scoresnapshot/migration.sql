-- CreateTable
CREATE TABLE "score_snapshots" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "window_days" INTEGER NOT NULL DEFAULT 90,
    "date_key" TIMESTAMP(3) NOT NULL,
    "activity" INTEGER NOT NULL DEFAULT 0,
    "impact" INTEGER NOT NULL DEFAULT 0,
    "scholarly" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "score_snapshots_date_key_idx" ON "score_snapshots"("date_key");

-- CreateIndex
CREATE INDEX "score_snapshots_user_id_date_key_idx" ON "score_snapshots"("user_id", "date_key");

-- CreateIndex
CREATE UNIQUE INDEX "score_snapshots_user_id_window_days_date_key_key" ON "score_snapshots"("user_id", "window_days", "date_key");

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
