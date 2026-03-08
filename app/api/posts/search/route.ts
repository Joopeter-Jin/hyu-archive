// app/api/posts/search/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function asInt(v: string | null, def: number) {
  const n = parseInt(v || "", 10)
  return Number.isFinite(n) && n > 0 ? n : def
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const limit = Math.min(asInt(searchParams.get("limit"), 8), 20)

  const posts = await prisma.post.findMany({
    where: q
      ? {
          title: { contains: q, mode: "insensitive" },
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  })

  return NextResponse.json(posts, { status: 200 })
}