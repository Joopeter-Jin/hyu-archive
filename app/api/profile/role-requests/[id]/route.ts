// app/api/profile/role-requests/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }

function okJson(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return okJson({ error: "Unauthorized" }, 401)

  const rr = await prisma.roleRequest.findUnique({
    where: { id },
    select: { userId: true, status: true },
  })
  if (!rr) return okJson({ error: "Not found" }, 404)
  if (rr.userId !== userId) return okJson({ error: "Forbidden" }, 403)
  if (rr.status !== "PENDING") return okJson({ error: "Only PENDING can be canceled" }, 400)

  await prisma.roleRequest.delete({ where: { id } })
  return okJson({ ok: true }, 200)
}