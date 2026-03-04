// app/post/[id]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import PostActions from "@/components/PostActions"
import Comments from "@/components/comments/Comments"
import RoleBadge from "@/components/profile/RoleBadge"
import ViewIncrement from "@/components/views/ViewIncrement"
import PostEngagementBar from "@/components/post/PostEngagementBar"

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      createdAt: true,
      authorId: true,
      views: true,
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, role: true, contributorLevel: true } },
        },
      },
    },
  })

  if (!post) return notFound()

  const isOwner = !!userId && userId === post.authorId
  const authorName =
    post.author.profile?.displayName?.trim() ||
    post.author.name?.trim() ||
    "User"
  const authorRole = post.author.profile?.role ?? "USER"
  const authorLevel = post.author.profile?.contributorLevel ?? 0

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-10">
      <ViewIncrement postId={post.id} />

      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold">{post.title}</h1>

            <div className="text-sm text-neutral-500 flex flex-wrap items-center gap-2">
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span>·</span>
              <span>{post.category}</span>
              <span>·</span>
              <span>views {post.views}</span>
              <span>·</span>
              <span className="text-neutral-300">{authorName}</span>
              <RoleBadge role={authorRole} contributorLevel={authorLevel} />
            </div>
          </div>

          {isOwner ? (
            <PostActions postId={post.id} category={post.category} />
          ) : (
            <div className="text-xs text-neutral-600">You can view only.</div>
          )}
        </div>
      </header>

      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* ✅✅ 글 하단 Engagement Bar */}
      <PostEngagementBar postId={post.id} />

      <Comments postId={post.id} />
    </div>
  )
}