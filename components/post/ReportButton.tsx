// components/post/ReportButton.tsx
"use client"

import { useState } from "react"

const REASONS = [
  { value: "INVESTMENT_CONTENT", label: "투자 권유·시세 예측 (운영 원칙 위반)" },
  { value: "SPAM", label: "스팸·홍보성 게시물" },
  { value: "ABUSE", label: "비방·모욕" },
  { value: "COPYRIGHT", label: "저작권 침해" },
  { value: "OTHER", label: "기타" },
] as const

export default function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>("INVESTMENT_CONTENT")
  const [detail, setDetail] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason, detail: detail.trim() || undefined }),
      })
      if (res.status === 401) throw new Error("로그인이 필요합니다.")
      if (res.status === 409) throw new Error("이미 신고한 글입니다.")
      if (res.status === 429) throw new Error("신고가 너무 잦습니다. 잠시 후 다시 시도해주세요.")
      if (!res.ok) throw new Error("신고 접수에 실패했습니다.")
      setDone(true)
      setOpen(false)
    } catch (e: any) {
      setErr(e?.message ?? "Failed")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return <div className="text-xs text-neutral-500">신고가 접수되었습니다. 운영진이 검토합니다.</div>
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-neutral-600 hover:text-neutral-300 transition"
      >
        신고
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 shadow-xl">
          <div className="text-sm font-medium text-neutral-200">게시물 신고</div>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg bg-black border border-neutral-800 px-2 py-2 text-sm outline-none"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="추가 설명 (선택)"
            rows={3}
            className="w-full rounded-lg bg-black border border-neutral-800 px-2 py-2 text-sm outline-none resize-none"
          />

          {err && <div className="text-xs text-red-400">{err}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-900"
            >
              취소
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-900/50 text-red-300 hover:bg-red-950/30 disabled:opacity-50"
            >
              {busy ? "접수 중..." : "신고 접수"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
