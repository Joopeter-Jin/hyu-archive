// components/layout/TopBar.tsx
"use client"

import Link from "next/link"
import { signOut, signIn } from "next-auth/react"
import { useAuth } from "@/context/AuthContext"
import InAppLoginGuard from "@/components/auth/InAppLoginGuard"

export default function TopBar() {
  const { user, loading } = useAuth()

  return (
    <header className="h-16 border-b border-neutral-800 flex items-center justify-end px-6 bg-black">
      {loading ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.name}</span>

          <Link
            href="/profile"
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Profile
          </Link>

          <button
            onClick={() => signOut()}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <InAppLoginGuard
          onContinue={() => {
            const callbackUrl =
              typeof window !== "undefined"
                ? new URL(window.location.href).toString()
                : "/"

            signIn("google", { callbackUrl })
          }}
        />
      )}
    </header>
  )
}