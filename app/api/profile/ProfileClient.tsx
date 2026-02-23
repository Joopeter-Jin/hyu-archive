"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import RoleBadge from "@/components/profile/RoleBadge"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type MeDTO = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  profile: { displayName: string; role: Role; updatedAt: string } | null
  _count: { posts: number; comments: number; votes: number }
}

type PostItem = { id: string; title: string; category: string; createdAt: string; views: number }
type CommentItem = {
  id: string
  postId: string
  parentId: string | null
  content: string
  isDeleted: boolean
  createdAt: string
  post: { id: string; title: string; category: string }
}
type VoteItem = {
  id: string
  value: "UP" | "DOWN"
  createdAt: string
  postId: string | null
  commentId: string | null
  post: { id: string; title: string; category: string } | null
  comment: {
    id: string
    postId: string
    parentId: string | null
    isDeleted: boolean
    content: string
    post: { id: string; title: string; category: string }
  } | null
}

function stripHtml(html: string, max = 120) {
  const txt = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  return txt.length > max ? txt.slice(0, max) + "…" : txt
}

export default function ProfileClient() {
  const { data: session, status } = useSession()
  const myId = (session?.user as any)?.id as string | undefined

  const [me, setMe] = useState<MeDTO | null>(null)
  const [tab, setTab] = useState<"posts" | "comments" | "votes">("posts")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")

  const loadMe = async () => {
    const res = await fetch("/api/profile", { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load profile")
    const data = (await res.json()) as MeDTO
    setMe(data)
    setDisplayName(data.profile?.displayName ?? "")
  }

  const loadTab = async (t: typeof tab) => {
    const res = await fetch(`/api/profile/activity?tab=${t}&take=20`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load activity")
    const data = (await res.json()) as { tab: string; items: any[] }
    setItems(data.items ?? [])
  }

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        if (status !== "authenticated") return
        await loadMe()
        await loadTab(tab)
        if (ignore) return
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to load")
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tab])

  const onSaveDisplayName = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "")
        throw new Error(msg || "Failed to update display name")
      }
      await loadMe()
    } catch (e: any) {
      setError(e?.message ?? "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="text-neutral-300">Please login to view your profile.</div>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-white text-black"
          onClick={() => signIn("google")}
        >
          Login with Google
        </button>
      </div>
    )
  }

  if (loading) return <div className="text-neutral-400">Loading profile...</div>

  const role = me?.profile?.role ?? "USER"

  return (
    <div className="space-y-8">
      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Header card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {me?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.image} alt="avatar" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-neutral-800" />
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-white">
                  {me?.profile?.displayName || me?.name || "Anonymous"}
                </div>
                <RoleBadge role={role} />
              </div>

              <div className="text-xs text-neutral-500">
                {me?.email ?? ""} · Joined {me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : ""}
              </div>

              <div className="text-xs text-neutral-500">
                Posts {me?._count.posts ?? 0} · Comments {me?._count.comments ?? 0} · Votes{" "}
                {me?._count.votes ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* displayName editor */}
        <div className="mt-6 flex flex-col gap-2">
          <div className="text-sm text-neutral-300">Display name</div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
              placeholder="Set your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
              onClick={onSaveDisplayName}
              disabled={saving || displayName.trim().length < 2}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="text-xs text-neutral-600">2–24 characters. Must be unique.</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          My Posts
        </TabButton>
        <TabButton active={tab === "comments"} onClick={() => setTab("comments")}>
          My Comments
        </TabButton>
        <TabButton active={tab === "votes"} onClick={() => setTab("votes")}>
          My Votes
        </TabButton>
      </div>

      {/* List */}
      <div className="space-y-3">
        {tab === "posts" &&
          (items as PostItem[]).map((p) => (
            <a
              key={p.id}
              href={`/post/${p.id}`}
              className="block rounded-xl border border-neutral-900 bg-black/30 p-4 hover:bg-black/40 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-medium">{p.title}</div>
                <div className="text-xs text-neutral-500">views {p.views}</div>
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {p.category} · {new Date(p.createdAt).toLocaleString()}
              </div>
            </a>
          ))}

        {tab === "comments" &&
          (items as CommentItem[]).map((c) => (
            <a
              key={c.id}
              href={`/post/${c.postId}`}
              className="block rounded-xl border border-neutral-900 bg-black/30 p-4 hover:bg-black/40 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-200">
                  On <span className="text-white">{c.post.title}</span>
                  {c.parentId ? <span className="text-xs text-neutral-500"> · reply</span> : null}
                </div>
                <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>
              </div>

              <div className="mt-2 text-sm text-neutral-300">
                {c.isDeleted ? "(This comment has been deleted)" : stripHtml(c.content)}
              </div>
            </a>
          ))}

        {tab === "votes" &&
          (items as VoteItem[]).map((v) => {
            const label = v.value === "UP" ? "Upvoted" : "Downvoted"
            if (v.postId && v.post) {
              return (
                <a
                  key={v.id}
                  href={`/post/${v.post.id}`}
                  className="block rounded-xl border border-neutral-900 bg-black/30 p-4 hover:bg-black/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-200">
                      {label} post: <span className="text-white">{v.post.title}</span>
                    </div>
                    <div className="text-xs text-neutral-500">{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{v.post.category}</div>
                </a>
              )
            }

            if (v.commentId && v.comment) {
              return (
                <a
                  key={v.id}
                  href={`/post/${v.comment.postId}`}
                  className="block rounded-xl border border-neutral-900 bg-black/30 p-4 hover:bg-black/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-200">
                      {label} comment on <span className="text-white">{v.comment.post.title}</span>
                      {v.comment.parentId ? <span className="text-xs text-neutral-500"> · reply</span> : null}
                    </div>
                    <div className="text-xs text-neutral-500">{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">
                    {v.comment.isDeleted ? "(This comment has been deleted)" : stripHtml(v.comment.content)}
                  </div>
                </a>
              )
            }

            return null
          })}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-lg border text-sm transition " +
        (active
          ? "bg-neutral-900 border-neutral-700 text-white"
          : "border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white")
      }
    >
      {children}
    </button>
  )
}