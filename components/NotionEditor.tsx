"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Dropcursor from "@tiptap/extension-dropcursor"
import { useRef } from "react"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

async function uploadToServer(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)

  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error("Upload failed")

  const data = (await res.json()) as { url: string }
  return data.url
}

export default function NotionEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Dropcursor,
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or drop an image…",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[500px]",
      },

      // ✅ drag&drop 파일 처리
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files?.length) return false

        const file = files[0]
        if (!file.type.startsWith("image/")) return false

        ;(async () => {
          try {
            const url = await uploadToServer(file)
            editor?.chain().focus().setImage({ src: url }).run()
          } catch (e) {
            alert("Image upload failed")
          }
        })()

        return true
      },

      // ✅ paste 이미지 처리
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        const fileItem = Array.from(items).find((i) => i.type.startsWith("image/"))
        if (!fileItem) return false

        const file = fileItem.getAsFile()
        if (!file) return false

        ;(async () => {
          try {
            const url = await uploadToServer(file)
            editor?.chain().focus().setImage({ src: url }).run()
          } catch {
            alert("Image upload failed")
          }
        })()

        return true
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  const onPickImage = async (f: File | null) => {
    if (!f) return
    try {
      const url = await uploadToServer(f)
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
      alert("Image upload failed")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      {/* Notion 느낌: 상단에 간단한 삽입 버튼 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1 text-sm border border-neutral-800 rounded hover:bg-neutral-900"
          onClick={() => fileInputRef.current?.click()}
        >
          Insert image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
        />
        <div className="text-xs text-neutral-500">
          Drag & drop / Paste supported
        </div>
      </div>

      <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-950">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
