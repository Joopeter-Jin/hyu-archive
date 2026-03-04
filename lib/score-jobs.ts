//lib\score-jobs.ts
import { prisma } from "@/lib/prisma"
import { computeScore90d } from "@/lib/scoring"

export async function runScoreRebuild90d() {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    select: { id: true, profile: { select: { userId: true } } },
  })

  let updated = 0
  let skippedNoProfile = 0
  let candidates = 0

  for (const u of users) {
    if (!u.profile) {
      skippedNoProfile++
      continue
    }

    const score = await computeScore90d(u.id)

    const posts90d = await prisma.post.count({
      where: { authorId: u.id, createdAt: { gte: since } },
    })

    const levelWithMinPosts = posts90d >= 3 ? score.contributorLevel : 0
    const autoLevel = Math.min(levelWithMinPosts, 4) // Lv5 자동승급 방지

    await prisma.userProfile.update({
      where: { userId: u.id },
      data: {
        contributorLevel: autoLevel,
        score90dActivity: score.activity,
        score90dImpact: score.impact,
        score90dScholarly: score.scholarly,
        score90dTotal: score.total,
        scoreUpdatedAt: new Date(),
      },
    })

    if (score.coreCandidate) candidates++
    updated++
  }

  return { updated, skippedNoProfile, candidates }
}