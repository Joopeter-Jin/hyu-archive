// components/profile/ProfileTabs.tsx
"use client"

export type TabKey = "posts" | "comments" | "votes"

export default function ProfileTabs({
  active,
  onChange,
  counts,
}: {
  active: TabKey
  onChange: (k: TabKey) => void
  counts: { posts: number; comments: number; votes: number }
}) {
  const Item = ({
    k,
    label,
    count,
  }: {
    k: TabKey
    label: string
    count: number
  }) => {
    const on = active === k
    return (
      <button
        type="button"
        onClick={() => onChange(k)}
        className={
          "px-3 py-1.5 rounded-lg text-sm border transition " +
          (on
            ? "bg-white text-black border-white"
            : "border-neutral-800 text-neutral-300 hover:bg-neutral-900")
        }
      >
        {label} <span className="text-xs opacity-70">({count})</span>
      </button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Item k="posts" label="My Posts" count={counts.posts} />
      <Item k="comments" label="My Comments" count={counts.comments} />
      <Item k="votes" label="My Votes" count={counts.votes} />
    </div>
  )
}