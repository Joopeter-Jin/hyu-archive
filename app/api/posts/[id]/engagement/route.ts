// app/api/posts/[id]/engagement/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const [
    commentsCount,
    citationsCount,
    upCount,
    downCount,
    likeCount,
    bookmarkCount,
    myVote,
    myReactions,
  ] = await Promise.all([
    prisma.comment.count({ where: { postId, isDeleted: false } }),

    // ✅ 이 글이 다른 글에 의해 인용된 횟수
    prisma.citation.count({
      where: { toPostId: postId },
    }),

    prisma.vote.count({ where: { postId, value: "UP" } }),
    prisma.vote.count({ where: { postId, value: "DOWN" } }),

    prisma.reaction.count({ where: { postId, type: "LIKE" } }),
    prisma.reaction.count({ where: { postId, type: "BOOKMARK" } }),

    userId
      ? prisma.vote.findUnique({
          where: { userId_postId: { userId, postId } },
          select: { value: true },
        })
      : Promise.resolve(null),

    userId
      ? prisma.reaction.findMany({
          where: { postId, userId },
          select: { type: true },
        })
      : Promise.resolve([] as Array<{ type: "LIKE" | "BOOKMARK" }>),
  ])

  const mySet = new Set(myReactions.map((r) => r.type))

  return NextResponse.json(
    {
      postId,
      counts: {
        comments: commentsCount,
        citations: citationsCount, // ✅ 추가
        votes: { up: upCount, down: downCount },
        reactions: { like: likeCount, bookmark: bookmarkCount },
      },
      mine: {
        vote: (myVote?.value as "UP" | "DOWN" | null) ?? null,
        like: mySet.has("LIKE"),
        bookmark: mySet.has("BOOKMARK"),
      },
    },
    { status: 200 }
  )
}