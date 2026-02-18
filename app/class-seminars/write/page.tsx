"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import NotionEditor from "@/components/NotionEditor"

export default function WritePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) {
    return <div className="mt-20 text-neutral-400">Please login to write a post.</div>
  }

  const handlePublish = async () => {
    setLoading(true)

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        category: "class-seminars", // ✅ 여기만 카테고리별로 변경
      }),
    })

    if (res.ok) {
      // 저장 후 “목록으로”
      router.push("/about")
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(`Failed: ${err?.error ?? "unknown"}`)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-5xl py-16 px-6 space-y-8">
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
          className="px-6 py-2 bg-white text-black rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  )
}
