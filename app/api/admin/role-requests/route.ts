// app/api/admin/role-requests/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, userId: null }

  const prof = await prisma.userProfile.findUnique({
    where: { userId },
    select: { role: true },
  })
  if (prof?.role !== "ADMIN") return { ok: false as const, userId: null }
  return { ok: true as const, userId }
}

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get("status") ?? "PENDING").toUpperCase()

  const list = await prisma.roleRequest.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      requestedRole: true,
      reason: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return NextResponse.json(list, { status: 200 })
}