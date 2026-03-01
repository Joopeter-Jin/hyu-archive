// app/messages/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect, notFound } from "next/navigation"
import DMThreadClient from "@/components/dm/DMThreadClient"

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: threadId } = await params

  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  if (!email) redirect("/")

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!me?.id) redirect("/")

  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      userA: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true } },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 80,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  })

  if (!thread) return notFound()
  if (thread.userAId !== me.id && thread.userBId !== me.id) redirect("/messages")

  // ✅ self-DM이면 "내 메모", 아니면 상대 이름
  const isSelf = thread.userAId === thread.userBId

  const other = thread.userAId === me.id ? thread.userB : thread.userA
  const otherName = isSelf
    ? "내 메모"
    : other.profile?.displayName?.trim() || other.name?.trim() || "User"

  const initialMessages = thread.messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <DMThreadClient
      meId={me.id}
      threadId={thread.id}
      otherName={otherName}
      initialMessages={initialMessages}
    />
  )
}