// app/api/votes/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const type = body?.type as "POST" | "COMMENT" | undefined
  const targetId = body?.targetId as string | undefined
  const value = body?.value as "UP" | "DOWN" | undefined
  const enabled = body?.enabled as boolean | undefined // ✅ 추가

  if (!type || !targetId || !value) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  const isPost = type === "POST"
  const whereUnique = isPost
    ? { userId_postId: { userId, postId: targetId } }
    : { userId_commentId: { userId, commentId: targetId } }

  const existing = await prisma.vote.findUnique({
    where: whereUnique as any,
    select: { id: true, value: true, postId: true, commentId: true },
  })

  // ✅ enabled가 있으면 상태 기반(idempotent)
  // - enabled=true: 해당 value로 보장(upsert/update)
  // - enabled=false: 삭제 보장(delete)
  if (typeof enabled === "boolean") {
    if (!enabled) {
      if (existing) {
        await prisma.vote.delete({ where: { id: existing.id } })
      }
    } else {
      if (!existing) {
        await prisma.vote.create({
          data: {
            userId,
            value,
            ...(isPost ? { postId: targetId } : { commentId: targetId }),
          } as any,
        })
      } else if (existing.value !== value) {
        await prisma.vote.update({ where: { id: existing.id }, data: { value } })
      }
    }
  } else {
    // ✅ 기존 토글 방식(하위호환)
    if (!existing) {
      await prisma.vote.create({
        data: {
          userId,
          value,
          ...(isPost ? { postId: targetId } : { commentId: targetId }),
        } as any,
      })
    } else if (existing.value === value) {
      await prisma.vote.delete({ where: { id: existing.id } })
    } else {
      await prisma.vote.update({ where: { id: existing.id }, data: { value } })
    }
  }

  // ✅ 응답: (POST만) engagement bar가 바로 확정할 수 있게 counts/mine 반환
  if (isPost) {
    const [up, down, mine] = await Promise.all([
      prisma.vote.count({ where: { postId: targetId, value: "UP" } }),
      prisma.vote.count({ where: { postId: targetId, value: "DOWN" } }),
      prisma.vote.findUnique({
        where: { userId_postId: { userId, postId: targetId } },
        select: { value: true },
      }),
    ])

    return NextResponse.json(
      { ok: true, postId: targetId, votes: { up, down }, mine: { vote: mine?.value ?? null } },
      { status: 200 }
    )
  }

  // COMMENT는 기존 UI(VoteButtons)가 있다면 그쪽 규격 유지
  return NextResponse.json({ ok: true }, { status: 200 })
}