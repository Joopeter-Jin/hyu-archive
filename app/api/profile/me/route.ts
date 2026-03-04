// app/api/profile/me/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/authz"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET() {
  const me = await requireUser()
  if (!me) return json({ error: "Unauthorized" }, 401)

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profile: {
        select: {
          displayName: true,
          role: true,
          contributorLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!user) return json({ error: "Not found" }, 404)
  return json(user, 200)
}