// app/api/profile/boot/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
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

          // 아래 필드들이 스키마에 없으면 제거하세요 (있는 경우: 캐시 점수 빠르게 표시 가능)
          score90dActivity: true,
          score90dImpact: true,
          score90dScholarly: true,
          score90dTotal: true,
          scoreUpdatedAt: true,
          coreCandidate: true,
        } as any,
      },
    },
  })

  if (!me) return NextResponse.json({ error: "NotFound" }, { status: 404 })

  // counts는 count로 싸게
  const [posts, comments, votes, bookmarks] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.vote.count({ where: { userId } }),
    prisma.reaction.count({ where: { userId, type: "BOOKMARK" } }),
  ])

  // citationsReceived는 join이 필요하지만 count 1회로만 끝냄
  const citationsReceived = await prisma.citation.count({
    where: { toPost: { authorId: userId } },
  })

  // Citations 탭 배지용: received/given 개수
  const [citationsReceivedCount, citationsGivenCount] = await Promise.all([
    prisma.citation.count({ where: { toPost: { authorId: userId } } }),
    prisma.citation.count({ where: { fromPost: { authorId: userId } } }),
  ])

  const profileAny = me.profile as any

  // score 캐시: profile에 저장된 값만 사용 (실시간 compute 안 함)
  const scoreCached =
    me.profile
      ? {
          activity: Number(profileAny?.score90dActivity ?? 0),
          impact: Number(profileAny?.score90dImpact ?? 0),
          scholarly: Number(profileAny?.score90dScholarly ?? 0),
          total: Number(profileAny?.score90dTotal ?? 0),
          contributorLevel: Number(profileAny?.contributorLevel ?? 0),
          coreCandidate: Boolean(profileAny?.coreCandidate ?? false),
          breakdown: {
            posts90d: 0,
            comments90d: 0,
            reactions90d: { like: 0, bookmark: 0 },
            citationsReceived90d: 0,
            endorsements90d: { professor: 0, grad: 0, negative: 0 },
            archivePicks90d: 0,
            diversityCategoriesCount: 0,
          },
          scoreUpdatedAt: profileAny?.scoreUpdatedAt ?? null,
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
}