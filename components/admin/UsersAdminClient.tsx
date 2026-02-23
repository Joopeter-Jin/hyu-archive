// components/admin/UsersAdminClient.tsx
"use client"

import { useEffect, useState } from "react"
import RoleBadge from "@/components/profile/RoleBadge"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"
type Row = {
  id: string
  email: string | null
  name: string | null
  profile: { displayName: string; role: Role } | null
}

export default function UsersAdminClient() {
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(q)}`, { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      setRows((await res.json()) as Row[])
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // initial

  const setRole = async (userId: string, role: Role) => {
    setErr(null)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      setErr(await res.text().catch(() => "Failed"))
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Users (Admin)</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
          placeholder="Search by email/name/displayName..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-4 py-2 rounded-lg bg-white text-black text-sm" onClick={load}>
          Search
        </button>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-neutral-400">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-neutral-500">No users.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((u) => {
            const role = (u.profile?.role ?? "USER") as Role
            const display = u.profile?.displayName ?? u.name ?? u.email ?? u.id
            return (
              <div key={u.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-white break-words">{display}</div>
                  <div className="text-xs text-neutral-500">{u.email ?? ""}</div>
                </div>

                <div className="flex items-center gap-2">
                  <RoleBadge role={role} />
                  <select
                    className="text-sm bg-black border border-neutral-800 rounded-lg px-2 py-1"
                    value={role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                  >
                    {(["ADMIN","PROFESSOR","GRAD","CONTRIBUTOR","USER"] as const).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}