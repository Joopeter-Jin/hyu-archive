"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"
import { useAuth } from "@/context/AuthContext"
import { categoryToPath, type Category } from "@/lib/category"

type Props = {
  category: Category
  heading: string
  description: string
}

export default function CategoryWritePage({ category, heading, description }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="text-center mt-20 text-neutral-400">
          Please login to write a post.
        </div>
      </div>
    )
  }

  const handlePublish = async () => {
    if (!title.trim()) return alert("Title is required.")
    if (!content.trim()) return alert("Content is required.")

    setLoading(true)

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setLoading(false)
      return alert(`Failed to save post: ${err?.error ?? res.statusText}`)
    }

    // ✅ 저장 성공 → 카테고리 목록으로 이동
    router.push(categoryToPath(category))
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold">{heading}</h1>
        <p className="text-neutral-400">{description}</p>
      </div>

      <input
        className="w-full text-4xl font-serif bg-transparent outline-none placeholder-neutral-600"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <NotionEditor content={content} onChange={setContent} />

      <div className="flex justify-end">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="px-6 py-2 bg-white text-black rounded-lg hover:opacity-80 transition disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  )
}
