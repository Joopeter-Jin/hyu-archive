//components/post/PostMetaActions.tsx
"use client"

import { useState } from "react"

export default function PostMetaActions({
  postId,
  isAdmin,
  isProfessor,
  isGrad,
}: {
  postId: string
  isAdmin: boolean
  isProfessor: boolean
  isGrad: boolean
}) {
  const [loading, setLoading] = useState(false)

  const toggleReaction = async (type: "LIKE" | "BOOKMARK") => {
    setLoading(true)
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, type }),
    })
    setLoading(false)
  }

  const endorse = async (sentiment: "POSITIVE" | "NEGATIVE") => {
    await fetch("/api/endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, sentiment }),
    })
  }

  const toggleArchive = async () => {
    await fetch("/api/archive-pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, active: true }),
    })
  }

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button onClick={() => toggleReaction("LIKE")} className="px-3 py-2 border rounded-lg">
        👍 Like
      </button>

      <button onClick={() => toggleReaction("BOOKMARK")} className="px-3 py-2 border rounded-lg">
        🔖 Bookmark
      </button>

      {(isProfessor || isGrad) && (
        <>
          <button onClick={() => endorse("POSITIVE")} className="px-3 py-2 border rounded-lg">
            🏛 Recommend
          </button>
          <button onClick={() => endorse("NEGATIVE")} className="px-3 py-2 border rounded-lg">
            ⚖ Critical
          </button>
        </>
      )}

      {isAdmin && (
        <button onClick={toggleArchive} className="px-3 py-2 border border-yellow-600 rounded-lg">
          ⭐ Archive Pick
        </button>
      )}
    </div>
  )
}