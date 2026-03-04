// app/api/profile/badges/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole } from "@/lib/acl"

export async function GET() {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const list = await prisma.userMeritBadge.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      note: true,
      badge: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          iconKey: true,
          active: true,
        },
      },
      grantedBy: true,
    },
  })

  return NextResponse.json(list, { status: 200 })
}