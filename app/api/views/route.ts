// app/api/views/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { postId } = await req.json().catch(() => ({}))
  if (!postId) return NextResponse.json({ ok: false }, { status: 400 })

  await prisma.post.update({
    where: { id: postId },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json({ ok: true })
}