// app/api/dm/messages/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function getMeId() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  if (!email) return null
  const me = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return me?.id ?? null
}

export async function GET(req: Request) {
  const meId = await getMeId()
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get("threadId") || ""
  const after = searchParams.get("after") || ""

  if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 })

  // 참여자 검증
  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    select: { userAId: true, userBId: true },
  })
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  if (thread.userAId !== meId && thread.userBId !== meId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const afterDate = after ? new Date(after) : new Date(0)

  const msgs = await prisma.dMMessage.findMany({
    where: {
      threadId,
      createdAt: { gt: afterDate },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, body: true, createdAt: true, senderId: true },
  })

  return NextResponse.json(
    msgs.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    { status: 200 }
  )
}