// app/api/votes/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type VoteType = "POST" | "COMMENT"
type VoteValue = "UP" | "DOWN"

async function getAuthUserId() {
  const session = await getServerSession(authOptions)
  return (session?.user as any)?.id as string | undefined
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

function parseType(raw: string | null): VoteType | null {
  if (raw === "POST" || raw === "COMMENT") return raw
  return null
}
function parseValue(raw: any): VoteValue | null {
  if (raw === "UP" || raw === "DOWN") return raw
  return null
}

/**
 * GET /api/votes?type=POST&targetId=uuid
 * GET /api/votes?type=COMMENT&targetId=uuid
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = parseType(searchParams.get("type"))
  const targetId = searchParams.get("targetId")

  if (!type) return badRequest("Invalid type (POST|COMMENT)")
  if (!targetId) return badRequest("targetId is required")

  const userId = await getAuthUserId()

  const where =
    type === "POST" ? { postId: targetId } : { commentId: targetId }

  const [up, down, my] = await Promise.all([
    prisma.vote.count({ where: { ...where, value: "UP" } }),
    prisma.vote.count({ where: { ...where, value: "DOWN" } }),
    userId
      ? prisma.vote.findFirst({
          where: { ...where, userId },
          select: { value: true },
        })
      : Promise.resolve(null),
  ])

  return NextResponse.json(
    {
      up,
      down,
      score: up - down,
      myVote: my?.value ?? null, // "UP" | "DOWN" | null
    },
    { status: 200 }
  )
}

/**
 * POST /api/votes
 * body: { type: "POST"|"COMMENT", targetId: string, value: "UP"|"DOWN" }
 * => 같은 대상에 대해 내 투표를 UP/DOWN으로 "설정"(upsert)
 */
export async function POST(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const type = parseType(body.type ?? null)
  const targetId = String(body.targetId ?? "")
  const value = parseValue(body.value)

  if (!type) return badRequest("Invalid type (POST|COMMENT)")
  if (!targetId) return badRequest("targetId is required")
  if (!value) return badRequest("Invalid value (UP|DOWN)")

  // ✅ Prisma의 composite unique 이름:
  // @@unique([userId, postId])     -> userId_postId
  // @@unique([userId, commentId])  -> userId_commentId
  const vote =
    type === "POST"
      ? await prisma.vote.upsert({
          where: { userId_postId: { userId, postId: targetId } },
          create: { userId, postId: targetId, value },
          update: { value },
          select: { id: true, value: true, postId: true, commentId: true, userId: true },
        })
      : await prisma.vote.upsert({
          where: { userId_commentId: { userId, commentId: targetId } },
          create: { userId, commentId: targetId, value },
          update: { value },
          select: { id: true, value: true, postId: true, commentId: true, userId: true },
        })

  // 최신 집계 반환(UX 좋아짐)
  const where =
    type === "POST" ? { postId: targetId } : { commentId: targetId }

  const [up, down] = await Promise.all([
    prisma.vote.count({ where: { ...where, value: "UP" } }),
    prisma.vote.count({ where: { ...where, value: "DOWN" } }),
  ])

  return NextResponse.json(
    { ok: true, vote, up, down, score: up - down, myVote: vote.value },
    { status: 200 }
  )
}

/**
 * DELETE /api/votes
 * body: { type: "POST"|"COMMENT", targetId: string }
 * => 내 투표 "취소"
 */
export async function DELETE(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const type = parseType(body.type ?? null)
  const targetId = String(body.targetId ?? "")

  if (!type) return badRequest("Invalid type (POST|COMMENT)")
  if (!targetId) return badRequest("targetId is required")

  const where =
    type === "POST"
      ? { userId, postId: targetId }
      : { userId, commentId: targetId }

  await prisma.vote.deleteMany({ where })

  const aggWhere =
    type === "POST" ? { postId: targetId } : { commentId: targetId }

  const [up, down] = await Promise.all([
    prisma.vote.count({ where: { ...aggWhere, value: "UP" } }),
    prisma.vote.count({ where: { ...aggWhere, value: "DOWN" } }),
  ])

  return NextResponse.json(
    { ok: true, up, down, score: up - down, myVote: null },
    { status: 200 }
  )
}