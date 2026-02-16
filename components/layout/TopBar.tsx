"use client"

import { signIn, signOut } from "next-auth/react"
import { useAuth } from "@/context/AuthContext"

export default function TopBar() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-neutral-800 flex items-center justify-end px-6 bg-black">
      
      {user ? (
        <div className="flex items-center gap-4">
          
          {/* 유저 이름 표시 */}
          <span className="text-sm text-neutral-400">
            {user.name}
          </span>

          {/* 로그아웃 */}
          <button
            onClick={() => signOut()}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Logout
          </button>

        </div>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="text-sm text-neutral-400 hover:text-white transition"
        >
          Login
        </button>
      )}

    </header>
  )
}
