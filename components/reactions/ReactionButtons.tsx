// components/reactions/ReactionButtons.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"

type ReactionState = {
  counts: { like: number; bookmark: number }
  mine: { like: boolean; bookmark: boolean }
}

export default function ReactionButtons({ postId }: { postId: string }) {
  const { status } = useSession()

  const [state, setState] = useState<ReactionState>({
    counts: { like: 0, bookmark: 0 },
    mine: { like: false, bookmark: false },
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reactions?postId=${encodeURIComponent(postId)}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setState({ counts: data.counts, mine: data.mine })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") load()
    // 비로그인도 카운트는 보여주고 싶으면, GET을 공개로 바꾸거나 별도 endpoint를 두면 됨.
    // 지금은 인증된 유저 기준으로 구현.
  }, [status, postId])

  const toggle = async (type: "LIKE" | "BOOKMARK") => {
    if (status !== "authenticated") {
      signIn("google")
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const enabled =
        type === "LIKE" ? !state.mine.like : !state.mine.bookmark

      // 낙관적 UI
      setState((prev) => {
        const nextMine =
          type === "LIKE"
            ? { ...prev.mine, like: enabled }
            : { ...prev.mine, bookmark: enabled }

        const nextCounts =
          type === "LIKE"
            ? { ...prev.counts, like: prev.counts.like + (enabled ? 1 : -1) }
            : { ...prev.counts, bookmark: prev.counts.bookmark + (enabled ? 1 : -1) }

        return { counts: nextCounts, mine: nextMine }
      })

      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type, enabled }),
      })

      if (!res.ok) {
        // 실패하면 다시 로드해서 복구
        await load()
        return
      }

      const data = await res.json()
      setState((prev) => ({ ...prev, counts: data.counts }))
    } finally {
      setBusy(false)
    }
  }

  const likeOn = state.mine.like
  const bmOn = state.mine.bookmark

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => toggle("LIKE")}
        disabled={loading || busy}
        className={
          "px-2 py-1 rounded-lg border transition " +
          (likeOn
            ? "border-rose-500/40 text-rose-200 bg-rose-950/30"
            : "border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white")
        }
        title="Like"
      >
        ❤️ {state.counts.like}
      </button>

      <button
        type="button"
        onClick={() => toggle("BOOKMARK")}
        disabled={loading || busy}
        className={
          "px-2 py-1 rounded-lg border transition " +
          (bmOn
            ? "border-amber-500/40 text-amber-200 bg-amber-950/30"
            : "border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white")
        }
        title="Bookmark"
      >
        🔖 {state.counts.bookmark}
      </button>
    </div>
  )
}