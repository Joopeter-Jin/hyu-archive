import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") ?? undefined

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    select: { id: true, title: true, createdAt: true, category: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content, category } = (await req.json()) as {
    title: string
    content: string
    category: string
  }

  if (!title?.trim() || !content?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      category,
      authorId: session.user.id, // ✅ 강제
    },
    select: { id: true },
  })

  return NextResponse.json(post, { status: 201 })
}
