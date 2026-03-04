// app/api/reactions/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const postId = body?.postId as string | undefined
  const type = body?.type as "LIKE" | "BOOKMARK" | undefined
  const enabled = body?.enabled as boolean | undefined

  if (!postId || !type || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId, type } },
    select: { id: true },
  })

  if (enabled) {
    if (!existing) {
      await prisma.reaction.create({ data: { postId, userId, type } })
    }
  } else {
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    }
  }

  const [like, bookmark, mine] = await Promise.all([
    prisma.reaction.count({ where: { postId, type: "LIKE" } }),
    prisma.reaction.count({ where: { postId, type: "BOOKMARK" } }),
    prisma.reaction.findMany({ where: { postId, userId }, select: { type: true } }),
  ])

  const set = new Set(mine.map((r) => r.type))

  return NextResponse.json(
    {
      ok: true,
      postId,
      reactions: { like, bookmark },
      mine: { like: set.has("LIKE"), bookmark: set.has("BOOKMARK") },
    },
    { status: 200 }
  )
}