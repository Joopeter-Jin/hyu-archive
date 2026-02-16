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
    <aside className="w-64 border-r border-border p-6 hidden md:block">
      
      {/* 🔥 클릭하면 홈으로 */}
      <Link href="/" className="block mb-8">
        <h1 className="text-xl font-serif font-bold tracking-tight hover:opacity-80 transition">
          Crypto Philosophy Archive
        </h1>
      </Link>

      <nav className="space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block transition-colors ${
              pathname === item.href
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
