// app/api/profile/activity/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tab = String(searchParams.get("tab") ?? "")

  const normalizeAuthor = (a: any) => ({
    id: a.id,
    displayName: a.profile?.displayName?.trim() || a.name?.trim() || "User",
    role: a.profile?.role ?? "USER",
    contributorLevel: a.profile?.contributorLevel ?? 0,
  })

  // 탭별로 필요한 것만 조회 (중요!)
  if (tab === "posts") {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, category: true, createdAt: true, views: true },
    })
    return NextResponse.json({ posts }, { status: 200 })
  }

  if (tab === "comments") {
    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    })
    return NextResponse.json({ comments }, { status: 200 })
  }

  if (tab === "votes") {
    const votes = await prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    })
    return NextResponse.json({ votes }, { status: 200 })
  }

  if (tab === "bookmarks") {
    const bookmarks = await prisma.reaction.findMany({
      where: { userId, type: "BOOKMARK" },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        post: { select: { id: true, title: true, category: true, createdAt: true, views: true } },
      },
    })
    return NextResponse.json(
      { bookmarks: bookmarks.map((b) => ({ id: b.id, createdAt: b.createdAt, post: b.post })) },
      { status: 200 }
    )
  }

  if (tab === "citations-received") {
    const citationsItemsReceived = await prisma.citation.findMany({
      where: { toPost: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        fromPost: {
          select: {
            id: true,
            title: true,
            category: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { displayName: true, role: true, contributorLevel: true } },
              },
            },
          },
        },
        toPost: { select: { id: true, title: true, category: true } },
      },
    })

    return NextResponse.json(
      {
        citationsItemsReceived: citationsItemsReceived.map((c) => ({
          id: c.id,
          createdAt: c.createdAt,
          fromPost: {
            id: c.fromPost.id,
            title: c.fromPost.title,
            category: c.fromPost.category,
            createdAt: c.fromPost.createdAt,
            author: normalizeAuthor(c.fromPost.author),
          },
          toPost: c.toPost,
        })),
      },
      { status: 200 }
    )
  }

  if (tab === "citations-given") {
    const citationsItemsGiven = await prisma.citation.findMany({
      where: { fromPost: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        fromPost: { select: { id: true, title: true, category: true, createdAt: true } },
        toPost: {
          select: {
            id: true,
            title: true,
            category: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { displayName: true, role: true, contributorLevel: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        citationsItemsGiven: citationsItemsGiven.map((c) => ({
          id: c.id,
          createdAt: c.createdAt,
          fromPost: c.fromPost,
          toPost: {
            id: c.toPost.id,
            title: c.toPost.title,
            category: c.toPost.category,
            createdAt: c.toPost.createdAt,
            author: normalizeAuthor(c.toPost.author),
          },
        })),
      },
      { status: 200 }
    )
  }

  return NextResponse.json({ error: "tab required" }, { status: 400 })
}