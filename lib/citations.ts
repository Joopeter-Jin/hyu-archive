// lib/citations.ts
export function extractPostIdsFromHtml(html: string): string[] {
  if (!html) return []

  const uuid =
    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

  // 1) 새 방식: data-citation="true" 가 달린 링크 우선
  const citationAnchorRe = new RegExp(
    `<a\\b[^>]*data-citation=["']true["'][^>]*href=["'][^"']*/post/(${uuid})(?:[?#][^"']*)?["'][^>]*>`,
    "gi"
  )

  // 2) 하위 호환: 기존의 /post/<uuid> 링크도 계속 인식
  const hrefRe = new RegExp(
    `href=["'][^"']*/post/(${uuid})(?:[?#][^"']*)?["']`,
    "gi"
  )

  const out = new Set<string>()

  let m: RegExpExecArray | null
  while ((m = citationAnchorRe.exec(html)) !== null) {
    if (m[1]) out.add(m[1])
  }

  while ((m = hrefRe.exec(html)) !== null) {
    if (m[1]) out.add(m[1])
  }

  return [...out]
}