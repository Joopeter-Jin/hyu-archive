// app/api/admin/role-requests/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) }

  const prof = await prisma.userProfile.findUnique({
    where: { userId },
    select: { role: true },
  })
  if (prof?.role !== "ADMIN") return { ok: false as const, res: json({ error: "Forbidden" }, 403) }
  return { ok: true as const, userId }
}

export async function GET(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || "PENDING" // 기본: pending만

  const where =
    status === "ALL"
      ? undefined
      : { status: status as any } // PENDING | APPROVED | REJECTED

  const items = await prisma.roleRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestedRole: true,
      status: true,
      note: true,
      adminNote: true,
      decidedAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
      reviewer: {
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return json(items, 200)
}