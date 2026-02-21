// app/api/posts/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || undefined

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      authorId: true,
      views: true,
    },
  })

  return NextResponse.json(posts, { status: 200 })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const title = String(body.title ?? "").trim()
  const content = String(body.content ?? "")
  const category = String(body.category ?? "").trim()

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
  if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 })

  const created = await prisma.post.create({
    data: {
      title,
      content,
      category,
      authorId: userId,
    },
    select: { id: true, category: true },
  })

  return NextResponse.json(created, { status: 201 })
}