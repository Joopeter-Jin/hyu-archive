// app/api/dm/thread/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function asString(v: unknown) {
  return typeof v === "string" ? v : ""
}

async function getMeId() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  if (!email) return null
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  return me?.id ?? null
}

export async function POST(req: Request) {
  const meId = await getMeId()
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const otherUserId = asString(body.otherUserId).trim()
  if (!otherUserId) {
    return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 })
  }

  // ✅ 존재 체크 (self는 생략)
  if (otherUserId !== meId) {
    const exists = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
  }

  // ✅ 항상 userAId < userBId 정렬 저장 (self면 a=b=meId)
  const userAId = meId <= otherUserId ? meId : otherUserId
  const userBId = meId <= otherUserId ? otherUserId : meId

  // ✅ upsert: 이미 있으면 그대로 반환, 없으면 생성
  const thread = await prisma.dMThread.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
    select: { id: true },
  })

  return NextResponse.json({ threadId: thread.id }, { status: 200 })
}