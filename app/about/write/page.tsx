"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"

export default function WritePage() {
  const [title, setTitle] = useState("")

  const { user } = useAuth()
    if (!user) {
    return <div className="text-center mt-20">
      Please login to write a post.
      </div>
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing...</p>",
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <input
        className="w-full text-3xl font-serif bg-transparent outline-none"
        placeholder="Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="border border-border rounded-lg p-4 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      <button className="px-4 py-2 border rounded-lg hover:bg-accent">
        Publish
      </button>
    </div>
  )
}
