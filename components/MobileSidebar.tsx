// components/MobileSidebar.tsx
"use client"

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

  if (!open) return null

  return (
    // ✅ TopBar(h-16) 아래부터만 덮도록 top-16
    <div className="fixed left-0 right-0 bottom-0 top-16 z-50 md:hidden">
      {/* Overlay (TopBar 아래 영역만) */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel (TopBar 아래 영역에서 full height) */}
      <div className="absolute left-0 top-0 h-full w-72 bg-black border-r border-neutral-800 p-6">
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