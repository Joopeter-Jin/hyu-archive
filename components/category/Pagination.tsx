// components/category/Pagination.tsx
"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

function buildPages(page: number, total: number) {
  // 1 ... (page-1) page (page+1) ... total 형태(최대 7~9개 정도)
  const pages = new Set<number>()
  pages.add(1)
  pages.add(total)

  for (let p = page - 2; p <= page + 2; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const out: Array<number | "..."> = []

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]
    const prev = sorted[i - 1]
    if (i > 0 && prev !== undefined && cur - prev > 1) out.push("...")
    out.push(cur)
  }
  return out
}

export default function Pagination(props: { page: number; totalPages: number }) {
  const { page, totalPages } = props
  const sp = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()

  function go(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return
    const next = new URLSearchParams(sp.toString())
    next.set("page", String(nextPage))
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`)
      router.refresh()
    })
  }

  if (totalPages <= 1) return null

  const items = buildPages(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-6">
      <button
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-md border border-neutral-800 px-3 py-2 text-sm disabled:opacity-40"
      >
        Prev
      </button>

      <div className="flex flex-wrap items-center gap-1">
        {items.map((it, idx) =>
          it === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-sm text-neutral-600">
              …
            </span>
          ) : (
            <button
              key={it}
              onClick={() => go(it)}
              className={[
                "min-w-[36px] rounded-md border px-3 py-2 text-sm",
                it === page
                  ? "border-neutral-600 bg-neutral-900 text-neutral-100"
                  : "border-neutral-800 text-neutral-300 hover:bg-neutral-900",
              ].join(" ")}
              aria-current={it === page ? "page" : undefined}
            >
              {it}
            </button>
          )
        )}
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