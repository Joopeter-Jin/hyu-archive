// lib/citations.ts
export function extractPostIdsFromHtml(html: string): string[] {
  if (!html) return []

  // - href 안에 있는 /post/<uuid> 만 잡는다 (본문 텍스트에 우연히 등장하는 건 제외)
  // - 상대/절대 URL 모두 허용
  // - 쿼리/해시가 뒤에 붙어도 허용
  // - uuid 36자 형식 엄격
  const uuid =
    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
  const re = new RegExp(`href=["'][^"']*/post/(${uuid})(?:[?#"']|$)`, "g")

  const out = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[1]) out.add(m[1])
  }
  return [...out]
} 