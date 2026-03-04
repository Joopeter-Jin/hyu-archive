// lib/citationSync.ts
import type { Prisma, PrismaClient } from "@prisma/client"
import { extractPostIdsFromHtml } from "@/lib/citations"

type Tx = Prisma.TransactionClient

export async function syncCitationsTx({
  tx,
  actorId,
  fromPostId,
  contentHtml,
}: {
  tx: Tx
  actorId: string
  fromPostId: string
  contentHtml: string
}) {
  // 1) HTML에서 추출
  const rawToIds = extractPostIdsFromHtml(contentHtml)
  const toIds = rawToIds.filter((x) => x && x !== fromPostId)

  // 2) 실제 존재하는 post만 유지 (삭제된 글/오타 링크 제거)
  const existingTargets =
    toIds.length === 0
      ? []
      : await tx.post.findMany({
          where: { id: { in: toIds } },
          select: { id: true },
        })
  const validSet = new Set(existingTargets.map((p) => p.id))
  const validToIds = toIds.filter((id) => validSet.has(id))

  // 3) 현재 DB에 저장된 citations
  const existing = await tx.citation.findMany({
    where: { fromPostId },
    select: { toPostId: true },
  })
  const existingSet = new Set(existing.map((x) => x.toPostId))
  const newSet = new Set(validToIds)

  const toCreate = validToIds.filter((id) => !existingSet.has(id))
  const toDelete = [...existingSet].filter((id) => !newSet.has(id))

  // 4) Delete → Log
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

  // 5) Create → Log
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
    total: validToIds.length,
    created: toCreate.length,
    deleted: toDelete.length,
    toPostIds: validToIds,
  }
}