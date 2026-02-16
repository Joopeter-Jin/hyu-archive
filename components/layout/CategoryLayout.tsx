"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

interface Post {
  id: string
  title: string
}

interface CategoryLayoutProps {
  title: string
  description: string
  posts?: Post[]
}

export default function CategoryLayout({
  title,
  description,
  posts = [],
}: CategoryLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="max-w-4xl space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {description}
          </p>
        </div>

        {/* 로그인 시에만 표시 */}
        {user && (
          <Link
            href={`${pathname}/write`}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition"
          >
            Write Post
          </Link>
        )}
      </div>

      {/* Post List */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="text-muted-foreground text-sm">
            No posts yet.
          </div>
        )}

        {posts.map((post) => (
          <Link
            key={post.id}
            href={`${pathname}/${post.id}`}
            className="block p-4 border border-border rounded-lg hover:bg-accent transition"
          >
            {post.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
