// components/category/RefreshOnFocus.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RefreshOnFocus() {
  const router = useRouter()

  useEffect(() => {
    let timer: number | null = null

    const refresh = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        router.refresh()
      }, 50)
    }

    const onFocus = () => refresh()

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh()
    }

    const onPageShow = () => {
      // bfcache 복원 포함
      refresh()
    }

    const onPopState = () => {
      // ✅ SPA 뒤로/앞으로 (Back/Forward)에서 가장 잘 먹는 훅
      refresh()
    }

    // ✅ "목록 페이지로 돌아온 직후"에도 한번 강제 갱신
    refresh()

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("popstate", onPopState)

    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("popstate", onPopState)
      if (timer) window.clearTimeout(timer)
    }
  }, [router])

  return null
}