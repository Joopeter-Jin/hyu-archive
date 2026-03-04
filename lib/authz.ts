// lib/authz.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function requireUser() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { ok: true as const, userId }
}

export async function requireAdmin() {
  const u = await requireUser()
  if (!u.ok) return u

  const me = await prisma.userProfile.findUnique({
    where: { userId: u.userId },
    select: { role: true },
  })

  if (me?.role !== "ADMIN") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const, userId: u.userId }
}