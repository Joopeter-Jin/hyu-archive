// app/u/[id]/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import RoleBadge from "@/components/profile/RoleBadge"
import DMStartButton from "@/components/dm/DMStartButton"
import { notFound } from "next/navigation"

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = (await searchParams) ?? {}
  const tab = (typeof sp.tab === "string" ? sp.tab : "posts") as "posts" | "comments"

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      profile: { select: { displayName: true, role: true } },
    },
  })
  if (!user) return notFound()

  const displayName =
    user.profile?.displayName?.trim() ||
    user.name?.trim() ||
    "User"

  const posts = tab === "posts"
    ? await prisma.post.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, title: true, createdAt: true, category: true, views: true },
      })
    : []

  const comments = tab === "comments"
    ? await prisma.comment.findMany({
        where: { authorId: id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: { select: { id: true, title: true } },
        },
      })
    : []

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">{displayName}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
            <span>User Profile</span>
            <span>·</span>
            <RoleBadge role={(user.profile?.role ?? "USER") as any} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ 쪽지 보내기 버튼 */}
          <DMStartButton otherUserId={user.id} />
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href={`/u/${id}?tab=posts`}
          className={`px-3 py-1.5 rounded-xl border ${
            tab === "posts" ? "border-white text-white" : "border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          Posts
        </Link>
        <Link
          href={`/u/${id}?tab=comments`}
          className={`px-3 py-1.5 rounded-xl border ${
            tab === "comments" ? "border-white text-white" : "border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          Comments
        </Link>
      </div>

      {tab === "posts" ? (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-neutral-500">No posts.</div>
          ) : (
            posts.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="block rounded-xl border border-neutral-800 bg-black/30 p-4 hover:bg-neutral-900 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {p.category} · {new Date(p.createdAt).toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 shrink-0">{p.views} views</div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-neutral-500">No comments.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-neutral-800 bg-black/30 p-4">
                <div className="text-xs text-neutral-500">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-neutral-200 line-clamp-3">
                  {c.content}
                </div>
                <div className="mt-3">
                  <Link href={`/post/${c.post.id}`} className="text-sm text-neutral-400 hover:underline">
                    → {c.post.title}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}