// app/api/profile/me/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profile: {
        select: {
          displayName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(me, { status: 200 })
}