//app\news\write\WriteClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import NotionEditor from "@/components/NotionEditor"

type Props = {
  category: string
  editId?: string | null
}

type PostDTO = {
  id: string
  title: string
  content: string
  category: string
  attachments?: AttachmentDTO[]
}

type AttachmentDTO = {
  url: string
  fileName: string
  mimeType?: string | null
  size?: number | null
}

async function uploadFile(file: File): Promise<AttachmentDTO> {
  const fd = new FormData()
  fd.append("file", file)

  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error(await res.text().catch(() => "Upload failed"))

  const json = (await res.json()) as AttachmentDTO
  return json
}

function humanSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function WriteClient({ category, editId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const resolvedEditId = useMemo(() => editId ?? searchParams.get("edit"), [editId, searchParams])

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<AttachmentDTO[]>([])

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState<boolean>(!!resolvedEditId)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ✅ edit 로딩 시 attachments도 같이 불러오려면 /api/posts/[id]에서 select에 attachments 추가 필요(아래 4번 참고)
  useEffect(() => {
    let ignore = false
    if (!resolvedEditId) {
      setInitLoading(false)
      return
    }

    ;(async () => {
      try {
        setInitLoading(true)
        setErrorMsg(null)

        const res = await fetch(`/api/posts/${resolvedEditId}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load post")

        const post = (await res.json()) as PostDTO
        if (ignore) return

        setTitle(post.title ?? "")
        setContent(post.content ?? "")
        setAttachments(post.attachments ?? [])
      } catch {
        if (!ignore) setErrorMsg("Failed to load the post for editing.")
      } finally {
        if (!ignore) setInitLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [resolvedEditId])

  const insertAttachmentLinkToContent = (a: AttachmentDTO) => {
    // ✅ TipTap HTML로 “첨부 카드” 느낌의 링크를 삽입(간단하고 안전한 방식)
    const card = `
      <p>
        <a href="${a.url}" target="_blank" rel="noopener noreferrer">
          📎 ${escapeHtml(a.fileName)}${a.size ? ` (${humanSize(a.size)})` : ""}
        </a>
      </p>
    `
    setContent((prev) => (prev || "").trim().length ? `${prev}\n${card}` : card)
  }

  const onAddAttachment = async (file: File | null) => {
    if (!file) return
    setErrorMsg(null)
    try {
      setLoading(true)
      const uploaded = await uploadFile(file)
      setAttachments((prev) => [uploaded, ...prev])
      insertAttachmentLinkToContent(uploaded)
    } catch (e: any) {
      setErrorMsg(e?.message ?? "File upload failed.")
    } finally {
      setLoading(false)
    }
  }

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url))
    // (선택) 본문에서 링크 제거까지 자동으로 하려면 파싱 로직이 필요하니,
    //       지금은 “첨부 목록만 제거”로 두는 게 안전함.
  }

  const handleSave = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const url = resolvedEditId ? `/api/posts/${resolvedEditId}` : "/api/posts"
      const method = resolvedEditId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, attachments }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Save failed")
      }

      router.push(`/${category}`)
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save post."
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) return <div className="text-neutral-400 px-6 py-12">Loading editor...</div>

  return (
    <div className="max-w-4xl py-12 px-6 space-y-8">
      <input
        className="w-full text-4xl font-serif bg-transparent outline-none"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* ✅ 첨부 업로드 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 text-sm border border-neutral-800 rounded-lg hover:bg-neutral-900 cursor-pointer">
            Attach file
            <input
              type="file"
              className="hidden"
              // ✅ hwp는 브라우저마다 mime이 제각각이라 확장자 기반 업로드가 더 현실적
              accept=".pdf,.doc,.docx,.hwp,.txt,.md,.ppt,.pptx,.xls,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                e.currentTarget.value = ""
                void onAddAttachment(f)
              }}
              disabled={loading}
            />
          </label>
          <div className="text-xs text-neutral-500">
            PDF / Word / HWP / Office files supported (max 25MB)
          </div>
        </div>
      </div>

      {/* ✅ 첨부 목록 */}
      {attachments.length > 0 && (
        <div className="rounded-xl border border-neutral-900 bg-black/20 p-4 space-y-2">
          <div className="text-sm font-semibold">Attachments</div>
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.url} className="flex items-center justify-between gap-3">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-200 hover:underline truncate"
                >
                  📎 {a.fileName} <span className="text-neutral-500">{humanSize(a.size)}</span>
                </a>
                <button
                  type="button"
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => removeAttachment(a.url)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-500">
            Note: removing here won’t automatically remove the link inside the editor.
          </div>
        </div>
      )}

      <NotionEditor content={content} onChange={setContent} />

      {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-white text-black rounded-lg disabled:opacity-50"
        >
          {loading ? "Saving..." : resolvedEditId ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}