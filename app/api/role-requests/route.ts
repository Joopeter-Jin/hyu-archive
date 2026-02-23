// app/api/role-requests/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function isEduEmail(email: string | null | undefined) {
  if (!email) return false
  const e = email.toLowerCase()
  return e.endsWith("@hanyang.ac.kr") || e.endsWith("@gmail.com") === false && e.includes(".ac.")
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const list = await prisma.roleRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestedRole: true,
      reason: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
    },
  })

  return NextResponse.json(list, { status: 200 })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const email = session?.user?.email ?? null
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const requestedRole = String(body.requestedRole ?? "").toUpperCase()
  const reason = String(body.reason ?? "").trim() || null

  const allowed = ["PROFESSOR", "GRAD", "CONTRIBUTOR"] as const
  if (!allowed.includes(requestedRole as any)) {
    return NextResponse.json({ error: "Invalid requestedRole" }, { status: 400 })
  }

  // PENDING 1개만
  const pending = await prisma.roleRequest.findFirst({
    where: { userId, status: "PENDING" },
    select: { id: true },
  })
  if (pending) return NextResponse.json({ error: "You already have a pending request." }, { status: 409 })

  // 이메일 도메인 기반 "자동 승인 후보" (원하면 정책 바꿔도 됨)
  const autoApprove =
    isEduEmail(email) && (requestedRole === "PROFESSOR" || requestedRole === "GRAD")

  const created = await prisma.roleRequest.create({
    data: {
      userId,
      requestedRole: requestedRole as any,
      reason,
      status: autoApprove ? "APPROVED" : "PENDING",
      reviewedAt: autoApprove ? new Date() : null,
      reviewerId: autoApprove ? userId : null, // 자동처리 표시(본인)
    },
    select: { id: true, status: true },
  })

  // 자동 승인일 때: 즉시 profile.role 업데이트
  if (autoApprove) {
    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, displayName: (session?.user?.name ?? "User") as string, role: requestedRole as any },
      update: { role: requestedRole as any },
      select: { userId: true },
    })
  }

  return NextResponse.json(created, { status: 201 })
}