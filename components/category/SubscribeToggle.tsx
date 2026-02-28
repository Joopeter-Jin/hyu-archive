"use client"

import { useEffect, useState, useTransition } from "react"

type Props = { category: string }

export default function SubscribeToggle({ category }: Props) {
  const [active, setActive] = useState<boolean | null>(null)
  const [busy, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setErr(null)
    try {
      const res = await fetch("/api/subscribe", { cache: "no-store" })
      if (!res.ok) {
        setActive(null) // 로그인 안된 상태일 수 있음
        return
      }
      const list = (await res.json()) as Array<{ category: string; active: boolean }>
      const found = list.find((s) => s.category === category)
      setActive(found ? !!found.active : false)
    } catch {
      setActive(null)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const toggle = () => {
    setErr(null)
    startTransition(async () => {
      try {
        const next = !(active ?? false)
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, active: next }),
        })

        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          setErr(txt || "Login required")
          return
        }

        const json = (await res.json()) as { active: boolean }
        setActive(json.active)
      } catch (e: any) {
        setErr(e?.message ?? "Failed")
      }
    })
  }

  // active === null : 로그인 안되었거나 조회 실패한 상태 (버튼은 노출하되 안내)
  const label =
    active === null ? "Subscribe (login)" : active ? "Subscribed" : "Subscribe"

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`px-3 py-2 text-sm rounded-lg border transition disabled:opacity-50 ${
          active ? "border-green-700/50 bg-green-950/30 text-green-200" : "border-neutral-800 hover:bg-neutral-900"
        }`}
        title="Email notification for new posts in this category"
      >
        {label}
      </button>

      <a
        className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
        href={`/rss.xml?category=${encodeURIComponent(category)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        RSS
      </a>

      {err && <div className="text-xs text-red-400">{err}</div>}
    </div>
  )
}