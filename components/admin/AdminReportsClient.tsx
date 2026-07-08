// components/admin/AdminReportsClient.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Filter = "OPEN" | "RESOLVED" | "DISMISSED" | "ALL"

type Row = {
  id: string
  reason: string
  detail: string | null
  status: "OPEN" | "RESOLVED" | "DISMISSED"
  createdAt: string
  resolvedAt: string | null
  resolutionNote: string | null
  reporter: { id: string; name: string | null; profile: { displayName: string } | null }
  resolvedBy: { id: string; name: string | null; profile: { displayName: string } | null } | null
  post: {
    id: string
    title: string
    category: string
    status: "PUBLISHED" | "UNLISTED" | "REMOVED"
    authorId: string
    author: { id: string; name: string | null; profile: { displayName: string } | null }
    _count: { reports: number }
  }
}

const REASON_LABEL: Record<string, string> = {
  INVESTMENT_CONTENT: "투자성 콘텐츠",
  SPAM: "스팸·홍보",
  ABUSE: "비방·모욕",
  COPYRIGHT: "저작권",
  OTHER: "기타",
}

export default function AdminReportsClient() {
  const [filter, setFilter] = useState<Filter>("OPEN")
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async (f: Filter = filter) => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/reports?status=${f}`, { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      setList((await res.json()) as Row[])
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const decide = async (id: string, action: "RESOLVE" | "DISMISS", unpublishPost = false) => {
    setBusyId(id)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, unpublishPost }),
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
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Reports</div>
        <div className="flex gap-1">
          {(["OPEN", "RESOLVED", "DISMISSED", "ALL"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "px-3 py-1.5 text-xs rounded-lg border transition " +
                (filter === f
                  ? "border-neutral-500 text-white"
                  : "border-neutral-800 text-neutral-500 hover:bg-neutral-900")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}

      {loading ? (
        <div className="text-sm text-neutral-400">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-neutral-500">No reports.</div>
      ) : (
        <div className="space-y-2">
          {list.map((r) => {
            const reporterName = r.reporter.profile?.displayName ?? r.reporter.name ?? r.reporter.id
            const authorName = r.post.author.profile?.displayName ?? r.post.author.name ?? r.post.authorId
            return (
              <div key={r.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-red-900/50 text-red-300">
                        {REASON_LABEL[r.reason] ?? r.reason}
                      </span>
                      <span
                        className={
                          "text-[11px] px-2 py-0.5 rounded-full border " +
                          (r.status === "OPEN"
                            ? "border-amber-700/50 text-amber-200"
                            : "border-neutral-700 text-neutral-400")
                        }
                      >
                        {r.status}
                      </span>
                      {r.post._count.reports > 1 && (
                        <span className="text-[11px] text-neutral-500">
                          이 글의 누적 신고 {r.post._count.reports}건
                        </span>
                      )}
                    </div>

                    <Link href={`/post/${r.post.id}`} className="block text-sm text-white hover:underline truncate">
                      {r.post.title}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {r.post.category} · post status: {r.post.status} · by {authorName}
                    </div>
                    {r.detail && <div className="text-xs text-neutral-400">“{r.detail}”</div>}
                    <div className="text-[11px] text-neutral-600">
                      신고자 {reporterName} · {new Date(r.createdAt).toLocaleString()}
                      {r.resolvedBy && ` · 처리 ${r.resolvedBy.profile?.displayName ?? r.resolvedBy.name}`}
                    </div>
                  </div>

                  {r.status === "OPEN" && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, "RESOLVE", true)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-900/50 text-red-300 hover:bg-red-950/30 disabled:opacity-50"
                      >
                        인용 + 글 비공개
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, "RESOLVE", false)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-neutral-800 text-neutral-200 hover:bg-neutral-900 disabled:opacity-50"
                      >
                        인용 (조치 없음)
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, "DISMISS")}
                        className="px-3 py-1.5 text-xs rounded-lg border border-neutral-800 text-neutral-500 hover:bg-neutral-900 disabled:opacity-50"
                      >
                        기각
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
