// app/api/admin/posts/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()

  const where =
    q.length > 0
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { authorId: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined

  const list = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      views: true,
      authorId: true,
      author: {
        select: { id: true, name: true, profile: { select: { displayName: true, role: true } } },
      },

      // ✅ relation name: archivePick (단수)
      archivePick: {
        select: { id: true, active: true, createdAt: true, adminId: true, note: true },
      },
    },
  })

  return NextResponse.json(list, { status: 200 })
}