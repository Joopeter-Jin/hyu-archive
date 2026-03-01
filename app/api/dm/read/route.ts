// app/api/dm/read/route.ts
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
  if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 })

  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    select: { userAId: true, userBId: true },
  })
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  if (thread.userAId !== meId && thread.userBId !== meId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.dMReadState.upsert({
    where: { threadId_userId: { threadId, userId: meId } },
    update: { lastReadAt: new Date() },
    create: { threadId, userId: meId, lastReadAt: new Date() },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}