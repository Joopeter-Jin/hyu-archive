// app/api/admin/votes/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { role: true } } },
  })

  if (me?.profile?.role !== "ADMIN") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const, userId }
}

export async function GET(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()

  const where =
    q.length > 0
      ? {
          OR: [
            { userId: { contains: q, mode: "insensitive" as const } },
            { postId: { contains: q, mode: "insensitive" as const } },
            { commentId: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined

  const list = await prisma.vote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      value: true,
      createdAt: true,
      userId: true,
      postId: true,
      commentId: true,
      post: { select: { id: true, title: true, category: true } },
      comment: { select: { id: true, postId: true, content: true } },
    },
  })

  return NextResponse.json(list, { status: 200 })
}