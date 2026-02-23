// app/api/profile/activity/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [posts, comments, votes] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
        views: true,
      },
    }),

    prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        postId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
        post: { select: { id: true, title: true, category: true } },
      },
    }),

    prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        value: true,
        createdAt: true,
        postId: true,
        commentId: true,
        post: { select: { id: true, title: true, category: true } },
        comment: {
          select: {
            id: true,
            postId: true,
            parentId: true,
            content: true,
            post: { select: { id: true, title: true, category: true } },
          },
        },
      },
    }),
  ])

  return NextResponse.json({ posts, comments, votes }, { status: 200 })
}