// components/profile/ProfileClient.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

  citationsReceived: number

  bookmarks: Array<{
    id: string
    createdAt: string
    post: { id: string; title: string; category: string; createdAt: string; views: number }
  }>

  citationsReceivedCount: number
  citationsGivenCount: number
  citationsItemsReceived: CitationReceivedItem[]
  citationsItemsGiven: CitationGivenItem[]

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

type BootDTO = {
  me: MeDTO
  counts: { posts: number; comments: number; votes: number; bookmarks: number; citations: number }
  citationsReceived: number
  citationsReceivedCount: number
  citationsGivenCount: number
  scoreCached: ScoreDTO | null
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim()
}

type ExtraTab = "roleRequest" | "admin"
type AnyTab = TabKey | ExtraTab

type LoadedTabs = {
  posts?: ActivityDTO["posts"]
  comments?: ActivityDTO["comments"]
  votes?: ActivityDTO["votes"]
  bookmarks?: ActivityDTO["bookmarks"]
  citationsReceivedItems?: CitationReceivedItem[]
  citationsGivenItems?: CitationGivenItem[]
}

export default function ProfileClient() {
  const { status } = useSession()

  const [meData, setMeData] = useState<MeDTO | null>(null)
  const [score, setScore] = useState<ScoreDTO | null>(null)

  // activity는 “전체”를 한 번에 안 가져오고, 탭별로 채워 넣는다
  const [activity, setActivity] = useState<ActivityDTO | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [tab, setTab] = useState<AnyTab>("posts")

  // 탭별 로딩/캐시
  const [tabLoading, setTabLoading] = useState(false)
  const loadedRef = useRef<LoadedTabs>({})
  const inflightRef = useRef<Record<string, Promise<any> | null>>({})

  const makeEmptyActivity = (boot: BootDTO): ActivityDTO => ({
    posts: [],
    comments: [],
    votes: [],
    bookmarks: [],
    citationsReceived: boot.citationsReceived ?? 0,

    citationsReceivedCount: boot.citationsReceivedCount ?? 0,
    citationsGivenCount: boot.citationsGivenCount ?? 0,

    citationsItemsReceived: [],
    citationsItemsGiven: [],
  })

  const loadBoot = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/profile/boot", { cache: "no-store" })
      if (res.status === 401) {
        setMeData(null)
        setActivity(null)
        setScore(null)
        return
      }
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed to load boot"))
      const boot = (await res.json()) as BootDTO

      setMeData(boot.me)
      setDisplayName(boot.me.profile?.displayName ?? "")
      setScore(boot.scoreCached ?? null)

      // activity 스켈레톤(카운트/요약만)
      setActivity(makeEmptyActivity(boot))

      // 첫 탭(posts)을 즉시 로드 (체감 속도 ↑)
      // 단, status authenticated 이후에만 호출되도록 useEffect에서 부름
      loadedRef.current = {}
      inflightRef.current = {}
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  const loadTabData = async (tabKey: AnyTab) => {
    // Extra tab들은 데이터 로딩 없음
    if (tabKey === "admin" || tabKey === "roleRequest") return
    if (!activity) return

    // 이미 로드된 탭이면 종료
    const loaded = loadedRef.current

    const mapToApiTab = (k: AnyTab) => {
      if (k === "posts") return "posts"
      if (k === "comments") return "comments"
      if (k === "votes") return "votes"
      if (k === "bookmarks") return "bookmarks"
      if (k === "citations") return "citations-received" // CitationsPanel이 내부에서 received/given을 나눠 로드
      return ""
    }

    const apiTab = mapToApiTab(tabKey)
    if (!apiTab) return

    // posts/comments/votes/bookmarks는 여기서 로드하고 activity에 반영
    if (tabKey !== "citations") {
      if ((tabKey === "posts" && loaded.posts) ||
          (tabKey === "comments" && loaded.comments) ||
          (tabKey === "votes" && loaded.votes) ||
          (tabKey === "bookmarks" && loaded.bookmarks)) return
    }

    // inflight 중복 방지
    if (inflightRef.current[apiTab]) return inflightRef.current[apiTab]!

    setTabLoading(true)
    setErr(null)

    const p = (async () => {
      const res = await fetch(`/api/profile/activity?tab=${encodeURIComponent(apiTab)}`, { cache: "no-store" })
      if (res.status === 401) throw new Error("Unauthorized")
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      const json = await res.json()

      // 탭별 반영
      if (tabKey === "posts") {
        loadedRef.current.posts = json.posts ?? []
        setActivity((prev) => (prev ? { ...prev, posts: loadedRef.current.posts! } : prev))
      } else if (tabKey === "comments") {
        loadedRef.current.comments = json.comments ?? []
        setActivity((prev) => (prev ? { ...prev, comments: loadedRef.current.comments! } : prev))
      } else if (tabKey === "votes") {
        loadedRef.current.votes = json.votes ?? []
        setActivity((prev) => (prev ? { ...prev, votes: loadedRef.current.votes! } : prev))
      } else if (tabKey === "bookmarks") {
        loadedRef.current.bookmarks = json.bookmarks ?? []
        setActivity((prev) => (prev ? { ...prev, bookmarks: loadedRef.current.bookmarks! } : prev))
      }
    })()
      .catch((e) => {
        setErr(e?.message ?? "Failed")
      })
      .finally(() => {
        inflightRef.current[apiTab] = null
        setTabLoading(false)
      })

    inflightRef.current[apiTab] = p
    return p
  }

  // CitationsPanel 내부에서 호출할 lazy loader
  const loadCitations = async (mode: "received" | "given") => {
    if (!activity) return

    const loaded = loadedRef.current
    const apiTab = mode === "received" ? "citations-received" : "citations-given"

    if (mode === "received" && loaded.citationsReceivedItems) return
    if (mode === "given" && loaded.citationsGivenItems) return

    if (inflightRef.current[apiTab]) return inflightRef.current[apiTab]!

    setTabLoading(true)
    setErr(null)

    const p = (async () => {
      const res = await fetch(`/api/profile/activity?tab=${encodeURIComponent(apiTab)}`, { cache: "no-store" })
      if (res.status === 401) throw new Error("Unauthorized")
      if (!res.ok) throw new Error(await res.text().catch(() => "Failed"))
      const json = await res.json()

      if (mode === "received") {
        loadedRef.current.citationsReceivedItems = json.citationsItemsReceived ?? []
        setActivity((prev) =>
          prev ? { ...prev, citationsItemsReceived: loadedRef.current.citationsReceivedItems! } : prev
        )
      } else {
        loadedRef.current.citationsGivenItems = json.citationsItemsGiven ?? []
        setActivity((prev) =>
          prev ? { ...prev, citationsItemsGiven: loadedRef.current.citationsGivenItems! } : prev
        )
      }
    })()
      .catch((e) => {
        setErr(e?.message ?? "Failed")
      })
      .finally(() => {
        inflightRef.current[apiTab] = null
        setTabLoading(false)
      })

    inflightRef.current[apiTab] = p
    return p
  }

  // boot + first tab load
  useEffect(() => {
    if (status === "authenticated") {
      ;(async () => {
        await loadBoot()
        // posts는 첫 화면에서 바로 보여주면 체감이 좋아서 선로딩
        // (meData/activity가 setState라 다음 tick에서 activity가 생기므로 약간 딜레이)
        setTimeout(() => {
          loadTabData("posts")
        }, 0)
      })()
    }

    if (status === "unauthenticated") {
      setLoading(false)
      setMeData(null)
      setActivity(null)
      setScore(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // 탭 바뀌면 그 탭 데이터만 로드
  useEffect(() => {
    if (status !== "authenticated") return
    if (!activity) return
    loadTabData(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activity, status])

  const counts = useMemo(() => {
    // counts는 boot에서 이미 내려오지만, 탭 로드 후 길이로도 맞춰주면 자연스럽게 동기화됨
    const citationsTotal =
      (activity?.citationsItemsReceived?.length ?? 0) + (activity?.citationsItemsGiven?.length ?? 0)

    return {
      posts: activity?.posts?.length ?? 0,
      comments: activity?.comments?.length ?? 0,
      votes: activity?.votes?.length ?? 0,
      bookmarks: activity?.bookmarks?.length ?? 0,
      citations: citationsTotal || ((activity?.citationsReceivedCount ?? 0) + (activity?.citationsGivenCount ?? 0)),
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
      await loadBoot()
      // 현재 탭 재로딩
      setTimeout(() => {
        loadTabData(tab)
        if (tab === "citations") {
          loadCitations("received")
        }
      }, 0)
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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">90-day score</div>
            <div className="text-xs text-neutral-500">{tabLoading ? "Updating..." : ""}</div>
          </div>

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

      {tabLoading && tab !== "admin" && tab !== "roleRequest" && (
        <div className="text-xs text-neutral-500">Loading tab...</div>
      )}

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

      {tab === "citations" && (
        <CitationsPanel
          received={activity.citationsItemsReceived}
          given={activity.citationsItemsGiven}
          receivedCount={activity.citationsReceivedCount}
          givenCount={activity.citationsGivenCount}
          loadCitations={loadCitations}
        />
      )}
    </div>
  )
}

function CitationsPanel({
  received,
  given,
  receivedCount,
  givenCount,
  loadCitations,
}: {
  received: CitationReceivedItem[]
  given: CitationGivenItem[]
  receivedCount: number
  givenCount: number
  loadCitations: (mode: "received" | "given") => Promise<any> | void
}) {
  const [mode, setMode] = useState<"received" | "given">("received")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // citations 탭 들어오면 received 먼저 로드
    ;(async () => {
      setLoading(true)
      try {
        await loadCitations("received")
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        await loadCitations(mode)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const list = mode === "received" ? received : given

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
            Received ({receivedCount || received.length})
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
            Given ({givenCount || given.length})
          </button>
        </div>

        <div className="text-xs text-neutral-500">{loading ? "Loading..." : ""}</div>
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