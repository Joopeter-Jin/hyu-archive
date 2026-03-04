// app/api/profile/score/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"
import { computeScore90d } from "@/lib/scoring"

export async function GET() {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // profile이 없으면 409로 명확히
  const profile = await prisma.userProfile.findUnique({
    where: { userId: me.id },
    select: { userId: true, contributorLevel: true },
  })
  if (!profile) return NextResponse.json({ error: "ProfileNotReady" }, { status: 409 })

  const score = await computeScore90d(me.id)

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const posts90d = await prisma.post.count({
    where: { authorId: me.id, createdAt: { gte: since } },
  })

  // ✅ 최소 글 조건(예: posts>=3) 만족 못하면 레벨 0
  const levelWithMinPosts = posts90d >= 3 ? score.contributorLevel : 0

  // ✅ Lv5는 자동승급 금지: 최대 4까지만 자동 반영
  const autoLevel = Math.min(levelWithMinPosts, 4)

  // ✅ candidate: computeScore90d가 coreCandidate를 주면 그걸 사용
  // (혹시 computeScore90d가 coreCandidate를 안 주면 false로)
  const coreCandidate = Boolean((score as any).coreCandidate)

  await prisma.userProfile.update({
    where: { userId: me.id },
    data: {
      contributorLevel: autoLevel,
      score90dActivity: score.activity,
      score90dImpact: score.impact,
      score90dScholarly: score.scholarly,
      score90dTotal: score.total,
      scoreUpdatedAt: new Date(),
      // ⚠️ coreCandidate를 DB에 저장하는 컬럼이 있으면 여기서 같이 업데이트 가능
    },
  })

  return NextResponse.json(
    {
      ...score,
      contributorLevel: autoLevel,
      coreCandidate,
      posts90d,
    },
    { status: 200 }
  )
}