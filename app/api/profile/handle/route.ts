// app/api/profile/handle/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function normalizeHandle(v: string) {
  return v.trim().replace(/\s+/g, " ")
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const displayName = normalizeHandle(String(body.displayName ?? ""))

  if (!displayName) return NextResponse.json({ error: "displayName is required" }, { status: 400 })
  if (displayName.length < 2 || displayName.length > 20) {
    return NextResponse.json({ error: "displayName must be 2~20 chars" }, { status: 400 })
  }

  // unique 충돌 체크 (내 것 제외)
  const exists = await prisma.userProfile.findFirst({
    where: { displayName, NOT: { userId } },
    select: { userId: true },
  })
  if (exists) return NextResponse.json({ error: "displayName already taken" }, { status: 409 })

  const updated = await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, displayName },
    update: { displayName },
    select: { userId: true, displayName: true, role: true, updatedAt: true },
  })

  return NextResponse.json(updated, { status: 200 })
}