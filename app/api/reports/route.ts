// app/api/reports/route.ts
// ✅ 게시물 신고 (운영 원칙 4절 — 회원이 원칙 위반 글을 운영진에게 알리는 통로)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"

const REASONS = ["INVESTMENT_CONTENT", "SPAM", "ABUSE", "COPYRIGHT", "OTHER"] as const
type Reason = (typeof REASONS)[number]

export async function POST(req: Request) {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const postId = String(body.postId ?? "").trim()
  const reason = String(body.reason ?? "") as Reason
  const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 1000) : null

  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, status: true },
  })
  if (!post || post.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (post.authorId === me.id) {
    return NextResponse.json({ error: "Cannot report your own post" }, { status: 400 })
  }

  // 과도한 신고 방지: 24시간 내 10건 제한
  const recent = await prisma.report.count({
    where: {
      reporterId: me.id,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  if (recent >= 10) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 })
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: { postId, reporterId: me.id, reason, detail },
        select: { id: true },
      })
      await tx.activityLog.create({
        data: {
          actorId: me.id,
          action: "REPORT_CREATE",
          postId,
          meta: { reason },
        },
      })
      return report
    })
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  } catch (e: any) {
    // unique(postId, reporterId) 위반 = 이미 신고함
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Already reported" }, { status: 409 })
    }
    console.error("[POST /api/reports] error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
