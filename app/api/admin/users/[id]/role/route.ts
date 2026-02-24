// app/api/admin/users/[id]/role/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const adminId = (session?.user as any)?.id as string | undefined
  if (!adminId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) }

  const prof = await prisma.userProfile.findUnique({
    where: { userId: adminId },
    select: { role: true },
  })
  if (prof?.role !== "ADMIN") return { ok: false as const, res: json({ error: "Forbidden" }, 403) }
  return { ok: true as const, adminId }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: userId } = await ctx.params
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const body = await req.json().catch(() => ({}))
  const role = String(body.role ?? "").toUpperCase()

  const allowed = ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR", "USER"]
  if (!allowed.includes(role)) return json({ error: "Invalid role" }, 400)

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!existing) return json({ error: "User not found" }, 404)

  const updated = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: `user_${userId.slice(0, 6)}`,
      role: role as any,
    },
    update: { role: role as any },
    select: { userId: true, displayName: true, role: true, updatedAt: true },
  })

  return json(updated, 200)
}