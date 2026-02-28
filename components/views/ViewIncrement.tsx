// components/views/ViewIncrement.tsx
"use client"

import { useEffect } from "react"

export default function ViewIncrement({ postId }: { postId: string }) {
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      cache: "no-store",
    }).catch(() => {})
  }, [postId])

  return null
}