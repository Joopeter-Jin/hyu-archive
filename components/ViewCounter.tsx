"use client"

import { useEffect, useRef } from "react"

export default function ViewCounter({ postId }: { postId: string }) {
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    doneRef.current = true

    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {})
  }, [postId])

  return null
}
