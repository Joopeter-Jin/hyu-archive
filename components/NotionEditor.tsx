// components/NotionEditor.tsx
"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { Extension } from "@tiptap/core"

import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Dropcursor from "@tiptap/extension-dropcursor"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Suggestion from "@tiptap/suggestion"
import Image from "@tiptap/extension-image"
import DragHandle from "@tiptap/extension-drag-handle"

interface Props {
  content?: string
  onChange?: (content: string) => void
}

type CitationSearchItem = {
  id: string
  title: string
  category: string
  createdAt: string
  author: {
    id: string
    name: string | null
    profile: { displayName: string | null } | null
  }
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

async function searchPostsForCitation(query: string): Promise<CitationSearchItem[]> {
  const q = query.trim()
  const url = `/api/posts/search?q=${encodeURIComponent(q)}&limit=8`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to search posts")
  return (await res.json()) as CitationSearchItem[]
}

/* ---------------------------
   Resizable Image Node
---------------------------- */

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null as number | null,
        parseHTML: (el) => {
          const w = el.getAttribute("data-width")
          return w ? Number(w) : null
        },
        renderHTML: (attrs) => (attrs.width ? { "data-width": String(attrs.width) } : {}),
      },
      widthPct: {
        default: null as number | null,
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
      rounded: {
        default: true as boolean,
        parseHTML: (el) => el.getAttribute("data-rounded") !== "false",
        renderHTML: (attrs) => ({ "data-rounded": String(attrs.rounded) }),
      },
      bordered: {
        default: true as boolean,
        parseHTML: (el) => el.getAttribute("data-bordered") !== "false",
        renderHTML: (attrs) => ({ "data-bordered": String(attrs.bordered) }),
      },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("figure")
      wrapper.className = "relative my-4 max-w-full"
      wrapper.style.display = "block"

      const applyAlign = (align: "left" | "center" | "right") => {
        wrapper.style.textAlign = align
      }

      const inner = document.createElement("div")
      inner.className = "relative inline-block max-w-full"

      const img = document.createElement("img")
      img.src = node.attrs.src
      img.draggable = false
      img.className = "block max-w-full h-auto select-none"

      const applyWidth = (attrs: any) => {
        if (attrs.widthPct) img.style.width = `${attrs.widthPct}%`
        else if (attrs.width) img.style.width = `${attrs.width}px`
        else img.style.width = "auto"
      }

      const applyDecor = (attrs: any) => {
        img.style.borderRadius = attrs.rounded ? "14px" : "0px"
        img.style.border = attrs.bordered ? "1px solid rgb(38 38 38)" : "none"
      }

      const setAttrs = (attrs: Record<string, any>) => {
        const pos = typeof getPos === "function" ? getPos() : null
        if (pos == null) return
        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
            return true
          })
          .run()
      }

      const delNode = () => {
        const pos = typeof getPos === "function" ? getPos() : null
        if (pos == null) return
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.delete(pos, pos + node.nodeSize)
            return true
          })
          .run()
      }

      const pop = document.createElement("div")
      pop.className =
        "hidden absolute left-2 top-2 z-20 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg p-2"
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

      const mkToggle = (label: string, getVal: () => boolean, setVal: (v: boolean) => void) => {
        const b = document.createElement("button")
        const render = () => {
          const on = getVal()
          b.textContent = `${label}: ${on ? "On" : "Off"}`
          b.className =
            "px-2 py-1 text-xs rounded-lg transition " +
            (on
              ? "bg-neutral-900 text-white border border-neutral-700"
              : "text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent")
        }
        b.type = "button"
        b.onmousedown = (e) => e.preventDefault()
        b.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          setVal(!getVal())
          render()
        }
        render()
        return b
      }

      const row1 = document.createElement("div")
      row1.className = "flex items-center gap-1"
      row1.appendChild(mkBtn("Left", () => setAttrs({ align: "left" })))
      row1.appendChild(mkBtn("Center", () => setAttrs({ align: "center" })))
      row1.appendChild(mkBtn("Right", () => setAttrs({ align: "right" })))
      pop.appendChild(row1)

      const row2 = document.createElement("div")
      row2.className = "mt-2 flex items-center gap-1"
      row2.appendChild(mkBtn("25%", () => setAttrs({ widthPct: 25, width: null })))
      row2.appendChild(mkBtn("50%", () => setAttrs({ widthPct: 50, width: null })))
      row2.appendChild(mkBtn("100%", () => setAttrs({ widthPct: 100, width: null })))
      pop.appendChild(row2)

      const row3 = document.createElement("div")
      row3.className = "mt-2 flex items-center gap-1"
      row3.appendChild(mkToggle("Round", () => !!node.attrs.rounded, (v) => setAttrs({ rounded: v })))
      row3.appendChild(mkToggle("Border", () => !!node.attrs.bordered, (v) => setAttrs({ bordered: v })))
      row3.appendChild(mkBtn("Delete", delNode))
      pop.appendChild(row3)

      const showPop = () => pop.classList.remove("hidden")
      const hidePop = () => pop.classList.add("hidden")

      inner.addEventListener("click", (e) => {
        e.stopPropagation()
        if (pop.classList.contains("hidden")) showPop()
        else hidePop()
      })

      const onDocClick = () => hidePop()
      document.addEventListener("click", onDocClick)

      const handle = document.createElement("div")
      handle.className =
        "absolute right-2 bottom-2 w-3 h-3 rounded-sm bg-white/80 cursor-se-resize shadow"
      handle.title = "Drag to resize"

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

      applyAlign(node.attrs.align ?? "center")
      applyWidth(node.attrs)
      applyDecor(node.attrs)

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
          applyDecor(updatedNode.attrs)
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
  keywords?: string[]
  command: (opts: { editor: Editor; range: { from: number; to: number } }) => void
}

function getSlashItems(
  editor: Editor,
  openImagePicker: () => void,
  openCitePicker: () => void
): SlashItem[] {
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
    {
      title: "Citation…",
      keywords: ["cite", "reference", "paper", "article"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        openCitePicker()
      },
    },
  ]
}

function createSlashCommand(
  openImagePicker: () => void,
  openCitePicker: () => void
) {
  return Extension.create({
    name: "slash-command",

    addProseMirrorPlugins() {
      let popup: HTMLDivElement | null = null
      let activeIndex = 0
      let currentItems: SlashItem[] = []
      let currentCommand: ((item: SlashItem) => void) | null = null

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
          row.className = "w-full text-left px-3 py-2 hover:bg-neutral-900 transition"
          if (idx === activeIndex) row.classList.add("bg-neutral-900")
          row.textContent = item.title
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
            const all = getSlashItems(this.editor, openImagePicker, openCitePicker)
            const q = query.toLowerCase().trim()
            if (!q) return all

            return all.filter((it) => {
              const hay = [it.title, ...(it.keywords ?? [])].join(" ").toLowerCase()
              return hay.includes(q)
            })
          },

          command: ({ editor, range, props }: any) => {
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
  containerRef: React.RefObject<HTMLDivElement>
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

      const box = containerRef.current.getBoundingClientRect()
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
  containerRef: React.RefObject<HTMLDivElement>
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

      const box = containerRef.current.getBoundingClientRect()
      const coords = editor.view.coordsAtPos(sel.from)

      const x = 10
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
   Citation picker
---------------------------- */

function CitationPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (item: CitationSearchItem) => void
}) {
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<CitationSearchItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let ignore = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const out = await searchPostsForCitation(q)
        if (!ignore) setItems(out)
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to search")
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    const t = setTimeout(run, 180)
    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [open, q])

  useEffect(() => {
    if (!open) {
      setQ("")
      setItems([])
      setError(null)
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-white">Cite post</div>
            <div className="mt-1 text-xs text-neutral-500">Search a post and insert it as a citation</div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search post titles..."
            className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm outline-none focus:border-neutral-600"
          />

          {loading && <div className="text-sm text-neutral-500">Searching...</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {!loading && items.length === 0 ? (
              <div className="rounded-xl border border-neutral-900 bg-black/20 p-4 text-sm text-neutral-500">
                No posts found.
              </div>
            ) : (
              items.map((item) => {
                const displayName =
                  item.author.profile?.displayName?.trim() ||
                  item.author.name?.trim() ||
                  "Unknown"

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="block w-full rounded-xl border border-neutral-900 bg-black/20 p-4 text-left transition hover:bg-neutral-900"
                  >
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {new Date(item.createdAt).toLocaleDateString()} · {item.category} · {displayName}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------
   Final NotionEditor
---------------------------- */

export default function NotionEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [citeOpen, setCiteOpen] = useState(false)

  const openImagePicker = () => fileInputRef.current?.click()
  const openCitePicker = () => setCiteOpen(true)

  const SlashCommand = useMemo(
    () => createSlashCommand(openImagePicker, openCitePicker),
    []
  )

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,
      Underline,
      Dropcursor,

      DragHandle.configure({
        render() {
          const el = document.createElement("div")
          el.className =
            "tt-drag-handle opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-white"
          el.textContent = "⋮⋮"
          return el
        },
      }),

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
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[520px] px-12 py-6",
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

  const insertCitation = (item: CitationSearchItem) => {
    if (!editor) return

    const href = `/post/${item.id}`
    const title = escapeHtml(item.title)

    const { from, to, empty } = editor.state.selection

    if (!empty) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href,
          "data-citation": "true",
        } as any)
        .run()
      setCiteOpen(false)
      return
    }

    const html = `<p><a href="${href}" data-citation="true">${title}</a></p>`

    editor
      .chain()
      .focus()
      .insertContent(html)
      .run()

    setCiteOpen(false)
  }

  const lastContentRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!editor) return
    if (typeof content !== "string") return
    if (lastContentRef.current === content) return

    const current = editor.getHTML()
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
    lastContentRef.current = content
  }, [editor, content])

  const onPickImage = async (f: File | null) => {
    if (!f) return
    try {
      const url = await uploadToServer(f)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch {
      alert("Image upload failed")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openSlashMenuAtCursor = () => {
    editor?.chain().focus().insertContent("/").run()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="px-3 py-1 text-sm border border-neutral-800 rounded hover:bg-neutral-900"
          onClick={openImagePicker}
        >
          Insert image
        </button>

        <button
          type="button"
          className="px-3 py-1 text-sm border border-neutral-800 rounded hover:bg-neutral-900"
          onClick={openCitePicker}
        >
          Cite post
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

      <div
        ref={containerRef}
        className="relative border border-neutral-800 rounded-xl bg-neutral-950 group"
      >
        {editor && containerRef.current && (
          <>
            <FloatingToolbar editor={editor} containerRef={containerRef as React.RefObject<HTMLDivElement>} />
            <BlockPlusButton
              editor={editor}
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
              onOpen={openSlashMenuAtCursor}
            />
          </>
        )}

        <EditorContent editor={editor} />
      </div>

      <div className="text-xs text-neutral-500">
        Tip: use “Cite post” or “/citation” to insert internal references. 이미지 클릭 → 프리셋/정렬/삭제. 오른쪽 아래 핸들 드래그 → 자유 리사이즈.
      </div>

      <CitationPickerModal
        open={citeOpen}
        onClose={() => setCiteOpen(false)}
        onSelect={insertCitation}
      />

      <style jsx global>{`
        .tt-drag-handle {
          position: absolute;
          left: 12px;
          transform: translateY(2px);
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          user-select: none;
          z-index: 10;
        }
        .tt-drag-handle:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}