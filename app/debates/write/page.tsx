"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"

export default function WritePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="text-center mt-20 text-neutral-400">
        Please login to write a post.
      </div>
    )
  }

  const handlePublish = async () => {
    setLoading(true)

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/post/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <input
        className="w-full text-4xl font-serif bg-transparent outline-none"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <NotionEditor content={content} onChange={setContent} />

      <div className="flex justify-end">
        <button
          onClick={handlePublish}
          className="px-6 py-2 bg-white text-black rounded-lg"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  )
}
