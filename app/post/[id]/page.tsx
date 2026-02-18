// app/post/[id]/page.tsx
import { notFound } from "next/navigation"
import { getSupabaseAnon } from "@/lib/supabase"

type PostRow = {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  author_id: string | null
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = getSupabaseAnon()

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,content,category,created_at,author_id")
    .eq("id", id)
    .single()

  if (error || !data) return notFound()

  const post = data as PostRow

  return (
    <div className="max-w-4xl py-16 px-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold">{post.title}</h1>
        <div className="text-sm text-neutral-500">
          {new Date(post.created_at).toLocaleString()} · {post.category}
        </div>
      </div>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}
