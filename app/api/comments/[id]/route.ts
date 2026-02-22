// app/api/comments/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

async function getAuth() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  return { session, userId }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      deletedAt: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(comment, { status: 200 })
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const { userId } = await getAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, isDeleted: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (existing.isDeleted) return NextResponse.json({ error: "Already deleted" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const content = String(body.content ?? "")
  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 })
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    select: {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      deletedAt: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const { userId } = await getAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, isDeleted: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.isDeleted) return NextResponse.json({ ok: true }, { status: 200 })

  // 작성자 or ADMIN만 삭제
  if (existing.authorId !== userId) {
    const prof = await prisma.userProfile.findUnique({
      where: { userId },
      select: { role: true },
    })
    if (prof?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // ✅ 하드 삭제 대신 소프트 삭제
  await prisma.comment.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      content: "", // 원문 제거 (원하면 유지해도 됨)
    },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}