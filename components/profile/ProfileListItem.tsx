// components/profile/ProfileListItem.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(href)
      }}
      className="group cursor-pointer rounded-xl border border-neutral-900 bg-black/30 p-4 hover:bg-neutral-900 transition outline-none focus:ring-2 focus:ring-neutral-700"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* 제목은 링크로 남겨두되, 카드 전체 클릭을 방해하지 않게 */}
          <Link
            href={href}
            className="text-sm text-white hover:underline break-words"
            onClick={(e) => e.stopPropagation()}
          >
            {title}
          </Link>

          {meta && <div className="mt-1 text-xs text-neutral-500">{meta}</div>}
        </div>

        {/* 오른쪽 badge/버튼 영역: 눌러도 이동하지 않게 */}
        {right ? (
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {right}
          </div>
        ) : null}
      </div>
    </div>
  )
}