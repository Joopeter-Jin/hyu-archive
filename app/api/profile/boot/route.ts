// app/api/profile/boot/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profile: {
          select: {
            displayName: true,
            role: true,
            contributorLevel: true,
            createdAt: true,
            updatedAt: true,

            score90dActivity: true,
            score90dImpact: true,
            score90dScholarly: true,
            score90dTotal: true,
            scoreUpdatedAt: true,

            // ❌ coreCandidate: true  <- 스키마에 없으니 제거
          },
        },
      },
    })

    if (!me) return NextResponse.json({ error: "NotFound" }, { status: 404 })

    const [posts, comments, votes, bookmarks] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.reaction.count({ where: { userId, type: "BOOKMARK" } }),
    ])

    const [citationsReceivedCount, citationsGivenCount] = await Promise.all([
      prisma.citation.count({ where: { toPost: { authorId: userId } } }),
      prisma.citation.count({ where: { fromPost: { authorId: userId } } }),
    ])

    const citationsReceived = citationsReceivedCount

    const p = me.profile

    // score 캐시: profile에 저장된 값만 사용
    const scoreCached =
      p
        ? {
            activity: Number(p.score90dActivity ?? 0),
            impact: Number(p.score90dImpact ?? 0),
            scholarly: Number(p.score90dScholarly ?? 0),
            total: Number(p.score90dTotal ?? 0),
            contributorLevel: Number(p.contributorLevel ?? 0),

            // ✅ coreCandidate는 "없으면 false"로 둠
            coreCandidate: false,

            breakdown: {
              posts90d: 0,
              comments90d: 0,
              reactions90d: { like: 0, bookmark: 0 },
              citationsReceived90d: 0,
              endorsements90d: { professor: 0, grad: 0, negative: 0 },
              archivePicks90d: 0,
              diversityCategoriesCount: 0,
            },
            scoreUpdatedAt: p.scoreUpdatedAt ?? null,
          }
        : null

    return NextResponse.json(
      {
        me,
        counts: { posts, comments, votes, bookmarks, citations: citationsReceivedCount + citationsGivenCount },
        citationsReceived,
        citationsReceivedCount,
        citationsGivenCount,
        scoreCached,
      },
      { status: 200 }
    )
  } catch (e: any) {
    // ✅ 다음에 비슷한 일 생길 때 바로 원인 보이게
    console.error("[/api/profile/boot] error:", e)
    return NextResponse.json({ error: "InternalError" }, { status: 500 })
  }
}