// app/api/admin/reports/route.ts
// ✅ 신고 목록 조회 (운영진)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(req.url)
  const statusParam = (searchParams.get("status") ?? "OPEN").toUpperCase()
  const status = ["OPEN", "RESOLVED", "DISMISSED", "ALL"].includes(statusParam)
    ? statusParam
    : "OPEN"

  const list = await prisma.report.findMany({
    where: status === "ALL" ? undefined : { status: status as any },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      reason: true,
      detail: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      resolutionNote: true,
      reporter: {
        select: { id: true, name: true, profile: { select: { displayName: true } } },
      },
      resolvedBy: {
        select: { id: true, name: true, profile: { select: { displayName: true } } },
      },
      post: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          authorId: true,
          author: {
            select: { id: true, name: true, profile: { select: { displayName: true } } },
          },
          _count: { select: { reports: true } },
        },
      },
    },
  })

  return NextResponse.json(list, { status: 200 })
}
