"use client"

import { useState } from "react"
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

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-4 text-neutral-400 hover:text-white"
      >
        ☰
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">

          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="relative w-64 bg-black border-r border-neutral-800 p-6">
            <button
              onClick={() => setOpen(false)}
              className="mb-8 text-neutral-400 hover:text-white"
            >
              ✕
            </button>

            <nav className="space-y-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block ${
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
      )}
    </>
  )
}
