import Link from "next/link"
import WriteButton from "@/components/WriteButton"
import { prisma } from "@/lib/prisma"

export default async function ReadingNotesPage() {
  const posts = await prisma.post.findMany({
    where: { category: "reading-notes" },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="py-12 px-6 space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Reading Notes</h1>
          <p className="mt-2 text-neutral-400">
            Annotations, reviews, and structured notes on books, papers, and lectures.
          </p>
        </div>
        <WriteButton href="/reading-notes/write" />
      </div>

      <div className="space-y-3">
        {posts.length ? (
          posts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`}>
              <div className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-900 transition cursor-pointer">
                {post.title}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-neutral-500">No posts yet.</div>
        )}
      </div>
    </div>
  )
}
