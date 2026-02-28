// app/api/subscribe/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function asString(v: unknown) {
  return typeof v === "string" ? v : ""
}

async function getAuthedUserId() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  if (!email) return null

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function GET() {
  const userId = await getAuthedUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subs = await prisma.subscription.findMany({
    where: { userId, channel: "EMAIL" },
    select: { id: true, category: true, active: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(subs, { status: 200 })
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const category = asString(body.category).trim()
  const active = typeof body.active === "boolean" ? body.active : true

  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 })

  const sub = await prisma.subscription.upsert({
    where: { userId_category_channel: { userId, category, channel: "EMAIL" } },
    create: { userId, category, channel: "EMAIL", active },
    update: { active },
    select: { id: true, category: true, active: true },
  })

  return NextResponse.json(sub, { status: 200 })
}

export async function DELETE(req: Request) {
  const userId = await getAuthedUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = (searchParams.get("category") ?? "").trim()
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 })

  // “삭제” 대신 비활성화(히스토리 유지)
  await prisma.subscription.update({
    where: { userId_category_channel: { userId, category, channel: "EMAIL" } },
    data: { active: false },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}