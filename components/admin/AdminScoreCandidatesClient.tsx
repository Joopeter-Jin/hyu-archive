//components\admin\AdminScoreCandidatesClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"

type Candidate = {
  userId: string
  email: string | null
  name: string | null
  displayName: string | null
  role: string | null
  currentLevel: number
  scoreUpdatedAt: string | null
  score90d: {
    total: number
    scholarly: number
    impact: number
    activity: number
  }
  breakdown: {
    posts90d: number
    comments90d: number
    reactions90d: { like: number; bookmark: number }
    citationsReceived90d: number
    endorsements90d: { professor: number; grad: number; negative: number }
    archivePicks90d: number
    diversityCategoriesCount: number
  }
}

type CandidatesResponse = {
  ok: boolean
  count: number
  candidates: Candidate[]
}

async function fetchCandidates(limit = 50): Promise<CandidatesResponse> {
  const res = await fetch(`/api/admin/score/candidates?limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error(msg?.error ?? `Failed: ${res.status}`)
  }
  return res.json()
}

async function approveLv5(userId: string, note?: string) {
  const res = await fetch(`/api/admin/score/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, note: note ?? null }),
  })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error(msg?.message ?? msg?.error ?? `Failed: ${res.status}`)
  }
  return res.json()
}

export default function AdminScoreCandidatesClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Candidate[]>([])
  const [limit, setLimit] = useState(50)

  const [approvingId, setApprovingId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) => (b.score90d.scholarly - a.score90d.scholarly) || (b.score90d.total - a.score90d.total)
    )
  }, [items])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCandidates(limit)
      setItems(data.candidates ?? [])
    } catch (e: any) {
      setError(e?.message ?? "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  async function onApprove(c: Candidate) {
    const note = window.prompt(
      `Approve Lv5 for ${c.displayName ?? c.email ?? c.userId}\n\nOptional note (for ActivityLog meta):`,
      ""
    )
    if (note === null) return // cancel

    try {
      setApprovingId(c.userId)
      await approveLv5(c.userId, note || undefined)
      await load()
    } catch (e: any) {
      window.alert(e?.message ?? "Approve failed")
    } finally {
      setApprovingId(null)
    }
  }

  async function onRebuildScores() {
    const ok = window.confirm("Rebuild scores for all users now?")
    if (!ok) return

    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/score", { method: "POST" })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.error ?? `Failed: ${res.status}`)
      }
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Rebuild failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={load}
          className="px-3 py-2 rounded-md border border-neutral-300 hover:bg-neutral-50 text-sm"
          disabled={loading}
        >
          Refresh
        </button>

        <button
          onClick={onRebuildScores}
          className="px-3 py-2 rounded-md border border-neutral-300 hover:bg-neutral-50 text-sm"
          disabled={loading}
        >
          Rebuild Scores (All Users)
        </button>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>Limit</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-neutral-300 rounded-md px-2 py-1 bg-white"
            disabled={loading}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-neutral-500">
          {loading ? "Loading…" : `${sorted.length} candidates`}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role / Level</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3">Scholarly</th>
              <th className="text-right p-3">Impact</th>
              <th className="text-right p-3">Activity</th>
              <th className="text-left p-3">Breakdown</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((c) => {
              const nameLine = c.displayName ?? c.name ?? "(no name)"
              const subLine = c.email ?? c.userId

              return (
                <tr key={c.userId} className="border-t border-neutral-200">
                  <td className="p-3">
                    <div className="font-medium">{nameLine}</div>
                    <div className="text-xs text-neutral-500">{subLine}</div>
                  </td>

                  <td className="p-3">
                    <div className="text-sm">{c.role ?? "-"}</div>
                    <div className="text-xs text-neutral-500">current Lv{c.currentLevel}</div>
                  </td>

                  <td className="p-3 text-right font-semibold">{c.score90d.total}</td>
                  <td className="p-3 text-right">{c.score90d.scholarly}</td>
                  <td className="p-3 text-right">{c.score90d.impact}</td>
                  <td className="p-3 text-right">{c.score90d.activity}</td>

                  <td className="p-3 text-xs text-neutral-600 leading-5">
                    <div>posts: {c.breakdown.posts90d}, comments: {c.breakdown.comments90d}</div>
                    <div>
                      reactions: ❤️ {c.breakdown.reactions90d.like} / 🔖 {c.breakdown.reactions90d.bookmark}
                    </div>
                    <div>
                      citations: {c.breakdown.citationsReceived90d}, picks: {c.breakdown.archivePicks90d}
                    </div>
                    <div>
                      endorse P/G/N: {c.breakdown.endorsements90d.professor}/{c.breakdown.endorsements90d.grad}/
                      {c.breakdown.endorsements90d.negative}
                    </div>
                    <div>diversity: {c.breakdown.diversityCategoriesCount}</div>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => onApprove(c)}
                      className="px-3 py-2 rounded-md bg-black text-white hover:opacity-90 disabled:opacity-50"
                      disabled={approvingId === c.userId || loading}
                      title="Approve contributorLevel=5 (role unchanged)"
                    >
                      {approvingId === c.userId ? "Approving…" : "Approve Lv5"}
                    </button>
                  </td>
                </tr>
              )
            })}

            {!loading && sorted.length === 0 && (
              <tr>
                <td className="p-6 text-center text-neutral-500" colSpan={8}>
                  No candidates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-neutral-500">
        Tip: 후보 판단은 <code>computeScore90d().coreCandidate</code> 기준입니다. 승인 후에는 contributorLevel=5로 확정됩니다.
      </div>
    </div>
  )
}