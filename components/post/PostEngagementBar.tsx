// components/post/PostEngagementBar.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession, signIn } from "next-auth/react"

type EngagementDTO = {
  postId: string
  counts: {
    comments: number
    citations: number
    votes: { up: number; down: number }
    reactions: { like: number; bookmark: number }
  }
  mine: {
    vote: "UP" | "DOWN" | null
    like: boolean
    bookmark: boolean
  }
}

export default function PostEngagementBar({ postId }: { postId: string }) {
  const { status } = useSession()

  const [data, setData] = useState<EngagementDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/engagement`, { cache: "no-store" })
      if (!res.ok) return
      const json = (await res.json()) as EngagementDTO
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const pct = useMemo(() => {
    const up = data?.counts.votes.up ?? 0
    const down = data?.counts.votes.down ?? 0
    const total = up + down
    const upPct = total === 0 ? 0 : Math.round((up / total) * 100)
    const downPct = total === 0 ? 0 : 100 - upPct
    return { upPct, downPct, total }
  }, [data])

  const ensureAuth = () => {
    if (status !== "authenticated") {
      signIn("google")
      return false
    }
    return true
  }

  const setVote = async (value: "UP" | "DOWN") => {
    if (!ensureAuth()) return
    if (busy) return
    setBusy(true)
    try {
      const cur = data?.mine.vote ?? null
      const nextVote = cur === value ? null : value
      const enabled = nextVote === value

      setData((prev) => {
        if (!prev) return prev
        let up = prev.counts.votes.up
        let down = prev.counts.votes.down

        if (cur === "UP") up = Math.max(0, up - 1)
        if (cur === "DOWN") down = Math.max(0, down - 1)

        if (nextVote === "UP") up += 1
        if (nextVote === "DOWN") down += 1

        return {
          ...prev,
          counts: {
            ...prev.counts,
            votes: { up, down },
          },
          mine: {
            ...prev.mine,
            vote: nextVote,
          },
        }
      })

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "POST", targetId: postId, value, enabled }),
      })
      const out = await res.json().catch(() => null)
      if (!res.ok) {
        await load()
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          counts: {
            ...prev.counts,
            votes: out?.votes ?? prev.counts.votes,
          },
          mine: {
            ...prev.mine,
            vote: out?.mine?.vote ?? prev.mine.vote,
          },
        }
      })
    } finally {
      setBusy(false)
    }
  }

  const setReaction = async (type: "LIKE" | "BOOKMARK") => {
    if (!ensureAuth()) return
    if (busy) return
    setBusy(true)
    try {
      const curOn = type === "LIKE" ? (data?.mine.like ?? false) : (data?.mine.bookmark ?? false)
      const enabled = !curOn

      setData((prev) => {
        if (!prev) return prev

        const like = prev.counts.reactions.like + (type === "LIKE" ? (enabled ? 1 : -1) : 0)
        const bookmark = prev.counts.reactions.bookmark + (type === "BOOKMARK" ? (enabled ? 1 : -1) : 0)

        return {
          ...prev,
          counts: {
            ...prev.counts,
            reactions: {
              like: Math.max(0, like),
              bookmark: Math.max(0, bookmark),
            },
          },
          mine: {
            ...prev.mine,
            like: type === "LIKE" ? enabled : prev.mine.like,
            bookmark: type === "BOOKMARK" ? enabled : prev.mine.bookmark,
          },
        }
      })

      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type, enabled }),
      })
      const out = await res.json().catch(() => null)
      if (!res.ok) {
        await load()
        return
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          counts: {
            ...prev.counts,
            reactions: out?.reactions ?? prev.counts.reactions,
          },
          mine: {
            ...prev.mine,
            like: out?.mine?.like ?? prev.mine.like,
            bookmark: out?.mine?.bookmark ?? prev.mine.bookmark,
          },
        }
      })
    } finally {
      setBusy(false)
    }
  }

  const upOn = data?.mine.vote === "UP"
  const downOn = data?.mine.vote === "DOWN"
  const likeOn = data?.mine.like ?? false
  const bookmarkOn = data?.mine.bookmark ?? false

  const upCnt = data?.counts.votes.up ?? 0
  const downCnt = data?.counts.votes.down ?? 0
  const cmCnt = data?.counts.comments ?? 0
  const ctCnt = data?.counts.citations ?? 0
  const likeCnt = data?.counts.reactions.like ?? 0
  const bmCnt = data?.counts.reactions.bookmark ?? 0

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loading || busy}
            onClick={() => setReaction("LIKE")}
            className={
              "min-h-[44px] px-4 py-2 rounded-xl border text-sm transition select-none " +
              (likeOn
                ? "border-pink-500/40 text-pink-200 bg-pink-950/30"
                : "border-neutral-800 text-neutral-200 hover:bg-neutral-900 hover:text-white")
            }
            title="Like"
          >
            ❤️ <span className="ml-1">{likeCnt}</span>
          </button>

          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <div>
              comments <span className="text-neutral-200">{cmCnt}</span>
            </div>
            <div>
              cited <span className="text-neutral-200">{ctCnt}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || busy}
          onClick={() => setReaction("BOOKMARK")}
          className={
            "min-h-[44px] px-4 py-2 rounded-xl border text-sm transition select-none " +
            (bookmarkOn
              ? "border-amber-500/40 text-amber-200 bg-amber-950/30"
              : "border-neutral-800 text-neutral-200 hover:bg-neutral-900 hover:text-white")
          }
          title="Bookmark"
        >
          🔖 <span className="ml-1">{bmCnt}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => setVote("UP")}
          className={
            "rounded-2xl border p-6 text-left transition select-none " +
            (upOn
              ? "border-emerald-500/40 bg-emerald-950/30"
              : "border-neutral-800 bg-black/20 hover:bg-neutral-900")
          }
        >
          <div className="flex items-center justify-between">
            <div className="text-base text-neutral-200 flex items-center gap-2">
              <span className="text-xl">👍</span>
              <span className="font-semibold">Good</span>
            </div>
            <div className="text-xs text-neutral-500">
              UP <span className="text-neutral-200">{upCnt}</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">{pct.upPct}%</div>
        </button>

        <button
          type="button"
          disabled={loading || busy}
          onClick={() => setVote("DOWN")}
          className={
            "rounded-2xl border p-6 text-left transition select-none " +
            (downOn
              ? "border-rose-500/40 bg-rose-950/30"
              : "border-neutral-800 bg-black/20 hover:bg-neutral-900")
          }
        >
          <div className="flex items-center justify-between">
            <div className="text-base text-neutral-200 flex items-center gap-2">
              <span className="text-xl">👎</span>
              <span className="font-semibold">Sorry</span>
            </div>
            <div className="text-xs text-neutral-500">
              DOWN <span className="text-neutral-200">{downCnt}</span>
            </div>
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">{pct.downPct}%</div>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span>
          votes total <span className="text-neutral-200">{pct.total}</span>
        </span>
        <span className="text-neutral-700">·</span>
        <span>
          UP <span className="text-neutral-200">{upCnt}</span>
        </span>
        <span className="text-neutral-700">·</span>
        <span>
          DOWN <span className="text-neutral-200">{downCnt}</span>
        </span>
      </div>
    </section>
  )
}