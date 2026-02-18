"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { Extension } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Dropcursor from "@tiptap/extension-dropcursor"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Suggestion from "@tiptap/suggestion"
import Image from "@tiptap/extension-image"

import React, { useEffect, useMemo, useRef, useState } from "react"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

/* ---------------------------
   Upload helper
---------------------------- */

async function uploadToServer(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)

  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error("Upload failed")

  const data = (await res.json()) as { url: string }
  return data.url
}

/* ---------------------------
   Resizable Image Node
---------------------------- */

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      // px 리사이즈용
      width: {
        default: null as number | null,
        parseHTML: (el) => {
          const w = el.getAttribute("data-width")
          return w ? Number(w) : null
        },
        renderHTML: (attrs) => (attrs.width ? { "data-width": String(attrs.width) } : {}),
      },

      // 프리셋(%)용
      widthPct: {
        default: null as number | null, // 25 / 50 / 100
        parseHTML: (el) => {
          const w = el.getAttribute("data-width-pct")
          return w ? Number(w) : null
        },
        renderHTML: (attrs) =>
          attrs.widthPct ? { "data-width-pct": String(attrs.widthPct) } : {},
      },

      align: {
        default: "center" as "left" | "center" | "right",
        parseHTML: (el) => (el.getAttribute("data-align") as any) ?? "center",
        renderHTML: (attrs) => ({ "data-align": attrs.align }),
      },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("div")
      wrapper.className =
        "relative my-3 max-w-full rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950"
      wrapper.style.display = "block"

      const inner = document.createElement("div")
      inner.className = "relative"
      inner.style.display = "inline-block"
      inner.style.maxWidth = "100%"

      const img = document.createElement("img")
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ""
      img.draggable = false
      img.className = "block max-w-full h-auto select-none"

      // ✅ align 적용
      const applyAlign = (align: "left" | "center" | "right") => {
        if (align === "left") wrapper.style.textAlign = "left"
        if (align === "center") wrapper.style.textAlign = "center"
        if (align === "right") wrapper.style.textAlign = "right"
      }

      // ✅ width 적용 (pct 우선)
      const applyWidth = (attrs: any) => {
        if (attrs.widthPct) {
          img.style.width = `${attrs.widthPct}%`
        } else if (attrs.width) {
          img.style.width = `${attrs.width}px`
        } else {
          img.style.width = "auto"
        }
      }

      applyAlign(node.attrs.align ?? "center")
      applyWidth(node.attrs)

      // 리사이즈 핸들
      const handle = document.createElement("div")
      handle.className =
        "absolute right-1 bottom-1 w-3 h-3 rounded-sm bg-white/80 cursor-se-resize shadow"
      handle.title = "Drag to resize"

      // ✅ 팝오버
      const pop = document.createElement("div")
      pop.className =
        "hidden absolute left-2 top-2 z-20 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg p-1"
      pop.style.whiteSpace = "nowrap"

      const mkBtn = (label: string, onClick: () => void) => {
        const b = document.createElement("button")
        b.type = "button"
        b.className =
          "px-2 py-1 text-xs rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
        b.textContent = label
        b.onmousedown = (e) => e.preventDefault()
        b.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }
        return b
      }

      const setAttrs = (attrs: Record<string, any>) => {
        const pos = typeof getPos === "function" ? getPos() : null
        if (pos == null) return
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
            return true
          })
          .run()
      }

      const delNode = () => {
        const pos = typeof getPos === "function" ? getPos() : null
        if (pos == null) return
        editor.chain().focus().command(({ tr }) => {
          tr.delete(pos, pos + node.nodeSize)
          return true
        }).run()
      }

      // align
      pop.appendChild(mkBtn("Left", () => setAttrs({ align: "left" })))
      pop.appendChild(mkBtn("Center", () => setAttrs({ align: "center" })))
      pop.appendChild(mkBtn("Right", () => setAttrs({ align: "right" })))

      // width presets (%)
      pop.appendChild(mkBtn("25%", () => setAttrs({ widthPct: 25, width: null })))
      pop.appendChild(mkBtn("50%", () => setAttrs({ widthPct: 50, width: null })))
      pop.appendChild(mkBtn("100%", () => setAttrs({ widthPct: 100, width: null })))

      // delete
      pop.appendChild(mkBtn("Delete", delNode))

      const showPop = () => {
        pop.classList.remove("hidden")
      }
      const hidePop = () => {
        pop.classList.add("hidden")
      }

      // 클릭 시 토글
      inner.addEventListener("click", (e) => {
        e.stopPropagation()
        if (pop.classList.contains("hidden")) showPop()
        else hidePop()
      })

      // 바깥 클릭 시 닫기
      const onDocClick = () => hidePop()
      document.addEventListener("click", onDocClick)

      // 드래그 리사이즈 (드래그하면 px로 저장 + widthPct 해제)
      let startX = 0
      let startWidth = 0
      let dragging = false

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragging = true
        startX = e.clientX
        startWidth = img.getBoundingClientRect().width

        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return
        const delta = e.clientX - startX
        const nextWidth = Math.max(160, Math.min(1200, Math.round(startWidth + delta)))
        img.style.width = `${nextWidth}px`
      }

      const onMouseUp = () => {
        if (!dragging) return
        dragging = false

        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)

        const nextWidth = Math.round(img.getBoundingClientRect().width)
        setAttrs({ width: nextWidth, widthPct: null })
      }

      handle.addEventListener("mousedown", onMouseDown)

      inner.appendChild(pop)
      inner.appendChild(img)
      inner.appendChild(handle)
      wrapper.appendChild(inner)

      return {
        dom: wrapper,

        update: (updatedNode) => {
          if (updatedNode.type.name !== node.type.name) return false
          node = updatedNode
          img.src = updatedNode.attrs.src
          applyAlign(updatedNode.attrs.align ?? "center")
          applyWidth(updatedNode.attrs)
          return true
        },

        destroy: () => {
          handle.removeEventListener("mousedown", onMouseDown)
          document.removeEventListener("mousemove", onMouseMove)
          document.removeEventListener("mouseup", onMouseUp)
          document.removeEventListener("click", onDocClick)
        },
      }
    }
  },
})


/* ---------------------------
   Slash menu
---------------------------- */

type SlashItem = {
  title: string
  description?: string
  keywords?: string[]
  command: (opts: { editor: Editor; range: { from: number; to: number } }) => void
}

function getSlashItems(editor: Editor, openImagePicker: () => void): SlashItem[] {
  return [
    {
      title: "Heading 1",
      keywords: ["h1", "title"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      keywords: ["h2", "subtitle"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      title: "Bulleted list",
      keywords: ["list", "ul"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      keywords: ["ol", "number"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "Quote",
      keywords: ["blockquote"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "Code block",
      keywords: ["code"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "Divider",
      keywords: ["hr", "divider"],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: "Image…",
      keywords: ["img", "photo", "picture"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        openImagePicker()
      },
    },
  ]
}

function createSlashCommand(openImagePicker: () => void) {
  return Extension.create({
    name: "slash-command",

    addProseMirrorPlugins() {
      let popup: HTMLDivElement | null = null
      let activeIndex = 0

      // ✅ 타입 문제 회피: SuggestionKeyDownProps에 없는 items/command를 직접 저장해서 사용
      let currentItems: SlashItem[] = []
      let currentCommand:
        | ((item: SlashItem) => void)
        | null = null

      const close = () => {
        popup?.remove()
        popup = null
        activeIndex = 0
        currentItems = []
        currentCommand = null
      }

      const render = (clientRect?: (() => DOMRect) | null) => {
        if (!clientRect) return
        const rect = clientRect()
        if (!rect) return

        if (!popup) {
          popup = document.createElement("div")
          popup.className =
            "fixed z-50 w-72 rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden"
          document.body.appendChild(popup)
        }

        popup.innerHTML = ""
        popup.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`
        popup.style.top = `${rect.bottom + 8}px`

        currentItems.forEach((item, idx) => {
          const row = document.createElement("button")
          row.type = "button"
          row.className =
            "w-full text-left px-3 py-2 hover:bg-neutral-900 transition flex flex-col"
          if (idx === activeIndex) row.classList.add("bg-neutral-900")

          const title = document.createElement("div")
          title.className = "text-sm text-white"
          title.textContent = item.title

          const desc = document.createElement("div")
          desc.className = "text-xs text-neutral-400"
          desc.textContent = item.description ?? ""

          row.appendChild(title)
          if (item.description) row.appendChild(desc)

          row.onclick = () => currentCommand?.(item)
          popup!.appendChild(row)
        })
      }

      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          startOfLine: false,
          allowSpaces: false,

          items: ({ query }) => {
            const all = getSlashItems(this.editor, openImagePicker)
            const q = query.toLowerCase().trim()
            if (!q) return all

            return all.filter((it) => {
              const hay = [it.title, ...(it.keywords ?? []), it.description ?? ""]
                .join(" ")
                .toLowerCase()
              return hay.includes(q)
            })
          },

          command: ({ editor, range, props }: any) => {
            // props는 SlashItem
            ;(props as SlashItem).command({ editor, range })
          },

          render: () => ({
            onStart: (props: any) => {
              activeIndex = 0
              currentItems = props.items as SlashItem[]
              currentCommand = (item: SlashItem) => props.command(item)
              render(props.clientRect)
            },
            onUpdate: (props: any) => {
              currentItems = props.items as SlashItem[]
              currentCommand = (item: SlashItem) => props.command(item)
              render(props.clientRect)
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (event.key === "Escape") {
                close()
                return true
              }
              if (event.key === "ArrowDown") {
                activeIndex = Math.min(activeIndex + 1, currentItems.length - 1)
                render(() => popup?.getBoundingClientRect() as DOMRect)
                return true
              }
              if (event.key === "ArrowUp") {
                activeIndex = Math.max(activeIndex - 1, 0)
                render(() => popup?.getBoundingClientRect() as DOMRect)
                return true
              }
              if (event.key === "Enter") {
                const item = currentItems[activeIndex]
                if (!item) return false
                currentCommand?.(item)
                close()
                return true
              }
              return false
            },
            onExit: () => close(),
          }),
        }),
      ]
    },
  })
}

/* ---------------------------
   Floating toolbar
---------------------------- */

function FloatingToolbar({
  editor,
  containerRef,
}: {
  editor: Editor
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [pos, setPos] = useState<{ x: number; y: number; show: boolean }>({
    x: 0,
    y: 0,
    show: false,
  })

  useEffect(() => {
    const update = () => {
      const sel = editor.state.selection
      if (sel.empty) {
        setPos((p) => ({ ...p, show: false }))
        return
      }

      const from = sel.from
      const to = sel.to
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)

      const box = containerRef.current?.getBoundingClientRect()
      if (!box) return

      const x = (start.left + end.right) / 2 - box.left
      const y = Math.min(start.top, end.top) - box.top - 12

      setPos({ x, y, show: true })
    }

    update()
    editor.on("selectionUpdate", update)
    editor.on("transaction", update)

    return () => {
      editor.off("selectionUpdate", update)
      editor.off("transaction", update)
    }
  }, [editor, containerRef])

  if (!pos.show) return null

  const onLink = () => {
    const prev = editor.getAttributes("link")?.href as string | undefined
    const url = window.prompt("Enter URL", prev ?? "https://")
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div
      className="absolute z-40 -translate-x-1/2 -translate-y-full"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg p-1">
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded hover:bg-neutral-900 ${
            editor.isActive("bold") ? "bg-neutral-900 text-white" : "text-neutral-300"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>

        <button
          type="button"
          className={`px-2 py-1 text-xs rounded hover:bg-neutral-900 ${
            editor.isActive("italic") ? "bg-neutral-900 text-white" : "text-neutral-300"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>

        <button
          type="button"
          className={`px-2 py-1 text-xs rounded hover:bg-neutral-900 ${
            editor.isActive("link") ? "bg-neutral-900 text-white" : "text-neutral-300"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onLink}
        >
          Link
        </button>
      </div>
    </div>
  )
}

/* ---------------------------
   Block "+" button
---------------------------- */

function BlockPlusButton({
  editor,
  containerRef,
  onOpen,
}: {
  editor: Editor
  containerRef: React.RefObject<HTMLDivElement | null>
  onOpen: () => void
}) {
  const [pos, setPos] = useState<{ x: number; y: number; show: boolean }>({
    x: 0,
    y: 0,
    show: false,
  })

  useEffect(() => {
    const update = () => {
      const sel = editor.state.selection
      if (!sel.empty) {
        setPos((p) => ({ ...p, show: false }))
        return
      }

      const box = containerRef.current?.getBoundingClientRect()
      if (!box) return

      const coords = editor.view.coordsAtPos(sel.from)
      const x = 12
      const y = coords.top - box.top + 6

      setPos({ x, y, show: true })
    }

    update()
    editor.on("selectionUpdate", update)
    editor.on("transaction", update)

    return () => {
      editor.off("selectionUpdate", update)
      editor.off("transaction", update)
    }
  }, [editor, containerRef])

  if (!pos.show) return null

  return (
    <button
      type="button"
      className="absolute z-30 w-7 h-7 rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900 hover:text-white transition flex items-center justify-center"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onOpen}
      aria-label="Insert block"
      title="Insert (/) "
    >
      +
    </button>
  )
}

/* ---------------------------
   Main Editor (final)
---------------------------- */

export default function NotionEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const openImagePicker = () => fileInputRef.current?.click()
  const SlashCommand = useMemo(() => createSlashCommand(openImagePicker), [])

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,
      Underline,
      Dropcursor,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      ResizableImage.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or drop an image…",
      }),
      SlashCommand,
    ],

    content,

    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[520px] px-10 py-6",
      },

      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const file = files[0]
        if (!file.type.startsWith("image/")) return false

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

  const openSlashMenuAtCursor = () => {
    editor.chain().focus().insertContent("/").run()
  }

  return (
    <div className="space-y-3">
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

        <div className="text-xs text-neutral-500">Drag & drop / Paste supported</div>
      </div>

      <div ref={containerRef} className="relative border border-neutral-800 rounded-xl bg-neutral-950">
        <FloatingToolbar editor={editor} containerRef={containerRef} />
        <BlockPlusButton editor={editor} containerRef={containerRef} onOpen={openSlashMenuAtCursor} />
        <EditorContent editor={editor} />
      </div>

      <div className="text-xs text-neutral-500">
        Tip: 이미지 클릭 후 오른쪽 아래 핸들을 드래그하면 크기 조절됩니다.
      </div>
    </div>
  )
}
