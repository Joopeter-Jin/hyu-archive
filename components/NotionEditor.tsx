"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Dropcursor from "@tiptap/extension-dropcursor"
import Suggestion from "@tiptap/suggestion"
import { Extension } from "@tiptap/core"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch("/api/upload", { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? "upload failed")
  }
  const data = await res.json()
  return data.url as string
}

/**
 * 간단한 Notion 느낌 Slash menu
 */
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
            title: "Quote",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
          },
          {
            title: "Code Block",
            command: ({ editor, range }: any) =>
              editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
          },
        ],

        render: () => {
          let el: HTMLDivElement | null = null

          const make = (props: any) => {
            const root = document.createElement("div")
            root.className =
              "z-[9999] w-64 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl overflow-hidden"

            props.items.forEach((item: any) => {
              const row = document.createElement("button")
              row.type = "button"
              row.className =
                "w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              row.textContent = item.title
              row.onclick = () => item.command(props)
              root.appendChild(row)
            })

            return root
          }

          return {
            onStart: (props) => {
              el = make(props)
              document.body.appendChild(el)

              const rect = props.clientRect?.()
              if (!rect || !el) return
              el.style.position = "absolute"
              el.style.left = `${rect.left}px`
              el.style.top = `${rect.bottom + 8}px`
            },
            onUpdate: (props) => {
              if (!el) return
              el.remove()
              el = make(props)
              document.body.appendChild(el)

              const rect = props.clientRect?.()
              if (!rect || !el) return
              el.style.position = "absolute"
              el.style.left = `${rect.left}px`
              el.style.top = `${rect.bottom + 8}px`
            },
            onExit: () => {
              el?.remove()
              el = null
            },
          }
        },
      }),
    ]
  },
})

export default function NotionEditor({ content, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // ✅ SSR hydration 경고 방지

    extensions: [
      StarterKit,
      Underline,
      Dropcursor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      SlashCommand,
    ],

    content: content ?? "<p></p>",

    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[520px] " +
          "prose-headings:font-serif prose-p:leading-relaxed",
      },

      // 드래그 앤 드롭 이미지
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const file = files[0]
        if (!file.type.startsWith("image/")) return false

        uploadImage(file)
          .then((url) => {
            const node = view.state.schema.nodes.image.create({ src: url })
            const tr = view.state.tr.replaceSelectionWith(node)
            view.dispatch(tr)
          })
          .catch(() => {})

        return true
      },

      // 붙여넣기 이미지(클립보드)
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        const img = Array.from(items).find((i) => i.type.startsWith("image/"))
        if (!img) return false

        const file = img.getAsFile()
        if (!file) return false

        uploadImage(file)
          .then((url) => {
            const node = view.state.schema.nodes.image.create({ src: url })
            const tr = view.state.tr.replaceSelectionWith(node)
            view.dispatch(tr)
          })
          .catch(() => {})

        return true
      },
    },

    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
      <EditorContent editor={editor} />
    </div>
  )
}
