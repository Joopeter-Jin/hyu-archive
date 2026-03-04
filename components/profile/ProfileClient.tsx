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
import MeritBadges from "@/components/profile/MeritBadges"

type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

type MeDTO = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  profile: {
    displayName: string
    role: Role
    contributorLevel: number
    createdAt: string
    updatedAt: string
  } | null
}

type CitationReceivedItem = {
  id: string
  createdAt: string
  fromPost: {
    id: string
    title: string
    category: string
    createdAt: string
    author: { id: string; displayName: string; role: Role; contributorLevel: number }
  }
  toPost: { id: string; title: string; category: string }
}

type CitationGivenItem = {
  id: string
  createdAt: string
  fromPost: { id: string; title: string; category: string; createdAt: string }
  toPost: {
    id: string
    title: string
    category: string
    createdAt: string
    author: { id: string; displayName: string; role: Role; contributorLevel: number }
  }
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

  // legacy summary
  citationsReceived: number

  // bookmarks
  bookmarks: Array<{
    id: string
    createdAt: string
    post: { id: string; title: string; category: string; createdAt: string; views: number }
  }>

  // citations (new: both)
  citationsReceivedCount: number
  citationsGivenCount: number
  citationsItemsReceived: CitationReceivedItem[]
  citationsItemsGiven: CitationGivenItem[]

  // (optional legacy field, keep safe)
  citationsItems?: CitationReceivedItem[]
}

type ScoreDTO = {
  activity: number
  impact: number
  scholarly: number
  total: number
  contributorLevel: number
  coreCandidate: boolean
  breakdown: {
    posts90d: number
    comments90d: number
    reactions90d: { like: number; bookmark: number }
    citationsReceived90d: number
    endorsements90d: { professor: number; grad: number; negative: number }
    archivePicks90d: number
    diversityCategoriesCount: number
  }
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
  const [score, setScore] = useState<ScoreDTO | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [tab, setTab] = useState<AnyTab>("posts")

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const [meRes, actRes, scoreRes] = await Promise.all([
        fetch("/api/profile/me", { cache: "no-store" }),
        fetch("/api/profile/activity", { cache: "no-store" }),
        fetch("/api/profile/score", { cache: "no-store" }),
      ])

      if (meRes.status === 401 || actRes.status === 401) {
        setMeData(null)
        setActivity(null)
        setScore(null)
        return
      }

      if (!meRes.ok) throw new Error(await meRes.text().catch(() => "Failed to load profile"))
      if (!actRes.ok) throw new Error(await actRes.text().catch(() => "Failed to load activity"))

      const meJson = (await meRes.json()) as MeDTO
      const actJsonRaw = (await actRes.json()) as any

      // ✅ 안전 기본값 + 레거시 호환
      const receivedItems: CitationReceivedItem[] =
        actJsonRaw.citationsItemsReceived ??
        actJsonRaw.citationsItems ??
        []

      const givenItems: CitationGivenItem[] =
        actJsonRaw.citationsItemsGiven ??
        []

      const actJson: ActivityDTO = {
        posts: actJsonRaw.posts ?? [],
        comments: actJsonRaw.comments ?? [],
        votes: actJsonRaw.votes ?? [],
        citationsReceived: actJsonRaw.citationsReceived ?? receivedItems.length ?? 0,

        bookmarks: actJsonRaw.bookmarks ?? [],

        citationsReceivedCount: actJsonRaw.citationsReceivedCount ?? actJsonRaw.citationsReceived ?? receivedItems.length ?? 0,
        citationsGivenCount: actJsonRaw.citationsGivenCount ?? actJsonRaw.citationsGiven ?? givenItems.length ?? 0,

        citationsItemsReceived: receivedItems,
        citationsItemsGiven: givenItems,

        citationsItems: actJsonRaw.citationsItems ?? undefined,
      }

      let scoreJson: ScoreDTO | null = null
      if (scoreRes.ok) scoreJson = (await scoreRes.json()) as ScoreDTO

      setMeData(meJson)
      setActivity(actJson)
      setScore(scoreJson)
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
      setScore(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const counts = useMemo(() => {
    const citationsTotal =
      (activity?.citationsItemsReceived?.length ?? 0) + (activity?.citationsItemsGiven?.length ?? 0)

    return {
      posts: activity?.posts?.length ?? 0,
      comments: activity?.comments?.length ?? 0,
      votes: activity?.votes?.length ?? 0,
      bookmarks: activity?.bookmarks?.length ?? 0,
      citations: citationsTotal,
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
      await load()
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
        <button className="mt-6 px-4 py-2 rounded-lg bg-white text-black text-sm" onClick={() => signIn("google")}>
          Login with Google
        </button>
      </div>
    )
  }

  if (!meData || !activity) return <div className="text-sm text-red-400">Failed to load profile.</div>

  const role: Role = meData.profile?.role ?? "USER"
  const isAdmin = role === "ADMIN"

  const level = score?.contributorLevel ?? meData.profile?.contributorLevel ?? 0
  const coreCandidate = score?.coreCandidate ?? false

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {meData.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meData.image} alt="avatar" className="w-12 h-12 rounded-full border border-neutral-800" />
          ) : (
            <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900" />
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{meData.profile?.displayName ?? meData.name ?? "User"}</div>
              <RoleBadge role={role} contributorLevel={level} coreCandidate={coreCandidate} />
            </div>

            <div className="text-xs text-neutral-500">
              {meData.email ?? ""} {meData.profile ? "" : "· (Set your display name below)"}
            </div>

            <div className="text-xs text-neutral-500">Citations received: {activity.citationsReceived ?? 0}</div>

            {coreCandidate && level < 5 && (
              <div className="text-xs text-emerald-400">Lv5 Core Candidate (awaiting ADMIN approval)</div>
            )}
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

      {score && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <div className="text-sm font-semibold">90-day score</div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreBox label="Total" value={score.total} />
            <ScoreBox label="Activity" value={score.activity} />
            <ScoreBox label="Impact" value={score.impact} />
            <ScoreBox label="Scholarly" value={score.scholarly} />
          </div>

          <div className="text-xs text-neutral-500 space-y-1">
            <div>
              posts: {score.breakdown.posts90d}, comments: {score.breakdown.comments90d}, diversity:{" "}
              {score.breakdown.diversityCategoriesCount}
            </div>
            <div>
              reactions: ❤️ {score.breakdown.reactions90d.like} / 🔖 {score.breakdown.reactions90d.bookmark}
            </div>
            <div>
              citations received: {score.breakdown.citationsReceived90d}, archive picks: {score.breakdown.archivePicks90d}
            </div>
            <div>
              endorsements (P/G/N): {score.breakdown.endorsements90d.professor}/{score.breakdown.endorsements90d.grad}/
              {score.breakdown.endorsements90d.negative}
            </div>
          </div>
        </div>
      )}

      <MeritBadges />

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

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ProfileTabs active={tab as any} onChange={setTab as any} counts={counts as any} />

        <div className="flex gap-2">
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

      {tab === "roleRequest" && <RoleRequestClient />}
      {tab === "admin" && isAdmin && <AdminPanel />}

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
                meta={`${new Date(c.createdAt).toLocaleString()} · on "${c.post.title}" · ${c.parentId ? "Reply" : "Comment"}`}
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

      {tab === "bookmarks" && (
        <div className="space-y-3">
          {activity.bookmarks.length === 0 ? (
            <div className="text-sm text-neutral-500">No bookmarks yet.</div>
          ) : (
            activity.bookmarks.map((b) => (
              <ProfileListItem
                key={b.id}
                title={b.post.title}
                href={`/post/${b.post.id}`}
                meta={`Bookmarked at ${new Date(b.createdAt).toLocaleString()} · ${b.post.category} · views ${b.post.views}`}
                right={<span className="text-xs rounded-lg px-2 py-1 border border-neutral-700 text-neutral-200">🔖</span>}
              />
            ))
          )}
        </div>
      )}

      {/* ✅✅✅ Citations 탭: Received / Given 2단 토글 */}
      {tab === "citations" && (
        <CitationsPanel received={activity.citationsItemsReceived} given={activity.citationsItemsGiven} />
      )}
    </div>
  )
}

function CitationsPanel({
  received,
  given,
}: {
  received: CitationReceivedItem[]
  given: CitationGivenItem[]
}) {
  const [mode, setMode] = useState<"received" | "given">("received")
  const list = mode === "received" ? received : given

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("received")}
          className={
            "text-sm border rounded-lg px-3 py-1.5 transition " +
            (mode === "received"
              ? "border-neutral-600 text-white"
              : "border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900")
          }
        >
          Received ({received.length})
        </button>
        <button
          type="button"
          onClick={() => setMode("given")}
          className={
            "text-sm border rounded-lg px-3 py-1.5 transition " +
            (mode === "given"
              ? "border-neutral-600 text-white"
              : "border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900")
          }
        >
          Given ({given.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-sm text-neutral-500">No citations yet.</div>
      ) : (
        list.map((c: any) => (
          <div key={c.id} className="rounded-xl border border-neutral-900 bg-black/30 p-4">
            <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>

            {mode === "received" ? (
              <>
                <div className="mt-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">Cited your post: </span>
                  <Link href={`/post/${c.toPost.id}`} className="hover:underline text-white">
                    {c.toPost.title}
                  </Link>
                  <span className="text-neutral-600"> · {c.toPost.category}</span>
                </div>

                <div className="mt-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">From: </span>
                  <Link href={`/post/${c.fromPost.id}`} className="hover:underline text-white">
                    {c.fromPost.title}
                  </Link>
                  <span className="text-neutral-600"> · {c.fromPost.category}</span>
                </div>

                <div className="mt-2 text-xs text-neutral-500">
                  by{" "}
                  <Link href={`/u/${c.fromPost.author.id}`} className="hover:underline text-neutral-200">
                    {c.fromPost.author.displayName}
                  </Link>
                  <span className="ml-2">
                    <RoleBadge role={c.fromPost.author.role} contributorLevel={c.fromPost.author.contributorLevel} />
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">You cited from: </span>
                  <Link href={`/post/${c.fromPost.id}`} className="hover:underline text-white">
                    {c.fromPost.title}
                  </Link>
                  <span className="text-neutral-600"> · {c.fromPost.category}</span>
                </div>

                <div className="mt-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">To: </span>
                  <Link href={`/post/${c.toPost.id}`} className="hover:underline text-white">
                    {c.toPost.title}
                  </Link>
                  <span className="text-neutral-600"> · {c.toPost.category}</span>
                </div>

                <div className="mt-2 text-xs text-neutral-500">
                  author{" "}
                  <Link href={`/u/${c.toPost.author.id}`} className="hover:underline text-neutral-200">
                    {c.toPost.author.displayName}
                  </Link>
                  <span className="ml-2">
                    <RoleBadge role={c.toPost.author.role} contributorLevel={c.toPost.author.contributorLevel} />
                  </span>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}