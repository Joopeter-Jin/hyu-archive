// app/api/admin/votes/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { role: true } } },
  })

  if (me?.profile?.role !== "ADMIN") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const, userId }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.res

  const { id } = await params

  await prisma.vote.delete({ where: { id } }).catch(() => null)

  return NextResponse.json({ ok: true }, { status: 200 })
}