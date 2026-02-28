// components/home/LatestPublications.tsx
import Link from "next/link"

type LatestPost = {
  id: string
  title: string
  createdAt: Date
  category: string
  excerpt: string
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d)
}

export default function LatestPublications({ posts }: { posts: LatestPost[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Latest
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-serif text-neutral-100">
            Latest Publications
          </h2>
        </div>

        {/* "전체 글" 통합 라우트가 아직 없으니, 대표 섹션으로 유도 */}
        <Link
          href="/debates"
          className="text-sm text-neutral-400 underline hover:text-neutral-200"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-500">
            No publications yet.
          </div>
        ) : (
          posts.map((p) => (
            <Link
              key={p.id}
              href={`/post/${p.id}`}
              prefetch={false}
              className="block rounded-2xl border border-neutral-800 bg-neutral-950 p-6 hover:bg-neutral-900 transition"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                <span>{formatDate(p.createdAt)}</span>
                <span>·</span>
                <span className="uppercase tracking-wider">{p.category}</span>
              </div>

              <div className="mt-2 text-base sm:text-lg font-serif text-neutral-100">
                {p.title}
              </div>

              {p.excerpt ? (
                <div className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  {p.excerpt}
                </div>
              ) : null}
            </Link>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="/rss.xml"
          className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
        >
          RSS Feed
        </a>
        <Link
          href="/about"
          className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-200 transition"
        >
          Mission →
        </Link>
      </div>
    </section>
  )
}