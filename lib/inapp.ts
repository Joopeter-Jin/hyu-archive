// lib/inapp.ts
export function isInAppBrowser(userAgent?: string) {
  const ua = (userAgent ?? "").toLowerCase()
  if (!ua) return false

  // 대표 인앱/웹뷰 UA 키워드
  return (
    ua.includes("kakaotalk") ||
    ua.includes("instagram") ||
    ua.includes("fbav") || // Facebook
    ua.includes("fban") || // Facebook
    ua.includes("line") ||
    ua.includes("naver") || // 네이버 앱 내 브라우저도 케이스 있음
    ua.includes("daum") ||
    ua.includes("wv") // Android WebView
  )
}

export function isIOS(userAgent?: string) {
  const ua = (userAgent ?? "").toLowerCase()
  return ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")
}

export function openInChromeIntent(url: string) {
  // Android Chrome으로 강제 열기 (인앱 브라우저에서 가장 효과적)
  // url이 https://example.com/path 형태일 때
  const stripped = url.replace(/^https?:\/\//, "")
  const intentUrl =
    `intent://${stripped}` +
    `#Intent;scheme=https;package=com.android.chrome;end;`

  window.location.href = intentUrl
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}