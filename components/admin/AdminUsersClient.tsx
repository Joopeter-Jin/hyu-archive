"use client"

import { useEffect, useState } from "react"
import RoleBadge from "@/components/profile/RoleBadge"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type UserRow = {
  id: string
  email: string | null
  name: string | null
  profile: { displayName: string; role: Role } | null
  createdAt: string
}

export default function AdminUsersClient() {
  const [q, setQ] = useState("")
  const [list, setList] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      setList((await res.json()) as UserRow[])
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

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Users</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
          placeholder="Search email/name/displayName"
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
        <div className="text-sm text-neutral-500">No users.</div>
      ) : (
        <div className="space-y-2">
          {list.map((u) => (
            <div key={u.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-white">
                    {u.profile?.displayName ?? u.name ?? u.email ?? u.id}
                  </div>
                  <div className="text-xs text-neutral-500">{u.email ?? ""}</div>
                </div>

                <RoleBadge role={(u.profile?.role ?? "USER") as Role} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}