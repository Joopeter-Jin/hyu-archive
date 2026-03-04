// components/category/CategoryPage.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import WriteButton from "@/components/WriteButton"
import ListControls from "@/components/category/ListControls"
import Pagination from "@/components/category/Pagination"
import RefreshOnFocus from "@/components/category/RefreshOnFocus"
import SubscribeToggle from "@/components/category/SubscribeToggle"

type SearchParams = Record<string, string | string[] | undefined>
type SortKey = "latest" | "top" | "oldest"
type SearchScope = "all" | "title"

type Props = {
  category: string
  title: string
  description: string
  searchParams?: SearchParams
}

function asString(v: string | string[] | undefined) {
  return typeof v === "string" ? v : ""
}

function asInt(v: string, def: number) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : def
}

export default async function CategoryPage({
  category,
  title,
  description,
  searchParams,
}: Props) {
  const sp = searchParams ?? {}

  const q = asString(sp.q).trim()
  const sort = (asString(sp.sort) || "latest") as SortKey
  const page = asInt(asString(sp.page) || "1", 1)

  const scopeRaw = (asString(sp.scope) || "all") as SearchScope
  const scope: SearchScope = scopeRaw === "title" ? "title" : "all"

  const perPageRaw = asInt(asString(sp.perPage) || "10", 10)
  const perPage = perPageRaw === 20 ? 20 : 10

  const skip = (page - 1) * perPage
  const take = perPage

  const where = {
    category,
    ...(q
      ? scope === "title"
        ? { title: { contains: q, mode: "insensitive" as const } }
        : {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
      : {}),
  }

  const orderBy =
    sort === "oldest"
      ? ({ createdAt: "asc" } as const)
      : ({ createdAt: "desc" } as const)

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        createdAt: true,
        views: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      orderBy: sort === "top" ? ({ createdAt: "desc" } as const) : orderBy,
      skip,
      take,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="py-12 px-6 space-y-10">
      <RefreshOnFocus />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">{title}</h1>
          <p className="mt-2 text-neutral-400">{description}</p>
        </div>
        <div className="flex items-center gap-2 md:justify-end">
          <SubscribeToggle category={category} />
          <WriteButton href={`/${category}/write`} category={category} />
        </div>
      </div>

      <ListControls />

      <div className="space-y-3">
        {posts.length ? (
          posts.map((post) => {
            const displayName =
              post.author.profile?.displayName?.trim() ||
              post.author.name?.trim() ||
              "Unknown"

            const date = new Date(post.createdAt).toISOString().slice(0, 10)

            return (
              <div
                key={post.id}
                className="relative p-4 border border-neutral-800 rounded-lg hover:bg-neutral-900 transition"
              >
                {/* ✅ 블록 전체 클릭용 오버레이 링크 (위에 깔기) */}
                <Link
                  href={`/post/${post.id}`}
                  className="absolute inset-0 z-10 block rounded-lg"
                  aria-label={`Open post ${post.title}`}
                />

                {/* ✅ 컨텐츠는 클릭을 통과시키기 */}
                <div className="relative z-0 pointer-events-none flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{post.title}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                    <div className="text-neutral-500">{date}</div>
                    <div className="text-neutral-600">·</div>

                    {/* ✅ 작성자 링크만 클릭 가능하게 복구 */}
                    <Link
                      href={`/u/${post.author.id}`}
                      className="relative z-20 pointer-events-auto max-w-[160px] truncate hover:underline"
                    >
                      {displayName}
                    </Link>

                    <div className="text-neutral-600">·</div>
                    <div>{post.views} views</div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-neutral-500">No posts yet.</div>
        )}
      </div>

      <Pagination page={safePage} totalPages={totalPages} />
    </div>
  )
}