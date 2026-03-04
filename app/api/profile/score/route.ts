//app\api\profile\score\route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"
import { computeScore90d } from "@/lib/scoring"

export async function GET() {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // profile이 없으면 409로 명확히 (또는 200 + 안내)
  const profile = await prisma.userProfile.findUnique({ where: { userId: me.id }, select: { userId: true } })
  if (!profile) return NextResponse.json({ error: "ProfileNotReady" }, { status: 409 })

  const score = await computeScore90d(me.id)

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const posts90d = await prisma.post.count({
    where: { authorId: me.id, createdAt: { gte: since } },
  })

  const levelWithMinPosts = posts90d >= 3 ? score.contributorLevel : 0
  const autoLevel = Math.min(levelWithMinPosts, 4)

  await prisma.userProfile.update({
    where: { userId: me.id },
    data: {
      contributorLevel: autoLevel,
      score90dActivity: score.activity,
      score90dImpact: score.impact,
      score90dScholarly: score.scholarly,
      score90dTotal: score.total,
      scoreUpdatedAt: new Date(),
    },
  })

  return NextResponse.json(
    {
      ...score,
      contributorLevel: autoLevel,
      posts90d,
    },
    { status: 200 }
  )
}