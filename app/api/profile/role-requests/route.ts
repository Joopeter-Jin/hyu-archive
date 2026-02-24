// app/api/profile/role-requests/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function okJson(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return okJson({ error: "Unauthorized" }, 401)

  const list = await prisma.roleRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestedRole: true,
      status: true,
      note: true,
      adminNote: true,
      decidedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewer: {
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return okJson(list, 200)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return okJson({ error: "Unauthorized" }, 401)

  const body = await req.json().catch(() => ({}))
  const requestedRole = String(body.requestedRole ?? "").trim()
  const note = String(body.note ?? "").trim() || null // ✅ reason이 아니라 note

  const allowed = ["PROFESSOR", "GRAD", "CONTRIBUTOR"]
  if (!allowed.includes(requestedRole)) {
    return okJson({ error: "Invalid requestedRole" }, 400)
  }

  const pending = await prisma.roleRequest.findFirst({
    where: { userId, status: "PENDING" },
    select: { id: true },
  })
  if (pending) return okJson({ error: "You already have a pending request." }, 409)

  const created = await prisma.roleRequest.create({
    data: {
      userId,
      requestedRole: requestedRole as any,
      status: "PENDING",
      note, // ✅ 스키마 필드
    },
    select: {
      id: true,
      requestedRole: true,
      status: true,
      note: true,
      adminNote: true,
      decidedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewer: {
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return okJson(created, 201)
}