// components/layout/TopBar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut, signIn } from "next-auth/react"
import { useAuth } from "@/context/AuthContext"
import InAppLoginGuard from "@/components/auth/InAppLoginGuard"
import MobileSidebar from "@/components/MobileSidebar"

export default function TopBar() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = () => setMobileOpen((v) => !v)
  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-black">
        {/* Left: Mobile Hamburger + (optional) brand */}
        <div className="flex items-center gap-3">
          {/* Mobile only */}
          <button
            onClick={toggleMobile}
            className="md:hidden p-2 text-neutral-300 hover:text-white transition"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>

          {/* Brand (mobile에서도 보이게) */}
          <Link
            href="/"
            className="text-sm sm:text-base font-serif font-bold tracking-tight hover:opacity-80 transition"
            onClick={() => setMobileOpen(false)}
          >
            Crypto Philosophy Archive
          </Link>
        </div>

        {/* Right: Auth area */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="text-sm text-neutral-500">Loading...</div>
          ) : user ? (
            <>
              <span className="hidden sm:inline text-sm text-neutral-400">
                {user.name}
              </span>

              <Link
                href="/profile"
                className="text-sm text-neutral-400 hover:text-white transition"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>

              <button
                onClick={() => signOut()}
                className="text-sm text-neutral-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
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
        </div>
      </header>

      {/* Mobile Drawer (버튼은 헤더에 있으니, Drawer는 여기서만 렌더) */}
      <MobileSidebar open={mobileOpen} onClose={closeMobile} />
    </>
  )
}