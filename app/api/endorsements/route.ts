//app/api/endorsements/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser, hasRole, type Role } from "@/lib/authz"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: Request) {
  const me = await requireUser()
  if (!me?.id) return json({ error: "Unauthorized" }, 401)

  const meRole = (me.profile?.role ?? "USER") as Role

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "")
  const type = String(body.type ?? "") as "PROFESSOR" | "GRAD"
  const sentiment = (String(body.sentiment ?? "POSITIVE") as "POSITIVE" | "NEGATIVE")

  if (!postId) return json({ error: "postId required" }, 400)
  if (type !== "PROFESSOR" && type !== "GRAD") return json({ error: "invalid type" }, 400)
  if (sentiment !== "POSITIVE" && sentiment !== "NEGATIVE") return json({ error: "invalid sentiment" }, 400)

  // 권한: PROFESSOR endorsement는 교수만, GRAD endorsement는 교수/학생(또는 학생만) — 여기선 학생도 가능
  if (type === "PROFESSOR" && meRole !== "PROFESSOR" && meRole !== "ADMIN") {
    return json({ error: "Forbidden" }, 403)
  }
  if (type === "GRAD" && !hasRole(meRole, ["GRAD", "PROFESSOR", "ADMIN"])) {
    return json({ error: "Forbidden" }, 403)
  }

  await prisma.$transaction(async (tx) => {
    await tx.endorsement.upsert({
      where: { postId_endorserId_type: { postId, endorserId: me.id, type } },
      update: { sentiment, endorserRoleSnapshot: meRole },
      create: {
        postId,
        endorserId: me.id,
        type,
        sentiment,
        endorserRoleSnapshot: meRole,
      },
    })

    await tx.activityLog.create({
      data: {
        actorId: me.id,
        action: "ENDORSEMENT_CREATE",
        postId,
        meta: { type, sentiment },
      },
    })
  })

  return json({ ok: true })
}

export async function DELETE(req: Request) {
  const me = await requireUser()
  if (!me?.id) return json({ error: "Unauthorized" }, 401)

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get("postId") ?? ""
  const type = (searchParams.get("type") ?? "") as "PROFESSOR" | "GRAD"

  if (!postId) return json({ error: "postId required" }, 400)
  if (type !== "PROFESSOR" && type !== "GRAD") return json({ error: "invalid type" }, 400)

  await prisma.$transaction(async (tx) => {
    await tx.endorsement.deleteMany({
      where: { postId, endorserId: me.id, type },
    })
    await tx.activityLog.create({
      data: {
        actorId: me.id,
        action: "ENDORSEMENT_DELETE",
        postId,
        meta: { type },
      },
    })
  })

  return json({ ok: true })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get("postId") ?? ""
  if (!postId) return json({ error: "postId required" }, 400)

  const list = await prisma.endorsement.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      sentiment: true,
      createdAt: true,
      endorser: {
        select: { id: true, name: true, profile: { select: { displayName: true, role: true } } },
      },
    },
  })

  return json(
    list.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }))
  )
}