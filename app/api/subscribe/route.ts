// app/api/subscribe/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function getAuthUserId() {
  const session = await getServerSession(authOptions)
  return (session?.user as any)?.id as string | undefined
}

function asCategory(raw: any) {
  const v = String(raw ?? "").trim()
  return v.length ? v : null
}

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subs = await prisma.subscription.findMany({
    where: { userId, active: true },
    select: { id: true, category: true, channel: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(subs, { status: 200 })
}

export async function POST(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const category = asCategory(body.category)
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 })

  const sub = await prisma.subscription.upsert({
    where: { userId_category_channel: { userId, category, channel: "EMAIL" } },
    create: { userId, category, channel: "EMAIL", active: true },
    update: { active: true },
    select: { id: true, category: true, channel: true, active: true },
  })

  return NextResponse.json({ ok: true, subscription: sub }, { status: 200 })
}

export async function DELETE(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const category = asCategory(body.category)
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 })

  await prisma.subscription.updateMany({
    where: { userId, category, channel: "EMAIL" },
    data: { active: false },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}