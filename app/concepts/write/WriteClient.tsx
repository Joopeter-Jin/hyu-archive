"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"

type Props = {
  category: string
  editId?: string | null // ✅ optional
}

type PostDTO = {
  id: string
  title: string
  content: string
  category: string
}

export default function WriteClient({ category, editId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ✅ prop 우선, 없으면 URL 쿼리에서 읽기 (?edit=...)
  const resolvedEditId = useMemo(() => {
    return editId ?? searchParams.get("edit")
  }, [editId, searchParams])

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState<boolean>(!!resolvedEditId)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    if (!resolvedEditId) {
      setInitLoading(false)
      return
    }

    ;(async () => {
      try {
        setInitLoading(true)
        setErrorMsg(null)

        const res = await fetch(`/api/posts/${resolvedEditId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Failed to load post")

        const post = (await res.json()) as PostDTO
        if (ignore) return

        setTitle(post.title ?? "")
        setContent(post.content ?? "")
      } catch {
        if (!ignore) setErrorMsg("Failed to load the post for editing.")
      } finally {
        if (!ignore) setInitLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [resolvedEditId])

  const handleSave = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const url = resolvedEditId ? `/api/posts/${resolvedEditId}` : "/api/posts"
      const method = resolvedEditId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Save failed")
      }

      // ✅ 저장 후 목록으로
      router.push(`/${category}`)
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save post."
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return <div className="text-neutral-400 px-6 py-12">Loading editor...</div>
  }

  return (
    <div className="max-w-4xl py-12 px-6 space-y-8">
      <input
        className="w-full text-4xl font-serif bg-transparent outline-none"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <NotionEditor content={content} onChange={setContent} />

      {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-white text-black rounded-lg disabled:opacity-50"
        >
          {loading ? "Saving..." : resolvedEditId ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  )
}