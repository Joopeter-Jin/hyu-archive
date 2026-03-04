//app/api/archive-picks/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser, type Role } from "@/lib/authz"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: Request) {
  const me = await requireUser()
  if (!me?.id) return json({ error: "Unauthorized" }, 401)

  const meRole = (me.profile?.role ?? "USER") as Role
  if (meRole !== "ADMIN") return json({ error: "Forbidden" }, 403)

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "")
  const active = Boolean(body.active)
  const note = body.note ? String(body.note) : null

  if (!postId) return json({ error: "postId required" }, 400)

  await prisma.$transaction(async (tx) => {
    if (active) {
      await tx.archivePick.upsert({
        where: { postId },
        update: { active: true, note: note ?? undefined, adminId: me.id },
        create: { postId, adminId: me.id, active: true, note: note ?? undefined },
      })
      await tx.activityLog.create({
        data: { actorId: me.id, action: "ARCHIVE_PICK_ON", postId, meta: { note } },
      })
    } else {
      await tx.archivePick.updateMany({
        where: { postId },
        data: { active: false },
      })
      await tx.activityLog.create({
        data: { actorId: me.id, action: "ARCHIVE_PICK_OFF", postId },
      })
    }
  })

  return json({ ok: true })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get("postId") ?? ""
  if (!postId) return json({ error: "postId required" }, 400)

  const pick = await prisma.archivePick.findUnique({
    where: { postId },
    select: {
      postId: true,
      active: true,
      note: true,
      updatedAt: true,
      admin: { select: { id: true, name: true, profile: { select: { displayName: true } } } },
    },
  })

  if (!pick) return json({ active: false })
  return json({
    ...pick,
    updatedAt: pick.updatedAt.toISOString(),
  })
}