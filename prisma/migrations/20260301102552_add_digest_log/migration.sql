-- CreateTable
CREATE TABLE "dm_threads" (
    "id" UUID NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_read_states" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dm_threads_last_message_at_idx" ON "dm_threads"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "dm_threads_user_a_id_user_b_id_key" ON "dm_threads"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "dm_messages_thread_id_created_at_idx" ON "dm_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "dm_messages_sender_id_idx" ON "dm_messages"("sender_id");

-- CreateIndex
CREATE INDEX "dm_read_states_user_id_last_read_at_idx" ON "dm_read_states"("user_id", "last_read_at");

-- CreateIndex
CREATE UNIQUE INDEX "dm_read_states_thread_id_user_id_key" ON "dm_read_states"("thread_id", "user_id");

-- AddForeignKey
ALTER TABLE "dm_threads" ADD CONSTRAINT "dm_threads_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_threads" ADD CONSTRAINT "dm_threads_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "dm_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_read_states" ADD CONSTRAINT "dm_read_states_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "dm_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_read_states" ADD CONSTRAINT "dm_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
