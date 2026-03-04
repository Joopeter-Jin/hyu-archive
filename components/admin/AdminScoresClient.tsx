// components/admin/AdminScoresClient.tsx
"use client"

import { useState } from "react"

export default function AdminScoresClient() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const run = async () => {
    if (!confirm("Recompute 90d scores for all users and auto-promote up to Lv4?")) return
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch("/api/admin/scores", { method: "POST" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      const json = await res.json()
      setMsg(`Done. Updated: ${json.updated}`)
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold">Scores</div>
        <div className="text-xs text-neutral-500">Recompute Impact/Scholarly totals and auto-level up to Lv4.</div>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {msg && <div className="text-sm text-green-300">{msg}</div>}

      <button
        className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
        onClick={run}
        disabled={busy}
        type="button"
      >
        {busy ? "Running..." : "Recompute all users"}
      </button>
    </div>
  )
}