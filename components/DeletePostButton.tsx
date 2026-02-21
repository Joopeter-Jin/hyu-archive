// components/DeletePostButton.tsx
"use client"

import { useRouter } from "next/navigation"

export default function DeletePostButton({
  postId,
  category,
}: {
  postId: string
  category: string
}) {
  const router = useRouter()

  const onDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return

    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
    if (!res.ok) {
      const text = await res.text()
      alert(`Failed to delete (${res.status})\n${text}`)
      return
    }

    router.push(`/${category}`)
    router.refresh()
  }

  return (
    <button
      onClick={onDelete}
      className="px-3 py-2 text-sm border border-red-900/40 text-red-300 rounded-lg hover:bg-red-950/30"
    >
      Delete
    </button>
  )
}