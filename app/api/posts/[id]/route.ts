// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole, canManageCategory } from "@/lib/acl"
import { syncCitationsTx } from "@/lib/citationSync"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      createdAt: true,
      authorId: true,
      views: true,
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
      attachments: {
        select: { url: true, fileName: true, mimeType: true, size: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post, { status: 200 })
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? "").trim()
  const content = String(body.content ?? "")
  const category = String(body.category ?? "").trim()

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
  if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 })

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 기존 카테고리 수정 권한
  if (!canManageCategory(me.role, existing.category)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 카테고리 변경 시, 변경될 카테고리 권한도 필요
  if (category !== existing.category) {
    if (!canManageCategory(me.role, category)) {
      return NextResponse.json({ error: "Forbidden (target category)" }, { status: 403 })
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const post = await tx.post.update({
      where: { id },
      data: { title, content, category },
      select: { id: true, category: true, content: true },
    })

    await tx.activityLog.create({
      data: {
        actorId: me.id,
        action: "POST_UPDATE",
        postId: post.id,
        meta: { fromCategory: existing.category, toCategory: post.category },
      },
    })

    // Citation re-sync
    await syncCitationsTx({
      tx,
      actorId: me.id,
      fromPostId: post.id,
      contentHtml: post.content,
    })

    return { id: post.id, category: post.category }
  })

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!canManageCategory(me.role, existing.category)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    // 삭제 로그를 먼저 남김 (post delete 후에는 postId FK 처리에 따라 관계가 끊길 수 있음)
    await tx.activityLog.create({
      data: {
        actorId: me.id,
        action: "POST_DELETE",
        postId: existing.id,
        meta: { category: existing.category },
      },
    })

    await tx.post.delete({ where: { id: existing.id } })
  })

  return NextResponse.json({ ok: true, category: existing.category }, { status: 200 })
}