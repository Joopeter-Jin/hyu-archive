// components/admin/AdminPostsClient.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type Pick = { id: string; active: boolean; createdAt: string; adminId: string; note: string | null } | null

type Row = {
  id: string
  title: string
  category: string
  createdAt: string
  updatedAt: string
  views: number
  authorId: string
  author: { id: string; name: string | null; profile: { displayName: string; role: Role } | null }
  archivePick: Pick
}

export default function AdminPostsClient() {
  const [q, setQ] = useState("")
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

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

  const togglePick = async (postId: string, nextActive: boolean) => {
    setBusyId(postId)
    setErr(null)
    try {
      const res = await fetch("/api/admin/archive-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, active: nextActive }),
      })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      await load()
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Posts</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
          placeholder="Search id/title/category/authorId"
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
          {list.map((p) => {
            const picked = !!p.archivePick?.active
            const authorName = p.author.profile?.displayName ?? p.author.name ?? p.authorId

            return (
              <div key={p.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/post/${p.id}`} className="text-sm text-white hover:underline">
                        {p.title}
                      </Link>
                      {picked && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-yellow-700/50 text-yellow-200">
                          Picked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {p.category} · {new Date(p.createdAt).toLocaleString()} · views {p.views} · by {authorName}
                    </div>
                    <div className="text-[11px] text-neutral-600">id: {p.id}</div>
                  </div>

                  <button
                    disabled={busyId === p.id}
                    onClick={() => togglePick(p.id, !picked)}
                    className={
                      "px-3 py-2 text-sm rounded-lg border transition disabled:opacity-50 " +
                      (picked
                        ? "border-red-900/40 text-red-300 hover:bg-red-950/30"
                        : "border-neutral-800 text-neutral-200 hover:bg-neutral-900")
                    }
                    type="button"
                  >
                    {busyId === p.id ? "Saving..." : picked ? "Unpick" : "Pick"}
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