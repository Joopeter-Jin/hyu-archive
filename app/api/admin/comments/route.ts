// app/api/admin/comments/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  const postId = (searchParams.get("postId") ?? "").trim() || undefined

  const comments = await prisma.comment.findMany({
    where: {
      ...(postId ? { postId } : {}),
      ...(q
        ? {
            OR: [
              { content: { contains: q, mode: "insensitive" } },
              { author: { email: { contains: q, mode: "insensitive" } } },
              { author: { profile: { displayName: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
      post: { select: { id: true, title: true, category: true } },
      _count: { select: { votes: true, replies: true } },
    },
  })

  return NextResponse.json(comments, { status: 200 })
}