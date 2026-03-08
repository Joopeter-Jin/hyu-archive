// components/post/CiteThisArticle.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export default function CiteThisArticle({
  postId,
  title,
  authorName,
  createdAt,
}: {
  postId: string
  title: string
  authorName: string
  createdAt: string
}) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)

  const origin = useMemo(() => {
    if (typeof window === "undefined") return ""
    return window.location.origin
  }, [])

  const link = `${origin}/post/${postId}`
  const isoDate = new Date(createdAt).toISOString().slice(0, 10)
  const humanDate = new Date(createdAt).toLocaleDateString("ko-KR")

  const citation = `${authorName}, "${title}", HYU Crypto Philosophy Archive`
  const bibliography = `${authorName}. "${title}." HYU Crypto Philosophy Archive. ${isoDate}. ${link}`

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(msg)
      window.setTimeout(() => setToast(null), 1800)
    } catch {
      setToast("Copy failed")
      window.setTimeout(() => setToast(null), 1800)
    }
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!rootRef.current || !target) return
      if (!rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
        onClick={() => setOpen((v) => !v)}
      >
        Cite this post
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
          <div className="text-base font-semibold text-white">Cite this post</div>
          <div className="mt-1 text-xs text-neutral-500">{humanDate}</div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-neutral-900 bg-black/20 p-3">
              <div className="text-xs text-neutral-500">Link</div>
              <div className="mt-1 break-all text-sm text-neutral-200">{link}</div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-900"
                onClick={() => copy(link, "Link copied")}
              >
                Copy link
              </button>
            </div>

            <div className="rounded-xl border border-neutral-900 bg-black/20 p-3">
              <div className="text-xs text-neutral-500">Citation</div>
              <div className="mt-1 text-sm text-neutral-200 break-words">
                {citation}
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-900"
                onClick={() => copy(citation, "Citation copied")}
              >
                Copy citation
              </button>
            </div>

            <div className="rounded-xl border border-neutral-900 bg-black/20 p-3">
              <div className="text-xs text-neutral-500">Bibliography</div>
              <div className="mt-1 text-sm text-neutral-200 break-words">
                {bibliography}
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-900"
                onClick={() => copy(bibliography, "Bibliography copied")}
              >
                Copy bibliography
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute right-0 top-[calc(100%+220px)] z-30 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 shadow">
          {toast}
        </div>
      )}
    </div>
  )
}