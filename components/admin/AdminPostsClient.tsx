"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Row = { id: string; title: string; category: string; createdAt: string; views: number; authorId: string }

export default function AdminPostsClient() {
  const [q, setQ] = useState("")
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/posts?q=${encodeURIComponent(q)}`, { cache: "no-store" })
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
    if (!confirm("Delete this post?")) return
    setErr(null)
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
    if (!res.ok) {
      setErr(await res.text().catch(() => "Failed"))
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Posts</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
          placeholder="Search title/category/authorId"
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
        <div className="text-sm text-neutral-500">No posts.</div>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Link href={`/post/${p.id}`} className="text-sm text-white hover:underline">
                    {p.title}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {p.category} · views {p.views} · {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>

                <button
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => onDelete(p.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}