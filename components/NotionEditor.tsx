"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"

import { createLowlight } from "lowlight"
import javascript from "highlight.js/lib/languages/javascript"
import python from "highlight.js/lib/languages/python"
import typescript from "highlight.js/lib/languages/typescript"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

/* ---------------------- */
/* Lowlight Instance Setup */
/* ---------------------- */

const lowlight = createLowlight()

lowlight.register("javascript", javascript)
lowlight.register("typescript", typescript)
lowlight.register("python", python)

/* ---------------------- */
/* Editor Component */
/* ---------------------- */

export default function NotionEditor({ content, onChange }: Props) {
  const editor = useEditor({
  immediatelyRender: false, // 🔥 SSR hydration 해결

  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    Underline,
    Image,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Placeholder.configure({
      placeholder: "Start writing your research...",
    }),
  ],
  content,
  editorProps: {
    attributes: {
      class:
        "prose prose-invert max-w-none focus:outline-none min-h-[300px]",
    },
  },
  onUpdate({ editor }) {
    onChange?.(editor.getHTML())
  },
})


  if (!editor) return null

  return (
    <div className="space-y-4">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

/* ---------------------- */
/* Toolbar */
/* ---------------------- */

function Toolbar({ editor }: any) {
  if (!editor) return null

  const addImage = () => {
    const url = window.prompt("Enter image URL")
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap gap-2 border border-neutral-800 rounded-lg p-2 bg-neutral-900 text-sm">
      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </button>

      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italic
      </button>

      <button onClick={() => editor.chain().focus().toggleUnderline().run()}>
        Underline
      </button>

      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </button>

      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </button>

      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Bullet
      </button>

      <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        Numbered
      </button>

      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        Code
      </button>

      <button onClick={addImage}>Image</button>
    </div>
  )
}
