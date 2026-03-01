// components/WriteButton.tsx
"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

const CATEGORY_ACL: Record<string, Role[]> = {
  "about": ["ADMIN"],
  "class-seminars": ["ADMIN", "PROFESSOR", "GRAD"],
  "news": ["ADMIN", "PROFESSOR", "CONTRIBUTOR"],
  "concepts": ["ADMIN", "PROFESSOR", "GRAD"],
  "debates": ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR", "USER"],
  "reading-notes": ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR"],
}

function canWrite(role: Role, category: string) {
  if (role === "ADMIN") return true
  const allowed = CATEGORY_ACL[category]
  if (!allowed) return false
  return allowed.includes(role)
}

export default function WriteButton({
  href,
  category,
}: {
  href: string
  category: string
}) {
  const { user } = useAuth()
  if (!user) return null

  const role = (user.profile?.role ?? "USER") as Role
  if (!canWrite(role, category)) return null

  return (
    <Link
      href={href}
      className="px-4 py-2 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition text-sm"
    >
      Write Post
    </Link>
  )
}