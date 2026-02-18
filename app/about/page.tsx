import Link from "next/link"
import WriteButton from "@/components/WriteButton"
import { prisma } from "@/lib/prisma"

export default async function AboutPage() {
  const posts = await prisma.post.findMany({
    where: { category: "about" },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="py-12 px-6 space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">About Us</h1>
          <p className="mt-2 text-neutral-400">
            Identity, governance, and institutional reflections of the archive.
          </p>
        </div>
        <WriteButton href="/about/write" />
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
