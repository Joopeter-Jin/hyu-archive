"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"
import { useAuth } from "@/context/AuthContext"

type PostRow = {
  id: string
  title: string
  content: string
  category: string
}

export default function WriteClient({
  category,
  editId,
}: {
  category: string
  editId?: string
}) {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)

  useEffect(() => {
    if (!editId) return
    ;(async () => {
      setLoadingPost(true)
      try {
        const res = await fetch(`/api/posts/${editId}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load post")
        const post = (await res.json()) as PostRow
        setTitle(post.title ?? "")
        setContent(post.content ?? "")
      } catch {
        alert("Failed to load post for editing.")
      } finally {
        setLoadingPost(false)
      }
    })()
  }, [editId])

  if (!user) {
    return (
      <div className="text-center mt-20 text-neutral-400">
        Please login to write a post.
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/posts", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, title, content, category }),
      })

      if (!res.ok) throw new Error("Failed to save")
      const data = (await res.json()) as { id: string }

      router.push(`/post/${data.id}`)
      router.refresh()
    } catch {
      alert("Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <input
        className="w-full text-4xl font-serif bg-transparent outline-none"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loadingPost}
      />

      {loadingPost ? (
        <div className="text-neutral-400">Loading post…</div>
      ) : (
        <NotionEditor content={content} onChange={setContent} />
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loadingPost}
          className="px-6 py-2 bg-white text-black rounded-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : editId ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  )
}