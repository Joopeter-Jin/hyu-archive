// app/api/pins/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: Request) {
  const me = await getMeWithRole()
  if (!me) return json({ error: "Unauthorized" }, 401)
  if (me.role !== "ADMIN") return json({ error: "Forbidden" }, 403)

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "").trim()
  const category = String(body.category ?? "").trim()
  const active = Boolean(body.active ?? true)
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0

  if (!postId) return json({ error: "postId is required" }, 400)
  if (!category) return json({ error: "category is required" }, 400)

  const result = await prisma.$transaction(async (tx) => {
    if (active) {
      // 같은 category에서 기존 active 핀을 먼저 끈다 (DB가 강제 못 하므로 서버에서 보장)
      await tx.postPin.updateMany({
        where: { category, active: true },
        data: { active: false, unpinnedAt: new Date() },
      })
    }

    // (category, postId) 복합 유니크로 upsert
    const pin = await tx.postPin.upsert({
      where: { category_postId: { category, postId } },
      create: {
        postId,
        category,
        pinnedById: me.id,
        active,
        order,
        pinnedAt: new Date(),
        unpinnedAt: active ? null : new Date(),
      },
      update: {
        active,
        order,
        pinnedById: me.id,
        pinnedAt: active ? new Date() : undefined,
        unpinnedAt: active ? null : new Date(),
      },
      select: { id: true, postId: true, category: true, active: true, order: true },
    })

    await tx.activityLog.create({
      data: {
        actorId: me.id,
        action: active ? "POST_PIN_ON" : "POST_PIN_OFF",
        postId,
        meta: { category, order },
      },
    })

    return pin
  })

  return json(result, 200)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = (searchParams.get("category") ?? "").trim()

  const list = await prisma.postPin.findMany({
    where: category ? { category, active: true } : { active: true },
    orderBy: [{ order: "asc" }, { pinnedAt: "desc" }],
    select: {
      id: true,
      postId: true,
      category: true,
      order: true,
      pinnedAt: true,
      post: { select: { id: true, title: true, category: true } },
    },
  })

  return json(list, 200)
}