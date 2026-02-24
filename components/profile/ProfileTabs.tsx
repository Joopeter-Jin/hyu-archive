"use client"

export type TabKey = "posts" | "comments" | "votes"

export default function ProfileTabs({
  active,
  onChange,
  counts,
}: {
  active: TabKey
  onChange: (k: TabKey) => void
  counts: { posts: number; comments: number; votes: number; requests?: number }
}) {
  const btn = (key: TabKey, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      className={
        "text-sm border rounded-lg px-3 py-1.5 transition " +
        (active === key
          ? "border-neutral-600 text-white"
          : "border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900")
      }
    >
      {label} {typeof count === "number" ? `(${count})` : ""}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-2">
      {btn("posts", "Posts", counts.posts)}
      {btn("comments", "Comments", counts.comments)}
      {btn("votes", "Votes", counts.votes)}
      
    </div>
  )
}