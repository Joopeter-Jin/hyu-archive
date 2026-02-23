// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return false

  const prof = await prisma.userProfile.findUnique({ where: { userId }, select: { role: true } })
  return prof?.role === "ADMIN"
}

export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({}))
  const role = String(body.role ?? "").toUpperCase()
  const allowed = ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR", "USER"]
  if (!allowed.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

  const updated = await prisma.userProfile.upsert({
    where: { userId: id },
    create: { userId: id, displayName: "User", role: role as any },
    update: { role: role as any },
    select: { userId: true, displayName: true, role: true },
  })

  return NextResponse.json(updated, { status: 200 })
}