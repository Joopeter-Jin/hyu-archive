"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function TopBar() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-neutral-800 flex items-center justify-end px-6 bg-black">

      {user ? (
        <button className="text-sm text-neutral-400 hover:text-white transition">
          Logout
        </button>
      ) : (
        <Link
          href="/login"
          className="text-sm text-neutral-400 hover:text-white transition"
        >
          Login
        </Link>
      )}

    </header>
  )
}
