// components/admin/RoleRequestsClient.tsx
"use client"

import { useEffect, useState } from "react"
import RoleBadge from "@/components/profile/RoleBadge"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"
type Req = {
  id: string
  requestedRole: Role
  reason: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  user: {
    id: string
    email: string | null
    name: string | null
    profile: { displayName: string; role: Role } | null
  }
}

export default function RoleRequestsClient() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING")
  const [list, setList] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/role-requests?status=${status}`, { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      setList((await res.json()) as Req[])
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const act = async (id: string, action: "approve" | "reject") => {
    setErr(null)
    const res = await fetch(`/api/admin/role-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) {
      setErr(await res.text().catch(() => "Failed"))
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Role Requests</div>

      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            className={
              "px-3 py-1.5 rounded-lg text-sm border " +
              (status === s ? "bg-white text-black border-white" : "border-neutral-800 text-neutral-300 hover:bg-neutral-900")
            }
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-neutral-400">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-neutral-500">No requests.</div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-white">
                    {r.user.profile?.displayName ?? r.user.name ?? r.user.email ?? r.user.id}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {r.user.email ?? ""} · current{" "}
                    <RoleBadge role={(r.user.profile?.role ?? "USER") as Role} />
                  </div>
                  <div className="text-xs text-neutral-400">
                    requested <RoleBadge role={r.requestedRole} /> · {new Date(r.createdAt).toLocaleString()}
                  </div>
                  {r.reason && <div className="text-sm text-neutral-200 mt-2 whitespace-pre-wrap">{r.reason}</div>}
                </div>

                {r.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
                      onClick={() => act(r.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg border border-neutral-800 text-sm text-neutral-200 hover:bg-neutral-900"
                      onClick={() => act(r.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">{r.status}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}