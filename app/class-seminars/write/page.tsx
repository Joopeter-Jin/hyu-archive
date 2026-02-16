"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

export default function WritePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="text-center mt-20 text-neutral-400">
        Please login to write a post.
      </div>
    )
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing...</p>",
  })

  const handlePublish = async () => {
    if (!editor) return

    setLoading(true)

    const content = editor.getHTML()

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/post/${data.id}`)
    } else {
      alert("Failed to save post")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">

      {/* Title */}
      <input
        className="w-full text-4xl font-serif bg-transparent outline-none placeholder-neutral-600"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Toolbar */}
      {editor && (
        <div className="flex gap-2 border border-neutral-800 rounded-lg p-2 bg-neutral-900">

          <button onClick={() => editor.chain().focus().toggleBold().run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            Bold
          </button>

          <button onClick={() => editor.chain().focus().toggleItalic().run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            Italic
          </button>

          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            H1
          </button>

          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            H2
          </button>

          <button onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            List
          </button>

          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="px-3 py-1 text-sm border rounded hover:bg-neutral-800">
            Code
          </button>

        </div>
      )}

      {/* Editor */}
      <div className="border border-neutral-800 rounded-xl p-6 min-h-[400px] bg-neutral-950">
        <EditorContent editor={editor} />
      </div>

      {/* Publish */}
      <div className="flex justify-end">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="px-6 py-2 bg-white text-black rounded-lg hover:opacity-80 transition"
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>

    </div>
  )
}
