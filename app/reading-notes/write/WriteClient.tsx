"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"

type Props = {
  category: string
  editId: string | null
}

type PostDTO = {
  id: string
  title: string
  content: string
  category: string
}

export default function WriteClient({ category, editId }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState<boolean>(!!editId)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    if (!editId) return

    ;(async () => {
      try {
        setInitLoading(true)
        setErrorMsg(null)

        const res = await fetch(`/api/posts/${editId}`, { cache: "no-store" })
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
  }, [editId])

  const handleSave = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch(editId ? `/api/posts/${editId}` : "/api/posts", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Save failed")
      }

      router.push(`/${category}`)
      router.refresh()
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to save post.")
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) return <div className="text-neutral-400">Loading editor...</div>

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
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-white text-black rounded-lg disabled:opacity-50"
        >
          {loading ? "Saving..." : editId ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  )
}