// components/comments/Comments.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import VoteButtons from "@/components/votes/VoteButtons"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type CommentNode = {
  id: string
  postId: string
  parentId: string | null
  content: string
  isDeleted: boolean
  deletedAt: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    image: string | null
    profile: { displayName: string; role: Role } | null
  }
  replies: CommentNode[]
}

function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "PROFESSOR":
      return "Professor"
    case "GRAD":
      return "Graduate"
    case "CONTRIBUTOR":
      return "Contributor"
    default:
      return "User"
  }
}

export default function Comments({ postId }: { postId: string }) {
  const { data: session, status } = useSession()
  const myId = (session?.user as any)?.id as string | undefined

  const [tree, setTree] = useState<CommentNode[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newText, setNewText] = useState("")

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load comments")
      const data = (await res.json()) as CommentNode[]
      setTree(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [postId])

  const onCreate = async (content: string, parentId: string | null) => {
    if (!content.trim()) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Failed to create comment")
      }
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to create comment")
    } finally {
      setPosting(false)
    }
  }

  const onDelete = async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Failed to delete comment")
      }
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete comment")
    }
  }

  const count = useMemo(() => {
    const walk = (nodes: CommentNode[]): number =>
      nodes.reduce((acc, n) => acc + 1 + walk(n.replies ?? []), 0)
    return walk(tree)
  }, [tree])

  return (
    <section className="mt-10 border-t border-neutral-900 pt-8">
      <h2 className="text-lg font-semibold">Comments {count}</h2>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        {status !== "authenticated" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-neutral-400">Please login to leave comments</div>
            <button
              className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
              onClick={() => signIn("google")}
            >
              Login with Google
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              className="w-full min-h-[90px] resize-y rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 outline-none text-sm"
              placeholder="Write your comment..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
                disabled={posting || !newText.trim()}
                onClick={async () => {
                  const txt = newText
                  setNewText("")
                  await onCreate(txt, null)
                }}
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-sm text-neutral-400">Loading comments...</div>
        ) : tree.length === 0 ? (
          <div className="text-sm text-neutral-500">No comments yet.</div>
        ) : (
          tree.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              myId={myId}
              canReply={status === "authenticated"}
              onReply={onCreate}
              onDelete={onDelete}
              depth={0}
            />
          ))
        )}
      </div>
    </section>
  )
}

function CommentItem({
  node,
  myId,
  canReply,
  onReply,
  onDelete,
  depth,
}: any) {
  const displayName = node.author.profile?.displayName ?? node.author.name ?? "Anonymous"
  const role = node.author.profile?.role ?? "USER"
  const mine = myId && node.authorId === myId

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-2" style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div className="rounded-xl border border-neutral-900 bg-black/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white">{displayName}</div>
            <div className="text-xs text-neutral-500">
              {roleLabel(role)} · {new Date(node.createdAt).toLocaleString()}
            </div>
          </div>

          <VoteButtons type="COMMENT" targetId={node.id} />
        </div>

        <div className="mt-2 text-sm leading-6">
          {node.isDeleted ? (
            <span className="text-neutral-500">(This comment has been deleted)</span>
          ) : (
            <span className="text-neutral-100 whitespace-pre-wrap">{node.content}</span>
          )}
        </div>

        <div className="mt-3 flex gap-3">
          {canReply && (
            <button
              className="text-xs text-neutral-300 hover:text-white"
              onClick={() => setReplyOpen((v) => !v)}
            >
              Reply
            </button>
          )}

          {mine && !node.isDeleted && (
            <button
              className="text-xs text-red-400 hover:text-red-300"
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this comment? Replies will remain.")) return
                setBusy(true)
                try {
                  await onDelete(node.id)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
            >
              {busy ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {replyOpen && canReply && (
          <div className="mt-3 space-y-2">
            <textarea
              className="w-full min-h-[70px] resize-y rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 outline-none text-sm"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border border-neutral-800 text-sm"
                onClick={() => {
                  setReplyOpen(false)
                  setReplyText("")
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
                disabled={!replyText.trim()}
                onClick={async () => {
                  const txt = replyText
                  setReplyText("")
                  setReplyOpen(false)
                  await onReply(txt, node.id)
                }}
              >
                Post Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {node.replies?.length > 0 && (
        <div className="space-y-3">
          {node.replies.map((r: any) => (
            <CommentItem
              key={r.id}
              node={r}
              myId={myId}
              canReply={canReply}
              onReply={onReply}
              onDelete={onDelete}
              depth={Math.min(depth + 1, 6)}
            />
          ))}
        </div>
      )}
    </div>
  )
}