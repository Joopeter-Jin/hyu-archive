// app/api/profile/activity/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [
    posts,
    comments,
    votes,
    citationsReceived,
    citationsGiven,
    bookmarks,
    citationsItemsReceived,
    citationsItemsGiven,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, category: true, createdAt: true, views: true },
    }),

    prisma.comment.findMany({
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
    }),

    prisma.vote.findMany({
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
    }),

    // ✅ Received: 내 글이 인용된 수 (toPost.authorId = me)
    prisma.citation.count({
      where: { toPost: { authorId: userId } },
    }),

    // ✅ Given: 내가 다른 글을 인용한 수 (fromPost.authorId = me)
    prisma.citation.count({
      where: { fromPost: { authorId: userId } },
    }),

    // ✅ Bookmark: Reaction 테이블로 관리(type="BOOKMARK")
    prisma.reaction.findMany({
      where: { userId, type: "BOOKMARK" },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        post: { select: { id: true, title: true, category: true, createdAt: true, views: true } },
      },
    }),

    // ✅ Received items: 내 글(toPost)이 인용된 목록
    prisma.citation.findMany({
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
    }),

    // ✅ Given items: 내가(fromPost) 인용한 목록
    prisma.citation.findMany({
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
    }),
  ])

  const normalizeAuthor = (a: any) => ({
    id: a.id,
    displayName: a.profile?.displayName?.trim() || a.name?.trim() || "User",
    role: a.profile?.role ?? "USER",
    contributorLevel: a.profile?.contributorLevel ?? 0,
  })

  return NextResponse.json(
    {
      posts,
      comments,
      votes,

      citationsReceived,
      citationsGiven,

      // ✅ ProfileClient(ActivityDTO.bookmarks)와 맞춤
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        createdAt: b.createdAt,
        post: b.post,
      })),

      // ✅ ProfileClient(ActivityDTO.citationsItemsReceived)와 맞춤
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

      // ✅ ProfileClient(ActivityDTO.citationsItemsGiven)와 맞춤
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