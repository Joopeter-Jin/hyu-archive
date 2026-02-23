import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireUserId() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  return userId
}

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      profile: { select: { displayName: true, role: true, updatedAt: true } },
      _count: {
        select: {
          posts: true,
          comments: true,
          votes: true,
        },
      },
    },
  })

  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(me, { status: 200 })
}

export async function PUT(req: Request) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const displayName = String(body.displayName ?? "").trim()

  if (!displayName || displayName.length < 2) {
    return NextResponse.json({ error: "displayName must be at least 2 chars" }, { status: 400 })
  }
  if (displayName.length > 24) {
    return NextResponse.json({ error: "displayName too long (max 24)" }, { status: 400 })
  }

  // 프로필 없으면 생성, 있으면 업데이트
  try {
    const upserted = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName,
        role: "USER",
      },
      update: { displayName },
      select: { displayName: true, role: true, updatedAt: true },
    })

    return NextResponse.json(upserted, { status: 200 })
  } catch (e: any) {
    // unique 충돌(다른 사람이 이미 사용중인 displayName)
    return NextResponse.json({ error: "Display name already taken" }, { status: 409 })
  }
}