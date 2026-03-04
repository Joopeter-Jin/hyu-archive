// app/api/endorsements/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser, hasRole, type Role } from "@/lib/authz"
import { EndorsementType, EndorsementSentiment } from "@prisma/client"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

const ENDORSER_ROLES: Role[] = ["PROFESSOR", "GRAD", "ADMIN"]

function parseType(v: unknown): EndorsementType | null {
  if (v === "PROFESSOR") return EndorsementType.PROFESSOR
  if (v === "GRAD") return EndorsementType.GRAD
  return null
}

function parseSentiment(v: unknown): EndorsementSentiment {
  return v === "NEGATIVE" ? EndorsementSentiment.NEGATIVE : EndorsementSentiment.POSITIVE
}

function canUseType(meRole: Role, type: EndorsementType) {
  if (meRole === "ADMIN") return true
  if (meRole === "PROFESSOR" && type === EndorsementType.PROFESSOR) return true
  if (meRole === "GRAD" && type === EndorsementType.GRAD) return true
  return false
}

// ✅ Create or Update endorsement (toggle 느낌: POST로 upsert)
export async function POST(req: Request) {
  const me = await requireUser()
  if (!me) return json({ error: "Unauthorized" }, 401)
  if (!hasRole(me, ENDORSER_ROLES)) return json({ error: "Forbidden" }, 403)

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "")
  const type = parseType(body.type)
  const sentiment = parseSentiment(body.sentiment)
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (!postId) return json({ error: "postId required" }, 400)
  if (!type) return json({ error: "invalid type (PROFESSOR|GRAD)" }, 400)
  if (!canUseType(me.role, type)) return json({ error: "type not allowed for your role" }, 403)

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
  if (!post) return json({ error: "Not found" }, 404)

  const endorsement = await prisma.endorsement.upsert({
    where: {
      // @@unique([postId, endorserId, type]) 의 자동 이름
      postId_endorserId_type: {
        postId,
        endorserId: me.id,
        type,
      },
    },
    update: {
      sentiment,
      note: note || null,
      endorserRoleSnapshot: me.role,
    },
    create: {
      postId,
      endorserId: me.id,
      type,
      sentiment,
      note: note || null,
      endorserRoleSnapshot: me.role,
    },
    select: {
      id: true,
      postId: true,
      endorserId: true,
      type: true,
      sentiment: true,
      note: true,
      endorserRoleSnapshot: true,
      createdAt: true,
    },
  })

  // (선택) ActivityLog 남기고 싶으면 여기서 tx로 추가하면 됨

  return json({ ok: true, endorsement }, 200)
}

// ✅ Delete endorsement (type까지 포함해서 정확히 1개 지움)
export async function DELETE(req: Request) {
  const me = await requireUser()
  if (!me) return json({ error: "Unauthorized" }, 401)
  if (!hasRole(me, ENDORSER_ROLES)) return json({ error: "Forbidden" }, 403)

  const { searchParams } = new URL(req.url)
  const postId = String(searchParams.get("postId") ?? "")
  const type = parseType(searchParams.get("type"))

  if (!postId) return json({ error: "postId required" }, 400)
  if (!type) return json({ error: "type required (PROFESSOR|GRAD)" }, 400)
  if (!canUseType(me.role, type)) return json({ error: "type not allowed for your role" }, 403)

  await prisma.endorsement
    .delete({
      where: {
        postId_endorserId_type: {
          postId,
          endorserId: me.id,
          type,
        },
      },
    })
    .catch(() => null)

  return json({ ok: true }, 200)
}