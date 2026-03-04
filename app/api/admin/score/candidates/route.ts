//app\api\admin\score\candidates\route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"
import { computeScore90d } from "@/lib/scoring"

export async function GET(req: Request) {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200)

  // profile 있는 유저만(없으면 업데이트/표시 모두 애매)
  const users = await prisma.user.findMany({
    where: { profile: { isNot: null } },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      profile: { select: { displayName: true, role: true, contributorLevel: true, scoreUpdatedAt: true } },
    },
  })

  const candidates: Array<any> = []

  // 후보 판정은 computeScore90d가 이미 함(coreCandidate)
  for (const u of users) {
    const score = await computeScore90d(u.id)
    if (!score.coreCandidate) continue

    candidates.push({
      userId: u.id,
      email: u.email,
      name: u.name,
      displayName: u.profile?.displayName,
      role: u.profile?.role,
      currentLevel: u.profile?.contributorLevel ?? 0,
      scoreUpdatedAt: u.profile?.scoreUpdatedAt,
      score90d: {
        total: score.total,
        scholarly: score.scholarly,
        impact: score.impact,
        activity: score.activity,
      },
      breakdown: score.breakdown,
    })
  }

  // scholarly/total 높은 순으로 정렬(검토 편의)
  candidates.sort((a, b) => (b.score90d.scholarly - a.score90d.scholarly) || (b.score90d.total - a.score90d.total))

  return NextResponse.json(
    { ok: true, count: candidates.length, candidates: candidates.slice(0, limit) },
    { status: 200 }
  )
}