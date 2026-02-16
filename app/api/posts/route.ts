import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content } = await req.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: user.id,
    },
  })

  return NextResponse.json(post)
}
