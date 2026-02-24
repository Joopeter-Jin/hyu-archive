// app/api/admin/users/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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

export async function GET(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { profile: { is: { displayName: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      profile: { select: { displayName: true, role: true } },
      _count: { select: { posts: true, comments: true, votes: true } },
    },
  })

  return json(users, 200)
}