"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function WriteButton({ href }: { href: string }) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <Link
      href={href}
      className="px-4 py-2 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition text-sm"
    >
      Write Post
    </Link>
  )
}
