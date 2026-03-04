// app/api/citations/sync/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/authz"
import { syncCitationsTx } from "@/lib/citationSync"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: Request) {
  const me = await requireUser()
  if (!me) return json({ error: "Unauthorized" }, 401)

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "").trim()
  if (!postId) return json({ error: "postId required" }, 400)

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, content: true },
  })
  if (!post) return json({ error: "Not found" }, 404)
  if (post.authorId !== me.id) return json({ error: "Forbidden" }, 403)

  const result = await prisma.$transaction(async (tx) => {
    return syncCitationsTx({
      tx,
      actorId: me.id,
      fromPostId: post.id,
      contentHtml: post.content,
    })
  })

  return json(result, 200)
}