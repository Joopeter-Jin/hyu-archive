// components/layout/Sidebar.tsx
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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="
        hidden md:block md:w-64
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        border-r border-neutral-800 bg-black p-6
      "
    >
      {/* Logo */}
      <Link href="/" className="block mb-10">
        <h1 className="text-xl font-serif font-bold tracking-tight hover:opacity-80 transition">
          Crypto Philosophy Archive
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="space-y-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}