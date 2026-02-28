//components\admin\AdminVotesClient.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Row = {
  id: string
  value: "UP" | "DOWN"
  createdAt: string
  userId: string
  postId: string | null
  commentId: string | null
  post: { id: string; title: string; category: string } | null
  comment: { id: string; postId: string; content: string } | null
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim()
}

export default function AdminVotesClient() {
  const [q, setQ] = useState("")
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/votes?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      setList((await res.json()) as Row[])
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDelete = async (id: string) => {
    if (!confirm("Delete this vote?")) return
    setErr(null)
    const res = await fetch(`/api/admin/votes/${id}`, { method: "DELETE" })
    if (!res.ok) {
      setErr(await res.text().catch(() => "Failed"))
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Votes</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
          placeholder="Search userId/postId/commentId"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-lg border border-neutral-800 text-sm text-neutral-200 hover:bg-neutral-900"
          onClick={load}
          type="button"
        >
          Search
        </button>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-neutral-400">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-neutral-500">No votes.</div>
      ) : (
        <div className="space-y-2">
          {list.map((v) => {
            const isPost = !!v.postId
            const href = isPost ? `/post/${v.postId}` : `/post/${v.comment?.postId ?? ""}`
            const title = isPost ? v.post?.title ?? "(Post)" : stripHtml(v.comment?.content ?? "").slice(0, 120) || "(Comment)"

            return (
              <div key={v.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Link href={href} className="text-sm text-white hover:underline">
                      {title}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {isPost ? "Post" : "Comment"} · {v.value} · {new Date(v.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-600">userId: {v.userId}</div>
                  </div>

                  <button
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => onDelete(v.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}