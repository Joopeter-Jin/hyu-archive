//app\api\admin\score\approve\route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"
import { computeScore90d } from "@/lib/scoring"

export async function POST(req: Request) {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const userId = body?.userId as string | undefined
  const note = (body?.note as string | undefined) ?? null

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  // 존재 + profile 체크
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profile: { select: { userId: true, contributorLevel: true } } },
  })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!target.profile) return NextResponse.json({ error: "UserProfile not found" }, { status: 409 })

  // 안전장치: 후보가 아니면 승인 불가(원하면 이 검사를 제거해도 됨)
  const score = await computeScore90d(userId)
  if (!score.coreCandidate) {
    return NextResponse.json(
      { error: "Not eligible", message: "coreCandidate=false", score: { total: score.total, scholarly: score.scholarly } },
      { status: 400 }
    )
  }

  // 승인: role은 그대로, contributorLevel만 5로
  await prisma.userProfile.update({
    where: { userId },
    data: {
      contributorLevel: 5,
      // 점수/업데이트 타임스탬프도 같이 갱신해두면 UI 일관성 좋아짐
      score90dActivity: score.activity,
      score90dImpact: score.impact,
      score90dScholarly: score.scholarly,
      score90dTotal: score.total,
      scoreUpdatedAt: new Date(),
    },
  })

  // 감사 로그(선택이지만 강추)
  await prisma.activityLog.create({
    data: {
      actorId: me.id,
      action: "ROLE_REQUEST_DECIDE",
      targetUserId: userId,
      meta: {
        kind: "CONTRIBUTOR_LV5_APPROVE",
        note,
        score90d: { total: score.total, scholarly: score.scholarly, impact: score.impact, activity: score.activity },
      },
    },
  })

  return NextResponse.json({ ok: true, userId, contributorLevel: 5 }, { status: 200 })
}