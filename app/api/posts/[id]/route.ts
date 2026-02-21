// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    },
  })

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post, { status: 200 })
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const title = String(body.title ?? "").trim()
  const content = String(body.content ?? "")

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const updated = await prisma.post.update({
    where: { id },
    data: { title, content },
    select: { id: true, category: true },
  })

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, category: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true, category: existing.category }, { status: 200 })
}