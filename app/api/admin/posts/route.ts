// app/api/admin/posts/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  const category = (searchParams.get("category") ?? "").trim() || undefined

  const posts = await prisma.post.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
              { author: { profile: { displayName: { contains: q, mode: "insensitive" } } } },
              { author: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      views: true,
      authorId: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
      _count: { select: { comments: true, votes: true } },
    },
  })

  return NextResponse.json(posts, { status: 200 })
}