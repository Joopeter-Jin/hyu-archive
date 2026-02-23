// app/api/admin/role-requests/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, userId: null }

  const prof = await prisma.userProfile.findUnique({
    where: { userId },
    select: { role: true },
  })
  if (prof?.role !== "ADMIN") return { ok: false as const, userId: null }
  return { ok: true as const, userId }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? "").toLowerCase()

  const rr = await prisma.roleRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, requestedRole: true, status: true },
  })
  if (!rr) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rr.status !== "PENDING") return NextResponse.json({ error: "Already reviewed" }, { status: 409 })

  if (action === "approve") {
    await prisma.$transaction([
      prisma.roleRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewerId: auth.userId! },
      }),
      prisma.userProfile.upsert({
        where: { userId: rr.userId },
        create: { userId: rr.userId, displayName: "User", role: rr.requestedRole },
        update: { role: rr.requestedRole },
      }),
    ])
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (action === "reject") {
    await prisma.roleRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: auth.userId! },
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}