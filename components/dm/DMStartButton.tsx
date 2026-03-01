// components/dm/DMStartButton.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn, useSession } from "next-auth/react"

export default function DMStartButton({ otherUserId }: { otherUserId: string }) {
  const { status } = useSession()
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const start = async () => {
    if (status !== "authenticated") {
      await signIn("google")
      return
    }

    // ✅ 즉시 이동(체감 개선)
    router.push("/messages?opening=1")
    setBusy(true)

    try {
      const res = await fetch("/api/dm/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to create thread")

      // ✅ threadId가 오면 대화방으로 이동
      router.push(`/messages/${data.threadId}`)
    } catch {
      // 실패하면 messages로 남기고 안내
      router.push("/messages?error=dm_start_failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={start}
      disabled={busy}
      className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-50"
    >
      {busy ? "Opening..." : "Message"}
    </button>
  )
}