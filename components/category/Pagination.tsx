"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export default function Pagination(props: { page: number; totalPages: number }) {
  const { page, totalPages } = props
  const sp = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()

  function go(nextPage: number) {
    const next = new URLSearchParams(sp.toString())
    next.set("page", String(nextPage))
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-md border border-neutral-800 px-3 py-2 text-sm disabled:opacity-40"
      >
        Prev
      </button>
      <div className="text-sm text-neutral-400">
        {page} / {totalPages}
      </div>
      <button
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className="rounded-md border border-neutral-800 px-3 py-2 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}