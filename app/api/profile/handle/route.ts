// app/api/profile/handle/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const displayName = String(body.displayName ?? "").trim()

  if (displayName.length < 2 || displayName.length > 20) {
    return NextResponse.json({ error: "Display name must be 2~20 chars." }, { status: 400 })
  }

  try {
    const saved = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName,
        role: "USER",
      },
      update: {
        displayName,
      },
      select: { userId: true, displayName: true, role: true, updatedAt: true },
    })

    return NextResponse.json(saved, { status: 200 })
  } catch (e: any) {
    // displayName unique 충돌 처리
    const msg = String(e?.message ?? "")
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "This display name is already taken." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to save display name." }, { status: 500 })
  }
}