// components/profile/ProfileClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import RoleBadge from "@/components/profile/RoleBadge"
import ProfileTabs, { type TabKey } from "@/components/profile/ProfileTabs"
import ProfileListItem from "@/components/profile/ProfileListItem"
import AdminPanel from "@/components/profile/AdminPanel"
import RoleRequestClient from "@/components/profile/RoleRequestClient"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type MeDTO = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  profile: { displayName: string; role: Role; createdAt: string; updatedAt: string } | null
}

type ActivityDTO = {
  posts: Array<{ id: string; title: string; category: string; createdAt: string; views: number }>
  comments: Array<{
    id: string
    postId: string
    parentId: string | null
    content: string
    createdAt: string
    updatedAt: string
    isDeleted: boolean
    post: { id: string; title: string; category: string }
  }>
  votes: Array<{
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
      content: string
      post: { id: string; title: string; category: string }
    } | null
  }>
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim()
}

type ExtraTab = "roleRequest" | "admin"
type AnyTab = TabKey | ExtraTab

export default function ProfileClient() {
  const { status } = useSession()

  const [meData, setMeData] = useState<MeDTO | null>(null)
  const [activity, setActivity] = useState<ActivityDTO | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [tab, setTab] = useState<AnyTab>("posts")

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const [meRes, actRes] = await Promise.all([
        fetch("/api/profile/me", { cache: "no-store" }),
        fetch("/api/profile/activity", { cache: "no-store" }),
      ])

      if (meRes.status === 401 || actRes.status === 401) {
        setMeData(null)
        setActivity(null)
        return
      }
      if (!meRes.ok) throw new Error(await meRes.text().catch(() => "Failed to load profile"))
      if (!actRes.ok) throw new Error(await actRes.text().catch(() => "Failed to load activity"))

      const meJson = (await meRes.json()) as MeDTO
      const actJson = (await actRes.json()) as ActivityDTO

      setMeData(meJson)
      setActivity(actJson)
      setDisplayName(meJson.profile?.displayName ?? "")
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") load()
    if (status === "unauthenticated") {
      setLoading(false)
      setMeData(null)
      setActivity(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const counts = useMemo(() => {
    return {
      posts: activity?.posts?.length ?? 0,
      comments: activity?.comments?.length ?? 0,
      votes: activity?.votes?.length ?? 0,
    }
  }, [activity])

  const onSaveDisplayName = async () => {
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch("/api/profile/handle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Failed to save display name")
      }
      await load() // ✅ 저장 후 다시 불러와서 반영
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-neutral-400">Loading profile...</div>

  if (status !== "authenticated") {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8">
        <div className="text-lg font-semibold">Profile</div>
        <div className="mt-2 text-sm text-neutral-400">Please login to view your profile.</div>
        <button
          className="mt-6 px-4 py-2 rounded-lg bg-white text-black text-sm"
          onClick={() => signIn("google")}
        >
          Login with Google
        </button>
      </div>
    )
  }

  if (!meData || !activity) return <div className="text-sm text-red-400">Failed to load profile.</div>

  const role: Role = meData.profile?.role ?? "USER"
  const isAdmin = role === "ADMIN"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {meData.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meData.image}
              alt="avatar"
              className="w-12 h-12 rounded-full border border-neutral-800"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900" />
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {meData.profile?.displayName ?? meData.name ?? "User"}
              </div>
              <RoleBadge role={role} />
            </div>
            <div className="text-xs text-neutral-500">
              {meData.email ?? ""} {meData.profile ? "" : "· (Set your display name below)"}
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="text-sm text-neutral-300 hover:text-white border border-neutral-800 rounded-lg px-3 py-1.5 hover:bg-neutral-900"
        >
          Home
        </Link>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}

      {/* Display name editor */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-3">
        <div className="text-sm font-semibold">Display name</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 rounded-lg bg-black border border-neutral-800 px-3 py-2 outline-none text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="2~20 chars"
          />
          <button
            className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
            onClick={onSaveDisplayName}
            disabled={saving || !displayName.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <div className="text-xs text-neutral-500">This name will be shown on posts/comments.</div>
      </div>

      {/* Tabs row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ProfileTabs active={tab as TabKey} onChange={setTab as any} counts={counts} />

        <div className="flex gap-2">
          {/* ✅ 유저 전용: Role Request */}
          <button
            className={
              "text-sm border rounded-lg px-3 py-1.5 transition " +
              (tab === "roleRequest"
                ? "border-neutral-600 text-white"
                : "border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900")
            }
            onClick={() => setTab("roleRequest")}
          >
            Role Request
          </button>

          {/* ✅ 관리자 전용: Admin Panel */}
          {isAdmin && (
            <button
              className={
                "text-sm border rounded-lg px-3 py-1.5 transition " +
                (tab === "admin"
                  ? "border-neutral-600 text-white"
                  : "border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900")
              }
              onClick={() => setTab("admin")}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>

      {/* ✅ Role Request (유저 화면) */}
      {tab === "roleRequest" && <RoleRequestClient />}

      {/* ✅ Admin Panel (관리자 화면) */}
      {tab === "admin" && isAdmin && <AdminPanel />}

      {/* Posts */}
      {tab === "posts" && (
        <div className="space-y-3">
          {activity.posts.length === 0 ? (
            <div className="text-sm text-neutral-500">No posts yet.</div>
          ) : (
            activity.posts.map((p) => (
              <ProfileListItem
                key={p.id}
                title={p.title}
                href={`/post/${p.id}`}
                meta={`${new Date(p.createdAt).toLocaleString()} · ${p.category} · views ${p.views}`}
              />
            ))
          )}
        </div>
      )}

      {/* Comments */}
      {tab === "comments" && (
        <div className="space-y-3">
          {activity.comments.length === 0 ? (
            <div className="text-sm text-neutral-500">No comments yet.</div>
          ) : (
            activity.comments.map((c) => (
              <ProfileListItem
                key={c.id}
                title={c.isDeleted ? "(Deleted comment)" : stripHtml(c.content).slice(0, 120) || "(empty)"}
                href={`/post/${c.postId}`}
                meta={`${new Date(c.createdAt).toLocaleString()} · on "${c.post.title}" · ${
                  c.parentId ? "Reply" : "Comment"
                }`}
                right={
                  <span className="text-xs text-neutral-500 border border-neutral-800 rounded-lg px-2 py-1">
                    {c.parentId ? "Reply" : "Comment"}
                  </span>
                }
              />
            ))
          )}
        </div>
      )}

      {/* Votes */}
      {tab === "votes" && (
        <div className="space-y-3">
          {activity.votes.length === 0 ? (
            <div className="text-sm text-neutral-500">No votes yet.</div>
          ) : (
            activity.votes.map((v) => {
              const isPost = !!v.postId
              const title = isPost
                ? v.post?.title ?? "(Post)"
                : stripHtml(v.comment?.content ?? "").slice(0, 120) || "(Comment)"
              const href = isPost ? `/post/${v.postId}` : `/post/${v.comment?.postId ?? ""}`
              const meta = `${new Date(v.createdAt).toLocaleString()} · ${isPost ? "Post" : "Comment"} · ${
                v.value === "UP" ? "Upvote" : "Downvote"
              }`

              return (
                <ProfileListItem
                  key={v.id}
                  title={title}
                  href={href}
                  meta={meta}
                  right={
                    <span className="text-xs rounded-lg px-2 py-1 border border-neutral-700 text-neutral-200">
                      {v.value === "UP" ? "UP" : "DOWN"}
                    </span>
                  }
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}