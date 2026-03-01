// app/api/dm/message/route.ts
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

export async function POST(req: Request) {
  const meId = await getMeId()
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const threadId = body?.threadId as string | undefined
  const text = (body?.body as string | undefined)?.trim()

  if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 })
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 })

  // 참여자 검증
  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    select: { id: true, userAId: true, userBId: true },
  })
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  if (thread.userAId !== meId && thread.userBId !== meId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.dMMessage.create({
      data: { threadId, senderId: meId, body: text },
    })

    await tx.dMThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    })

    // 보낸 사람은 읽음 처리
    await tx.dMReadState.upsert({
      where: { threadId_userId: { threadId, userId: meId } },
      update: { lastReadAt: new Date() },
      create: { threadId, userId: meId, lastReadAt: new Date() },
    })
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}