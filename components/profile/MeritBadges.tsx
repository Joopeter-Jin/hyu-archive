//components/profile/MeritBadges.tsx
"use client"

import { useEffect, useState } from "react"

export default function MeritBadges() {
  const [badges, setBadges] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/profile/badges")
      .then(r => r.json())
      .then(setBadges)
  }, [])

  if (!badges.length) return null

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-3">
      <div className="text-sm font-semibold">Merit Badges</div>

      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <div
            key={b.id}
            className="text-xs px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-900"
          >
            {b.badge.name}
          </div>
        ))}
      </div>
    </div>
  )
}