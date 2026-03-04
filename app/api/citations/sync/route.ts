// app/api/citations/sync/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/authz"
import { extractPostIdsFromHtml } from "@/lib/citations"

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: Request) {
  const auth = await requireUser()

  // ✅ requireUser()의 union 타입을 여기서 확실히 처리
  if (!auth.ok) return auth.res
  const userId = auth.userId

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "")
  if (!postId) return json({ error: "postId required" }, 400)

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, content: true },
  })
  if (!post) return json({ error: "Not found" }, 404)
  if (post.authorId !== userId) return json({ error: "Forbidden" }, 403)

  // ✅ 본문에서 링크 추출 → 자기 자신은 제외
  const toIds = extractPostIdsFromHtml(post.content).filter((x) => x !== postId)

  await prisma.$transaction(async (tx) => {
    const existing = await tx.citation.findMany({
      where: { fromPostId: postId },
      select: { toPostId: true },
    })

    const existingSet = new Set(existing.map((x) => x.toPostId))
    const newSet = new Set(toIds)

    const toCreate = toIds.filter((id) => !existingSet.has(id))
    const toDelete = [...existingSet].filter((id) => !newSet.has(id))

    if (toDelete.length) {
      await tx.citation.deleteMany({
        where: { fromPostId: postId, toPostId: { in: toDelete } },
      })

      await tx.activityLog.create({
        data: {
          actorId: userId,
          action: "CITATION_DELETE",
          postId,
          meta: { removed: toDelete },
        },
      })
    }

    if (toCreate.length) {
      await tx.citation.createMany({
        data: toCreate.map((toPostId) => ({ fromPostId: postId, toPostId })),
        skipDuplicates: true,
      })

      await tx.activityLog.create({
        data: {
          actorId: userId,
          action: "CITATION_CREATE",
          postId,
          meta: { added: toCreate },
        },
      })
    }
  })

  return json({ ok: true, count: toIds.length })
}