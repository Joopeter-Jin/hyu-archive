// components/dm/StartDMInline.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"

export default function StartDMInline({
  otherUserId,
  className,
  children,
}: {
  otherUserId: string
  className?: string
  children: React.ReactNode
}) {
  const { status } = useSession()
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    if (busy) return

    if (status !== "authenticated") {
      await signIn("google")
      return
    }

    // ✅ 즉시 “열리는 느낌”
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

      router.push(`/messages/${data.threadId}`)
    } catch {
      router.push("/messages?error=dm_start_failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={className ?? "text-left hover:underline disabled:opacity-60"}
      title="Send message"
    >
      {busy ? "Opening..." : children}
    </button>
  )
}