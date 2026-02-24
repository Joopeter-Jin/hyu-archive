// lib/authz.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function requireUser() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, status: 401 as const, userId: null }
  return { ok: true as const, status: 200 as const, userId }
}

export async function requireAdmin() {
  const base = await requireUser()
  if (!base.ok) return base

  const prof = await prisma.userProfile.findUnique({
    where: { userId: base.userId },
    select: { role: true },
  })

  if (prof?.role !== "ADMIN") {
    return { ok: false as const, status: 403 as const, userId: base.userId }
  }
  return { ok: true as const, status: 200 as const, userId: base.userId }
}