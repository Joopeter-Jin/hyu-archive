"use client"

import { useEffect, useMemo, useState } from "react"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type CommentNode = {
  id: string
  postId: string
  parentId: string | null
  content: string
  createdAt: string
  authorId: string
  author: {
    id: string
    name: string | null
    image: string | null
    profile: { displayName: string; role: Role } | null
  }
  replies: CommentNode[]
}

export default function CommentsSection({ postId }: { postId: string }) {
  const [items, setItems] = useState<CommentNode[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" })
    const data = await res.json()
    setItems(data.comments ?? [])
  }

  useEffect(() => {
    load().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const submit = async (parentId: string | null) => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(t || "Failed to post comment")
      }
      setContent("")
      await load()
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setLoading(false)
    }
  }

  const renderNode = (c: CommentNode, depth = 0) => {
    const display =
      c.author.profile?.displayName ?? c.author.name ?? "Anonymous"
    const role = c.author.profile?.role ?? "USER"

    return (
      <div key={c.id} className="space-y-2" style={{ marginLeft: depth ? 18 : 0 }}>
        <div className="rounded-lg border border-neutral-800 p-3 bg-neutral-950">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="text-neutral-200">{display}</span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              {role}
            </span>
            <span>· {new Date(c.createdAt).toLocaleString()}</span>
          </div>

          <div
            className="prose prose-invert max-w-none mt-2"
            dangerouslySetInnerHTML={{ __html: c.content }}
          />
        </div>

        {c.replies?.length ? (
          <div className="space-y-3">{c.replies.map((r) => renderNode(r, depth + 1))}</div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold">Comments</h2>

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-2">
        <textarea
          className="w-full min-h-[90px] bg-transparent outline-none text-sm text-neutral-100"
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-white text-black disabled:opacity-50"
            disabled={loading || !content.trim()}
            onClick={() => submit(null)}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      <div className="space-y-4">{items.map((c) => renderNode(c))}</div>
    </div>
  )
}