// components/profile/RoleRequestClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import RoleBadge from "@/components/profile/RoleBadge"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"
type Status = "PENDING" | "APPROVED" | "REJECTED"

type MyReq = {
  id: string
  requestedRole: Role
  status: Status
  note: string | null
  adminNote: string | null
  createdAt: string
  updatedAt: string
  decidedAt: string | null
}

const ROLE_OPTIONS: Role[] = ["PROFESSOR", "GRAD", "CONTRIBUTOR"]

function statusLabel(s: Status) {
  switch (s) {
    case "PENDING":
      return "Pending"
    case "APPROVED":
      return "Approved"
    case "REJECTED":
      return "Rejected"
  }
}

export default function RoleRequestClient() {
  const [list, setList] = useState<MyReq[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [requestedRole, setRequestedRole] = useState<Role>("PROFESSOR")
  const [note, setNote] = useState("")

  const latestPending = useMemo(() => list.find((r) => r.status === "PENDING") ?? null, [list])

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/profile/role-requests", { cache: "no-store" })
      if (res.status === 401) {
        setList([])
        return
      }
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed to load"))
      setList((await res.json()) as MyReq[])
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    setPosting(true)
    setErr(null)
    try {
      const res = await fetch("/api/profile/role-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ schema.prisma의 필드명은 note (reason 아님)
        body: JSON.stringify({ requestedRole, note: note.trim() || null }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Failed to submit request")
      }
      setNote("")
      await load()
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Role Requests</div>
          <div className="text-xs text-neutral-500 mt-1">
            Request a higher role. Admin will review it.
          </div>
        </div>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}

      {/* Create */}
      <div className="rounded-xl border border-neutral-800 bg-black/40 p-4 space-y-3">
        {latestPending ? (
          <div className="text-sm text-neutral-300">
            You already have a pending request:{" "}
            <span className="inline-flex items-center gap-2">
              <RoleBadge role={latestPending.requestedRole} />
              <span className="text-neutral-500">({statusLabel(latestPending.status)})</span>
            </span>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold">New request</div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="rounded-lg bg-black border border-neutral-800 px-3 py-2 text-sm outline-none"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as Role)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
                onClick={submit}
                disabled={posting}
              >
                {posting ? "Submitting..." : "Submit"}
              </button>
            </div>

            <textarea
              className="w-full min-h-[90px] resize-y rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
              placeholder="Optional note (why you need this role)."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="text-xs text-neutral-500">
              Tip: Add evidence (university email, affiliation, etc.).
            </div>
          </>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="text-sm font-semibold">My requests</div>

        {loading ? (
          <div className="text-sm text-neutral-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-neutral-500">No requests yet.</div>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-neutral-200 flex items-center gap-2">
                      <span>Requested</span>
                      <RoleBadge role={r.requestedRole} />
                      <span className="text-xs text-neutral-500">· {statusLabel(r.status)}</span>
                    </div>

                    <div className="text-xs text-neutral-500">
                      {new Date(r.createdAt).toLocaleString()}
                      {r.decidedAt ? ` · decided ${new Date(r.decidedAt).toLocaleString()}` : ""}
                    </div>

                    {r.note && <div className="text-sm text-neutral-200 mt-2 whitespace-pre-wrap">{r.note}</div>}
                    {r.adminNote && (
                      <div className="text-sm text-neutral-400 mt-2 whitespace-pre-wrap">
                        Admin note: {r.adminNote}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}