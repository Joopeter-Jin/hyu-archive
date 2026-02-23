"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { SessionProvider, useSession } from "next-auth/react"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type Profile = {
  displayName: string
  role: Role
}

type AuthUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  profile: Profile | null
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const sessionUser = session?.user as any

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const refresh = async () => {
    // 로그인 안 되어있으면 초기화
    const userId = sessionUser?.id as string | undefined
    if (!userId) {
      setUser(null)
      return
    }

    setLoadingProfile(true)
    try {
      // ✅ profile + 내가 필요한 유저정보를 한 번에 가져오는 API
      // (아직 없다면 다음 단계에서 만들어주면 됨)
      const res = await fetch("/api/profile/me", { cache: "no-store" })
      if (!res.ok) {
        // API 실패해도 기본 user는 살려둠
        setUser({
          id: userId,
          name: sessionUser?.name ?? null,
          email: sessionUser?.email ?? null,
          image: sessionUser?.image ?? null,
          profile: null,
        })
        return
      }

      const data = (await res.json()) as {
        id: string
        name: string | null
        email: string | null
        image: string | null
        profile: Profile | null
      }

      setUser({
        id: data.id ?? userId,
        name: data.name ?? sessionUser?.name ?? null,
        email: data.email ?? sessionUser?.email ?? null,
        image: data.image ?? sessionUser?.image ?? null,
        profile: data.profile ?? null,
      })
    } catch {
      // 네트워크 에러 등에서도 기본 user만 유지
      setUser({
        id: userId,
        name: sessionUser?.name ?? null,
        email: sessionUser?.email ?? null,
        image: sessionUser?.image ?? null,
        profile: null,
      })
    } finally {
      setLoadingProfile(false)
    }
  }

  // ✅ 세션 상태가 바뀌면(로그인/로그아웃) profile 다시 로드
  useEffect(() => {
    if (status === "loading") return

    const userId = sessionUser?.id as string | undefined
    if (!userId) {
      setUser(null)
      return
    }

    // 세션 기본값 먼저 세팅해 UI 깜빡임 최소화
    setUser({
      id: userId,
      name: sessionUser?.name ?? null,
      email: sessionUser?.email ?? null,
      image: sessionUser?.image ?? null,
      profile: null,
    })

    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sessionUser?.id])

  const value = useMemo<AuthState>(() => {
    return {
      user,
      loading: status === "loading" || loadingProfile,
      refresh,
    }
  }, [user, status, loadingProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    loading: status === "loading",
  }
}