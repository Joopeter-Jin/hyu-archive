"use client"

import Link from "next/link"

export default function TopBar() {
  return (
    <header className="h-16 border-b border-border flex items-center justify-end px-6">
      <Link
        href="/login"
        className="text-sm font-medium hover:text-primary"
      >
        Login
      </Link>
    </header>
  )
}
