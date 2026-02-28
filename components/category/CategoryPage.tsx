//components/category/CategoryPage.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import WriteButton from "@/components/WriteButton"
import ListControls from "@/components/category/ListControls"
import Pagination from "@/components/category/Pagination"

type SearchParams = Record<string, string | string[] | undefined>
type SortKey = "latest" | "top" | "oldest"

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
  const page = asInt(asString(sp.page) || "1", 1)

  const sort = (asString(sp.sort) || "latest") as SortKey

  // perPage는 10/20만 허용
  const perPageRaw = asInt(asString(sp.perPage) || "10", 10)
  const perPage = perPageRaw === 20 ? 20 : 10

  const skip = (page - 1) * perPage
  const take = perPage

  const where = {
    category,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  // ✅ 정렬 반영 (top은 다음 단계에서 vote 집계로 구현)
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
            name: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      // ✅ 여기 핵심
      orderBy: sort === "top" ? ({ createdAt: "desc" } as const) : orderBy,
      skip,
      take,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="py-12 px-6 space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">{title}</h1>
          <p className="mt-2 text-neutral-400">{description}</p>
        </div>
        <WriteButton href={`/${category}/write`} />
      </div>

      <ListControls />

      <div className="space-y-3">
        {posts.length ? (
          posts.map((post) => {
            const displayName =
              post.author.profile?.displayName?.trim() ||
              post.author.name?.trim() ||
              "Unknown"

            return (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-900 transition cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {new Date(post.createdAt).toISOString().slice(0, 10)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                      <div className="max-w-[160px] truncate">{displayName}</div>
                      <div className="text-neutral-600">·</div>
                      <div>{post.views} views</div>
                    </div>
                  </div>
                </div>
              </Link>
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