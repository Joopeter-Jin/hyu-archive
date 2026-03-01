// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole, canManageCategory } from "@/lib/acl"

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
    select: { category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ✅ 동일 권한 정책: "이 카테고리를 관리할 권한"이 있어야 수정 가능
  if (!canManageCategory(me.role, existing.category)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ✅ (중요) 카테고리 변경도 가능하게 할지?
  // 동일 정책을 유지하려면:
  // - 기존 카테고리 수정 권한 + 변경될 카테고리 작성 권한 둘 다 있어야 안전
  if (category !== existing.category) {
    if (!canManageCategory(me.role, category)) {
      return NextResponse.json({ error: "Forbidden (target category)" }, { status: 403 })
    }
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { title, content, category },
    select: { id: true, category: true },
  })

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ✅ 동일 권한 정책: "이 카테고리를 관리할 권한"이 있어야 삭제 가능
  if (!canManageCategory(me.role, existing.category)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true, category: existing.category }, { status: 200 })
}