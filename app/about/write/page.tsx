"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"

type PostDTO = {
  id: string
  title: string
  content: string
  category: string
}

export default function WritePage() {
  const { user } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()

  const editId = sp.get("edit") // ✅ edit 모드면 postId 들어옴

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)

  // ✅ edit 모드면 기존 글 불러오기
  useEffect(() => {
    if (!editId) return
    let cancelled = false

    ;(async () => {
      setLoadingPost(true)
      try {
        const res = await fetch(`/api/posts/${editId}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Load failed: ${res.status}`)
        const post = (await res.json()) as PostDTO
        if (cancelled) return

        setTitle(post.title ?? "")
        setContent(post.content ?? "")
      } catch (e) {
        console.error(e)
        alert("Failed to load the post for editing.")
      } finally {
        if (!cancelled) setLoadingPost(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editId])

  if (!user) {
    return (
      <div className="text-center mt-20 text-neutral-400">
        Please login to write a post.
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Title is required.")
      return
    }

    setLoading(true)
    try {
      // ✅ edit이면 PUT, 아니면 POST
      const url = editId ? `/api/posts/${editId}` : "/api/posts"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category: "about", // ✅ about/write니까 category 고정
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${method} failed (${res.status}): ${text}`)
      }

      const data = (await res.json()) as { id: string }

      // ✅ 저장 후: 상세로 가거나 목록으로 가거나 선택
      router.push(`/post/${data.id}`)
      router.refresh()
    } catch (e) {
      console.error(e)
      alert("Failed to save post.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="space-y-2">
        <div className="text-xs text-neutral-500">
          {editId ? "Editing post" : "New post"}
        </div>

        <input
          className="w-full text-4xl font-serif bg-transparent outline-none placeholder-neutral-600"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loadingPost}
        />
      </div>

      {loadingPost ? (
        <div className="text-neutral-500">Loading post...</div>
      ) : (
        <NotionEditor content={content} onChange={setContent} />
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || loadingPost}
          className="px-6 py-2 bg-white text-black rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : editId ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  )
}