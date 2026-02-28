// components/MobileSidebar.tsx
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { name: "About Us", href: "/about" },
  { name: "Debates & Questions", href: "/debates" },
  { name: "Reading Notes", href: "/reading-notes" },
  { name: "Class & Seminars", href: "/class-seminars" },
  { name: "Concepts", href: "/concepts" },
  { name: "News & Interpretation", href: "/news" },
]

export default function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  // ✅ Drawer 열릴 때 body 스크롤 잠금
  useEffect(() => {
  if (open) {
    document.body.classList.add("drawer-open")
  } else {
    document.body.classList.remove("drawer-open")
  }

  return () => {
    document.body.classList.remove("drawer-open")
  }
}, [open])

  if (!open) return null

  return (
    // TopBar(h-16) 아래부터 표시
    <div className="fixed left-0 right-0 bottom-0 top-16 z-50 md:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-72 bg-black border-r border-neutral-800 p-6 overflow-y-auto">
        <div className="mb-10">
          <div className="text-xs tracking-wide text-neutral-500">
            Navigation
          </div>
          <div className="mt-2 text-lg font-serif font-bold">
            Crypto Philosophy Archive
          </div>
        </div>

        <nav className="space-y-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block transition-colors ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}