// components/category/ListControls.tsx
"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

type SortKey = "latest" | "top" | "oldest"
type SearchScope = "all" | "title"

function setParam(params: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(params)
  if (!value) next.delete(key)
  else next.set(key, value)
  return next
}

export default function ListControls() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()

  const sort = (sp.get("sort") as SortKey) ?? "latest"
  const perPage = sp.get("perPage") ?? "10"
  const scope = ((sp.get("scope") as SearchScope) ?? "all") as SearchScope

  const [q, setQ] = useState(sp.get("q") ?? "")

  // URL 변경(뒤로가기 등) 시 input도 동기화
  useEffect(() => {
    setQ(sp.get("q") ?? "")
  }, [sp])

  function push(next: URLSearchParams) {
    next.set("page", "1")
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function runSearch() {
    const trimmed = q.trim()
    const next = new URLSearchParams(sp.toString())
    if (trimmed) next.set("q", trimmed)
    else next.delete("q")
    next.set("page", "1")
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={scope}
            onChange={(e) => push(setParam(new URLSearchParams(sp.toString()), "scope", e.target.value))}
            className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
            title="Search scope"
          >
            <option value="all">Title + Content</option>
            <option value="title">Title only</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch()
            }}
            placeholder="Search titles, content..."
            className="w-full sm:w-80 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />

          <button
            onClick={runSearch}
            className="rounded-md border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Search
          </button>

          {sp.get("q") ? (
            <button
              onClick={() => {
                const next = new URLSearchParams(sp.toString())
                next.delete("q")
                next.set("page", "1")
                startTransition(() => router.push(`${pathname}?${next.toString()}`))
                setQ("")
              }}
              className="rounded-md border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => push(setParam(new URLSearchParams(sp.toString()), "sort", e.target.value))}
            className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
          >
            <option value="latest">Latest</option>
            <option value="top">Top (vote score)</option>
            <option value="oldest">Oldest</option>
          </select>

          <select
            value={perPage}
            onChange={(e) => push(setParam(new URLSearchParams(sp.toString()), "perPage", e.target.value))}
            className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
        This archive is for research and records on crypto-monetary philosophy — not price talk or investment advice.
      </div>
    </div>
  )
}