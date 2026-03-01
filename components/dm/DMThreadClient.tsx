// components/dm/DMThreadClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"

type Msg = {
  id: string
  body: string
  createdAt: string
  senderId: string
  optimistic?: boolean
}

export default function DMThreadClient({
  meId,
  threadId,
  otherName,
  initialMessages,
}: {
  meId: string
  threadId: string
  otherName: string
  initialMessages: Msg[]
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ (선택) 들어오자마자 read 처리 (미읽음 개선)
  useEffect(() => {
    fetch("/api/dm/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    }).catch(() => {})
  }, [threadId])

  const send = async () => {
    const body = text.trim()
    if (!body || busy) return

    setError(null)
    setBusy(true)
    setText("")

    // ✅ optimistic message 추가 (즉시 화면에 보이게)
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const optimisticMsg: Msg = {
      id: tempId,
      body,
      createdAt: new Date().toISOString(),
      senderId: meId,
      optimistic: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await fetch("/api/dm/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body }),
      })
      if (!res.ok) throw new Error("send failed")

      // ✅ 서버가 ok만 주는 MVP라면: optimistic 표시만 제거
      // (더 깔끔하려면 API가 message id/createdAt을 반환하게 만들면 됨)
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, optimistic: false } : m))
      )
    } catch (e) {
      // 실패하면 롤백
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setError("Failed to send. Please try again.")
      setText(body) // 다시 입력칸에 복구
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-6">
      <div>
        <div className="text-xs text-neutral-500">Conversation</div>
        <h1 className="text-2xl font-serif font-bold">{otherName}</h1>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-black/30 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-neutral-500 text-sm">No messages yet.</div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm border ${
                    mine
                      ? "bg-white text-black border-white"
                      : "bg-neutral-950 text-neutral-100 border-neutral-800"
                  } ${m.optimistic ? "opacity-70" : ""}`}
                >
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className={`mt-1 text-[11px] ${mine ? "text-black/60" : "text-neutral-500"}`}>
                    {new Date(m.createdAt).toLocaleString()}
                    {m.optimistic ? " · sending…" : ""}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none"
          placeholder="Write a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button
          className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-50"
          disabled={busy || !text.trim()}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  )
}