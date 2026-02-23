"use client"

import { signIn, signOut, useSession } from "next-auth/react"

export default function AuthButtons() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="text-xs text-neutral-500">...</div>
  }

  if (!session) {
    return (
      <button
        type="button"
        className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
        onClick={() => signIn("google")}
      >
        Login
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href="/profile"
        className="px-3 py-1.5 rounded-lg border border-neutral-800 text-sm text-neutral-200 hover:bg-neutral-900"
      >
        Profile
      </a>

      <button
        type="button"
        className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Logout
      </button>
    </div>
  )
}