// app/api/admin/users/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return false
  const prof = await prisma.userProfile.findUnique({ where: { userId }, select: { role: true } })
  return prof?.role === "ADMIN"
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("query") ?? "").trim()

  const where =
    query.length === 0
      ? undefined
      : {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { profile: { is: { displayName: { contains: query, mode: "insensitive" as const } } } },
          ],
        }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      profile: { select: { displayName: true, role: true } },
    },
  })

  return NextResponse.json(users, { status: 200 })
}