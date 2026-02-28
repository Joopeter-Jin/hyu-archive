// components/views/ViewIncrement.tsx
"use client"

import { useEffect } from "react"

const COOLDOWN_MS = 10 * 60 * 1000 // 10분

function keyFor(postId: string) {
  return `viewed:${postId}`
}

export default function ViewIncrement({ postId }: { postId: string }) {
  useEffect(() => {
    // SSR/프리렌더 보호
    if (typeof window === "undefined") return

    const k = keyFor(postId)
    const now = Date.now()

    try {
      const last = Number(window.localStorage.getItem(k) || "0")

      // ✅ 10분 이내면 증가 안 함
      if (Number.isFinite(last) && last > 0 && now - last < COOLDOWN_MS) {
        return
      }

      // ✅ 먼저 찍어둬서(optimistic) 연타/중복 호출 방지
      window.localStorage.setItem(k, String(now))
    } catch {
      // localStorage 접근 불가(사파리 프라이빗 등)면 그냥 증가 시도
    }

    // ✅ 조회수 증가 호출
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("views increment failed")
      })
      .catch(() => {
        // 실패하면 로컬 기록을 되돌려 다음에 다시 시도 가능하게
        try {
          window.localStorage.removeItem(k)
        } catch {}
      })
  }, [postId])

  return null
}