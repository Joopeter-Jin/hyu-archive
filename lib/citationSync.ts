// lib/citationSync.ts
import type { Prisma } from "@prisma/client"
import { extractPostIdsFromHtml } from "@/lib/citations"

export async function syncCitationsTx({
  tx,
  actorId,
  fromPostId,
  contentHtml,
}: {
  tx: Prisma.TransactionClient
  actorId: string
  fromPostId: string
  contentHtml: string
}) {
  // 1) parse (dedupe + self 제거)
  const rawToIds = extractPostIdsFromHtml(contentHtml).filter((id) => id !== fromPostId)
  const toIds = [...new Set(rawToIds)]

  // 2) 존재하는 post만 남겨서 FK 에러 방지
  const existingPosts = await tx.post.findMany({
    where: { id: { in: toIds } },
    select: { id: true },
  })
  const validSet = new Set(existingPosts.map((p) => p.id))
  const validToIds = toIds.filter((id) => validSet.has(id))

  // 3) 기존 citations
  const existing = await tx.citation.findMany({
    where: { fromPostId },
    select: { toPostId: true },
  })
  const existingSet = new Set(existing.map((x) => x.toPostId))
  const newSet = new Set(validToIds)

  const toCreate = validToIds.filter((id) => !existingSet.has(id))
  const toDelete = [...existingSet].filter((id) => !newSet.has(id))

  // 4) apply
  if (toDelete.length) {
    await tx.citation.deleteMany({
      where: { fromPostId, toPostId: { in: toDelete } },
    })

    await tx.activityLog.create({
      data: {
        actorId,
        action: "CITATION_DELETE",
        postId: fromPostId,
        meta: { removed: toDelete },
      },
    })
  }

  if (toCreate.length) {
    await tx.citation.createMany({
      data: toCreate.map((toPostId) => ({ fromPostId, toPostId })),
      skipDuplicates: true,
    })

    await tx.activityLog.create({
      data: {
        actorId,
        action: "CITATION_CREATE",
        postId: fromPostId,
        meta: { added: toCreate },
      },
    })
  }

  return {
    ok: true as const,
    count: validToIds.length,
    created: toCreate.length,
    deleted: toDelete.length,
    invalidIgnored: toIds.length - validToIds.length, // 존재하지 않는 post link
  }
}