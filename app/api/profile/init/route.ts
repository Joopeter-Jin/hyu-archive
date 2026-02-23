// app/api/profile/init/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function safeSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 24)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    select: { userId: true, displayName: true, role: true },
  })

  if (existing) {
    return NextResponse.json({ ok: true, profile: existing }, { status: 200 })
  }

  // 기본 displayName 생성 (중복 방지)
  const base =
    safeSlug(String((session?.user as any)?.name ?? "")) ||
    safeSlug(String((session?.user as any)?.email ?? "")) ||
    "user"

  let displayName = base
  for (let i = 0; i < 20; i++) {
    const conflict = await prisma.userProfile.findUnique({
      where: { displayName },
      select: { displayName: true },
    })
    if (!conflict) break
    displayName = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`
  }

  const created = await prisma.userProfile.create({
    data: {
      userId,
      displayName,
      role: "USER",
    },
    select: { userId: true, displayName: true, role: true },
  })

  return NextResponse.json({ ok: true, profile: created }, { status: 201 })
}