// components/PostActions.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function PostActions({
  postId,
  category,
}: {
  postId: string
  category: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const show = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const onDelete = async () => {
    if (!confirm("Delete this post?")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (!res.ok) {
        const text = await res.text()
        show(`Delete failed (${res.status})`)
        console.error(text)
        return
      }
      show("Deleted")
      router.push(`/${category}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2 relative">
      <Link
        className="px-3 py-2 text-sm border border-neutral-800 rounded-lg hover:bg-neutral-900"
        href={`/${category}/write?edit=${postId}`}
      >
        Edit
      </Link>

      <button
        disabled={busy}
        onClick={onDelete}
        className="px-3 py-2 text-sm border border-red-900/40 text-red-300 rounded-lg hover:bg-red-950/30 disabled:opacity-50"
      >
        {busy ? "Deleting..." : "Delete"}
      </button>

      {toast && (
        <div className="absolute right-0 top-12 text-xs px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 shadow">
          {toast}
        </div>
      )}
    </div>
  )
}