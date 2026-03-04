// app/api/admin/archive-picks/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(req.url)
  const activeOnly = (searchParams.get("active") ?? "1") !== "0"

  const list = await prisma.archivePick.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      postId: true,
      adminId: true,
      active: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      post: { select: { id: true, title: true, category: true, createdAt: true } },
      admin: { select: { id: true, name: true, profile: { select: { displayName: true } } } },
    },
  })

  return json(list, 200)
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => ({} as any))
  const postId = String(body.postId ?? "").trim()
  const active = Boolean(body.active)
  const note = typeof body.note === "string" ? body.note.trim() : undefined

  if (!postId) return json({ error: "postId is required" }, 400)

  const exists = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
  if (!exists) return json({ error: "Post not found" }, 404)

  // postId unique 라는 전제 (너 schema가 @@unique([postId])인 상태)
  const row = await prisma.archivePick.upsert({
    where: { postId },
    update: { active, note, adminId: auth.userId },
    create: { postId, active, note, adminId: auth.userId },
    select: { id: true, postId: true, active: true },
  })

  return json(row, 200)
}