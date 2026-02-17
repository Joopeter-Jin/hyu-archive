"use client"

import { SessionProvider, useSession } from "next-auth/react"

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user ?? null,
    loading: status === "loading",
  }
}
