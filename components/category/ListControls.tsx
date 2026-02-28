"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

type SortKey = "latest" | "top" | "oldest"

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

  const [q, setQ] = useState(sp.get("q") ?? "")

  function push(next: URLSearchParams) {
    // 필터/검색 바뀌면 page=1로 리셋
    next.set("page", "1")
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, content..."
            className="w-full sm:w-80 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
          <button
            onClick={() => {
              const next = setParam(new URLSearchParams(sp.toString()), "q", q.trim() || undefined)
              push(next)
            }}
            className="rounded-md border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Search
          </button>
          {sp.get("q") ? (
            <button
              onClick={() => {
                const next = setParam(new URLSearchParams(sp.toString()), "q", undefined)
                push(next)
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

      {/* 정체성 가드레일(원하면 문구/표현 더 강하게 조정 가능) */}
      <div className="rounded-md border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
        This archive is for research and records on crypto-monetary philosophy — not price talk or investment advice.
      </div>
    </div>
  )
}