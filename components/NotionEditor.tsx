"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { Extension } from "@tiptap/core"

import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Dropcursor from "@tiptap/extension-dropcursor"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import BubbleMenuExt from "@tiptap/extension-bubble-menu"
import Suggestion from "@tiptap/suggestion"

import { createLowlight } from "lowlight"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import css from "highlight.js/lib/languages/css"

import { getSupabaseAnon } from "@/lib/supabase"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

/* -------------------------- */
/* Lowlight Setup */
/* -------------------------- */
const lowlight = createLowlight()
lowlight.register("javascript", javascript)
lowlight.register("typescript", typescript)
lowlight.register("python", python)
lowlight.register("css", css)

/* -------------------------- */
/* Supabase Image Upload */
/* -------------------------- */
async function uploadImageToSupabase(file: File): Promise<string> {
  const supabase = getSupabaseAnon()

  const ext = file.name.split(".").pop() || "png"
  const path = `uploads/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("editor-images")
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("editor-images").getPublicUrl(path)
  return data.publicUrl
}

/* -------------------------- */
/* Slash Command */
/* -------------------------- */
const SlashCommand = Extension.create({
  name: "slash-command",
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: true,

        items: () => [
          {
            title: "Heading 1",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
          },
          {
            title: "Heading 2",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
          },
          {
            title: "Bullet List",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleBulletList().run(),
          },
          {
            title: "Numbered List",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
          },
          {
            title: "Code Block",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
          },
          {
            title: "Quote",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
          },
          {
            title: "Divider",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
          },
        ],

        render: () => {
          let root: HTMLDivElement | null = null
          const cleanup = () => {
            root?.remove()
            root = null
          }

          return {
            onStart: (props) => {
              cleanup()
              root = document.createElement("div")
              root.className =
                "z-50 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm shadow-xl min-w-[220px]"

              const rect = props.clientRect?.()
              if (rect) {
                root.style.position = "absolute"
                root.style.left = `${rect.left}px`
                root.style.top = `${rect.bottom + 8}px`
              }

              props.items.forEach((item: any) => {
                const row = document.createElement("button")
                row.type = "button"
                row.className =
                  "w-full text-left px-3 py-2 rounded hover:bg-neutral-900 text-neutral-200"
                row.innerText = item.title
                row.onclick = () => item.command(props)
                root!.appendChild(row)
              })

              document.body.appendChild(root)
            },

            onUpdate: (props) => {
              if (!root) return
              const rect = props.clientRect?.()
              if (rect) {
                root.style.left = `${rect.left}px`
                root.style.top = `${rect.bottom + 8}px`
              }
            },

            onExit: cleanup,
          }
        },
      }),
    ]
  },
})

/* -------------------------- */
/* Editor */
/* -------------------------- */
export default function NotionEditor({ content, onChange }: Props) {
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const [bubbleEl, setBubbleEl] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    setBubbleEl(bubbleRef.current)
  }, [])

  const extensions = useMemo(() => {
    const exts: any[] = [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Dropcursor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
      SlashCommand,
    ]

    // ✅ BubbleMenu: tippyOptions 없이 (v3 타입 안전)
    if (bubbleEl) {
      exts.push(
        BubbleMenuExt.configure({
          element: bubbleEl,
        })
      )
    }

    return exts
  }, [bubbleEl])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content,
      editorProps: {
        attributes: {
          class:
            "prose prose-invert max-w-none focus:outline-none min-h-[520px] " +
            "prose-p:leading-7 prose-headings:font-serif",
        },
      },
      onUpdate({ editor }) {
        onChange?.(editor.getHTML())
      },
    },
    [extensions]
  )

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor) return
      try {
        const url = await uploadImageToSupabase(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch (e) {
        console.error(e)
        alert("Image upload failed. Check Supabase bucket/policy.")
      }
    },
    [editor]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const file = event.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith("image/")) return
      event.preventDefault()
      void insertImageFromFile(file)
    },
    [insertImageFromFile]
  )

  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      const imgItem = Array.from(items).find((i) => i.type.startsWith("image/"))
      if (!imgItem) return

      event.preventDefault()
      const file = imgItem.getAsFile()
      if (!file) return
      void insertImageFromFile(file)
    },
    [insertImageFromFile]
  )

  if (!editor) return null

  return (
    <div className="space-y-3" onDrop={onDrop} onPaste={onPaste}>
      <div
        ref={bubbleRef}
        className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 shadow-xl"
      >
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-neutral-900"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-neutral-900"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-neutral-900"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-neutral-900"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          Code
        </button>
      </div>

      <div className="border border-neutral-800 rounded-xl bg-neutral-950 p-6">
        <EditorContent editor={editor} />
      </div>

      <div className="text-xs text-neutral-500">
        Tip: type <span className="text-neutral-300">/</span> to open commands · drag & drop / paste images to upload
      </div>
    </div>
  )
}
