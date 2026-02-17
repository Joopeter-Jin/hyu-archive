import Link from "next/link"
import CategoryLayout from "@/components/CategoryLayout"
import { getSupabaseAnon } from "@/lib/supabase"

type PostRow = { id: string; title: string; created_at: string }

export default async function NewsPage() {
  const supabase = getSupabaseAnon()
  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at")
    .eq("category", "news")
    .order("created_at", { ascending: false })

  const posts = (data ?? []) as PostRow[]

  return (
    <CategoryLayout
      title="News & Interpretation"
      description="Curated signals and interpretive essays connecting current events to long-term monetary thought."
      writeHref="/news/write"
    >
      <div className="space-y-3">
        {error ? (
          <div className="text-neutral-400">Error loading posts</div>
        ) : posts.length ? (
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
    </CategoryLayout>
  )
}
