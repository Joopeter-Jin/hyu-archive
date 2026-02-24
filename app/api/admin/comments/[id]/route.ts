// app/api/admin/comments/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const { id } = await ctx.params

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ✅ hard delete 금지: soft delete
  await prisma.comment.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      content: "(Deleted comment)",
    },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}