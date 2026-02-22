"use client"

import { useEffect, useState } from "react"

type VoteType = "POST" | "COMMENT"
type VoteValue = "UP" | "DOWN" | null

interface Props {
  type: VoteType
  targetId: string
}

interface VoteResponse {
  up: number
  down: number
  score: number
  myVote: VoteValue
}

export default function VoteButtons({ type, targetId }: Props) {
  const [data, setData] = useState<VoteResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔹 최초 로딩
  useEffect(() => {
    fetch(`/api/votes?type=${type}&targetId=${targetId}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [type, targetId])

  if (!data) {
    return (
      <div className="text-xs text-neutral-500">
        0
      </div>
    )
  }

  const handleVote = async (value: "UP" | "DOWN") => {
    if (loading) return
    setLoading(true)

    try {
      // 이미 같은 버튼이면 취소
      if (data.myVote === value) {
        const res = await fetch("/api/votes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, targetId }),
        })
        const json = await res.json()
        setData(json)
        return
      }

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, value }),
      })

      if (!res.ok) {
        alert("Login required")
        return
      }

      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm select-none">
      {/* 👍 UP */}
      <button
        onClick={() => handleVote("UP")}
        disabled={loading}
        className={`px-1 py-0.4 rounded transition ${
          data.myVote === "UP"
            ? "bg-green-600 text-white"
            : "bg-neutral-800 hover:bg-neutral-700"
        }`}
      >
        ▲ {data.up}
      </button>

      {/* 👎 DOWN */}
      <button
        onClick={() => handleVote("DOWN")}
        disabled={loading}
        className={`px-1 py-0.4 rounded transition ${
          data.myVote === "DOWN"
            ? "bg-red-600 text-white"
            : "bg-neutral-800 hover:bg-neutral-700"
        }`}
      >
        ▼ {data.down}
      </button>

      <span className="text-neutral-400 text-xs">
        score {data.score}
      </span>
    </div>
  )
}