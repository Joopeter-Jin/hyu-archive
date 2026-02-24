// app/api/admin/role-requests/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const adminId = (session?.user as any)?.id as string | undefined
  if (!adminId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) }

  const prof = await prisma.userProfile.findUnique({
    where: { userId: adminId },
    select: { role: true },
  })
  if (prof?.role !== "ADMIN") return { ok: false as const, res: json({ error: "Forbidden" }, 403) }
  return { ok: true as const, adminId }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? "").toUpperCase()
  const adminNote = String(body.adminNote ?? "").trim() || null

  if (action !== "APPROVE" && action !== "REJECT") {
    return json({ error: "Invalid action" }, 400)
  }

  const rr = await prisma.roleRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      requestedRole: true,
      userId: true,
    },
  })
  if (!rr) return json({ error: "Not found" }, 404)
  if (rr.status !== "PENDING") return json({ error: "Already decided" }, 409)

  const decidedAt = new Date()

  if (action === "REJECT") {
    const updated = await prisma.roleRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNote,
        decidedAt,
        decidedBy: admin.adminId,
      },
      select: { id: true, status: true, adminNote: true, decidedAt: true },
    })
    return json(updated, 200)
  }

  // APPROVE
  const result = await prisma.$transaction(async (tx) => {
    // 1) role request 승인 처리
    const updatedRR = await tx.roleRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminNote,
        decidedAt,
        decidedBy: admin.adminId,
      },
      select: { id: true, status: true, requestedRole: true, userId: true },
    })

    // 2) user profile role 변경(없으면 생성)
    await tx.userProfile.upsert({
      where: { userId: updatedRR.userId },
      create: {
        userId: updatedRR.userId,
        displayName: `user_${updatedRR.userId.slice(0, 6)}`, // 임시 (이미 있으면 update로 감)
        role: updatedRR.requestedRole,
      },
      update: {
        role: updatedRR.requestedRole,
      },
    })

    // 3) 해당 유저의 다른 pending 요청은 자동 reject(선택)
    await tx.roleRequest.updateMany({
      where: {
        userId: updatedRR.userId,
        status: "PENDING",
        NOT: { id: updatedRR.id },
      },
      data: {
        status: "REJECTED",
        adminNote: "Auto-rejected due to another approval.",
        decidedAt,
        decidedBy: admin.adminId,
      },
    })

    return updatedRR
  })

  return json(result, 200)
}