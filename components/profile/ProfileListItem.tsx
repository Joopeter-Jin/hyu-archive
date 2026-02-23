// components/profile/ProfileListItem.tsx
"use client"

import Link from "next/link"

export default function ProfileListItem({
  title,
  href,
  meta,
  right,
}: {
  title: string
  href: string
  meta?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-neutral-900 bg-black/30 p-4">
      <div className="min-w-0">
        <Link href={href} className="text-sm text-white hover:underline break-words">
          {title}
        </Link>
        {meta && <div className="mt-1 text-xs text-neutral-500">{meta}</div>}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}