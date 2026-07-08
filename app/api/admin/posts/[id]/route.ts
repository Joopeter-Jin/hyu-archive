// app/api/admin/posts/[id]/route.ts
import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const { id } = await ctx.params

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}
// ✅ 모더레이션: 게시물 상태 변경 (운영 원칙 4절 — 비공개/복구/삭제 처리)
export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({} as any))
  const status = String(body.status ?? "")

  if (!["PUBLISHED", "UNLISTED", "REMOVED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, category: true, status: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (existing.status === status) {
    return NextResponse.json({ ok: true, id, status }, { status: 200 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.update({ where: { id }, data: { status: status as any } })
    await tx.activityLog.create({
      data: {
        actorId: auth.me.id,
        action: "POST_STATUS_CHANGE",
        postId: id,
        meta: { from: existing.status, to: status },
      },
    })
  })

  // ✅ 목록/홈 캐시 즉시 무효화
  revalidateTag(`posts:${existing.category}`, "max")
  revalidatePath("/")

  return NextResponse.json({ ok: true, id, status }, { status: 200 })
}
