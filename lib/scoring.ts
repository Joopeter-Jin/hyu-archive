// lib/scoring.ts
import { prisma } from "@/lib/prisma"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"
type ReactionType = "LIKE" | "BOOKMARK"
type EndorsementType = "PROFESSOR" | "GRAD"
type EndorsementSentiment = "POSITIVE" | "NEGATIVE"

const DAY_90_MS = 90 * 24 * 60 * 60 * 1000

function since90d() {
  return new Date(Date.now() - DAY_90_MS)
}

function roleLikeWeight(role: Role): number {
  // ADMIN은 권위 시그널이므로 교수급으로 취급
  if (role === "ADMIN") return 3.0
  if (role === "PROFESSOR") return 3.0
  if (role === "GRAD") return 2.0
  if (role === "CONTRIBUTOR") return 1.2
  return 1.0
}

function endorsementBase(type: EndorsementType): number {
  if (type === "PROFESSOR") return 40
  return 20 // GRAD
}

function sentimentWeight(sent: EndorsementSentiment): number {
  return sent === "NEGATIVE" ? 0.8 : 1.0
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export type Score90d = {
  activity: number
  impact: number
  scholarly: number
  total: number
  contributorLevel: number // suggested (0~5)
  coreCandidate: boolean // Lv5 candidate (auto not applied)
  breakdown: {
    posts90d: number
    comments90d: number
    reactions90d: { like: number; bookmark: number }
    citationsReceived90d: number
    endorsements90d: { professor: number; grad: number; negative: number }
    archivePicks90d: number
    diversityCategoriesCount: number
  }
}

export async function computeScore90d(userId: string): Promise<Score90d> {
  const since = since90d()

  const [posts90d, comments90d] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { id: true, category: true },
    }),
    prisma.comment.count({
      where: { authorId: userId, createdAt: { gte: since }, isDeleted: false },
    }),
  ])

  const postIds = posts90d.map((p) => p.id)

  // Activity (간단 버전: 글/댓글)
  // (일일 상한/감쇠는 나중에 "일자별 스냅샷" 만들 때 적용하는 게 정확함)
  const activity = posts90d.length * 10 + comments90d * 2

  if (postIds.length === 0) {
    return {
      activity,
      impact: 0,
      scholarly: 0,
      total: Math.round(0.35 * activity),
      contributorLevel: 0,
      coreCandidate: false,
      breakdown: {
        posts90d: posts90d.length,
        comments90d,
        reactions90d: { like: 0, bookmark: 0 },
        citationsReceived90d: 0,
        endorsements90d: { professor: 0, grad: 0, negative: 0 },
        archivePicks90d: 0,
        diversityCategoriesCount: 0,
      },
    }
  }

  // Reactions received on my posts (last 90d by reaction time)
  const reactions = await prisma.reaction.findMany({
    where: {
      postId: { in: postIds },
      createdAt: { gte: since },
    },
    select: {
      postId: true,
      type: true,
      user: { select: { profile: { select: { role: true } } } },
    },
  })

  // per-post impact with cap
  const impactByPost = new Map<string, number>()
  let likeCnt = 0
  let bookmarkCnt = 0

  for (const r of reactions) {
    const role = (r.user.profile?.role ?? "USER") as Role
    const base = roleLikeWeight(role)

    const add =
      (r.type as ReactionType) === "BOOKMARK"
        ? base * 2
        : base

    if ((r.type as ReactionType) === "BOOKMARK") bookmarkCnt++
    else likeCnt++

    impactByPost.set(r.postId, (impactByPost.get(r.postId) ?? 0) + add)
  }

  // cap 120 per post
  let impact = 0
  const postImpact = new Map<string, number>()
  for (const pid of postIds) {
    const raw = impactByPost.get(pid) ?? 0
    const capped = Math.min(raw, 120)
    postImpact.set(pid, capped)
    impact += capped
  }

  // diversity bonus: categories with postImpact>=30, up to 3
  const postIdToCategory = new Map(posts90d.map((p) => [p.id, p.category]))
  const strongCats = new Set<string>()
  for (const [pid, val] of postImpact.entries()) {
    if (val >= 30) {
      const cat = postIdToCategory.get(pid)
      if (cat) strongCats.add(cat)
    }
  }
  const diversityCount = strongCats.size
  const diversityBonus = 10 * Math.min(diversityCount, 3)
  impact += diversityBonus

  // Scholarly: endorsements + citations received + archive picks
  const [citationsReceived90d, endorsements, archivePickCount] = await Promise.all([
    prisma.citation.count({
      where: {
        createdAt: { gte: since },
        toPostId: { in: postIds },
      },
    }),
    prisma.endorsement.findMany({
      where: { createdAt: { gte: since }, postId: { in: postIds } },
      select: { type: true, sentiment: true },
    }),
    prisma.archivePick.count({
      where: { createdAt: { gte: since }, postId: { in: postIds }, active: true },
    }),
  ])

  let profEndorse = 0
  let gradEndorse = 0
  let negativeEndorse = 0

  let scholarlyRaw = 0
  for (const e of endorsements) {
    const type = e.type as EndorsementType
    const sent = e.sentiment as EndorsementSentiment
    if (type === "PROFESSOR") profEndorse++
    if (type === "GRAD") gradEndorse++
    if (sent === "NEGATIVE") negativeEndorse++

    scholarlyRaw += endorsementBase(type) * sentimentWeight(sent)
  }

  scholarlyRaw += citationsReceived90d * 8
  scholarlyRaw += archivePickCount * 50

  // cap scholarly for 90d (월 cap 120을 90d로 확장: 360)
  const scholarly = Math.round(Math.min(scholarlyRaw, 360))

  // Total score
  const total = Math.round(0.35 * activity + 0.4 * impact + 0.25 * scholarly)

  // Level rules
  // Lv2: posts>=3 and total>=60
  // Lv3: impact>=120 and diversity>=2
  // Lv4: (profEndorse>=1 OR scholarly>=60) and posts>=10
  // Lv5: scholarly>=120 (candidate only)
  let level = 0
  let coreCandidate = false

  if (posts90d.length >= 3 && total >= 60) level = 2
  if (impact >= 120 && diversityCount >= 2) level = Math.max(level, 3)
  if ((profEndorse >= 1 || scholarly >= 60) && posts90d.length >= 10) level = Math.max(level, 4)
  if (scholarly >= 120) {
    level = Math.max(level, 5)
    coreCandidate = true
  }

  level = clamp(level, 0, 5)

  return {
    activity: Math.round(activity),
    impact: Math.round(impact),
    scholarly,
    total,
    contributorLevel: level,
    coreCandidate,
    breakdown: {
      posts90d: posts90d.length,
      comments90d,
      reactions90d: { like: likeCnt, bookmark: bookmarkCnt },
      citationsReceived90d,
      endorsements90d: { professor: profEndorse, grad: gradEndorse, negative: negativeEndorse },
      archivePicks90d: archivePickCount,
      diversityCategoriesCount: diversityCount,
    },
  }
}