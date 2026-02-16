"use client"

import { createContext, useContext } from "react"

const AuthContext = createContext({
  user: { name: "DevUser" } // 👈 임시 로그인 상태
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const user = { name: "DevUser" } // 👈 null 대신 이걸로

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}
