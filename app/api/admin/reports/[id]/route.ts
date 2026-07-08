// app/api/admin/reports/[id]/route.ts
// ✅ 신고 처리 (운영진): RESOLVE / DISMISS (+선택: 게시물 비공개 처리)
import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({} as any))
  const action = String(body.action ?? "").toUpperCase()
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : null
  const unpublishPost = body.unpublishPost === true

  if (!["RESOLVE", "DISMISS"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      postId: true,
      post: { select: { id: true, category: true, status: true } },
    },
  })
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (report.status !== "OPEN") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 })
  }

  const nextStatus = action === "RESOLVE" ? "RESOLVED" : "DISMISSED"

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id },
      data: {
        status: nextStatus as any,
        resolvedAt: new Date(),
        resolvedById: auth.me.id,
        resolutionNote: note,
      },
    })

    // ✅ 조치와 함께 게시물 비공개 처리 (RESOLVE + unpublishPost)
    if (action === "RESOLVE" && unpublishPost && report.post.status === "PUBLISHED") {
      await tx.post.update({
        where: { id: report.postId },
        data: { status: "UNLISTED" as any },
      })
      await tx.activityLog.create({
        data: {
          actorId: auth.me.id,
          action: "POST_STATUS_CHANGE",
          postId: report.postId,
          meta: { from: "PUBLISHED", to: "UNLISTED", viaReport: id },
        },
      })
    }

    await tx.activityLog.create({
      data: {
        actorId: auth.me.id,
        action: "REPORT_RESOLVE",
        postId: report.postId,
        meta: { reportId: id, decision: nextStatus, unpublishPost },
      },
    })
  })

  if (action === "RESOLVE" && unpublishPost) {
    revalidateTag(`posts:${report.post.category}`, "max")
    revalidatePath("/")
  }

  return NextResponse.json({ ok: true, id, status: nextStatus }, { status: 200 })
}
