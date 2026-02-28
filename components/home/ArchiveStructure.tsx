// components/home/ArchiveStructure.tsx
import Link from "next/link"

const sections = [
  {
    href: "/debates",
    title: "Debates",
    desc: "Philosophical and policy-level discussions on crypto and monetary order.",
  },
  {
    href: "/class-seminars",
    title: "Class & Seminars",
    desc: "Records of lectures, seminars, and academic sessions.",
  },
  {
    href: "/concepts",
    title: "Concepts",
    desc: "Structured entries on core theoretical terms and frameworks.",
  },
  {
    href: "/reading-notes",
    title: "Reading Notes",
    desc: "Critical summaries of books, papers, and foundational texts.",
  },
  {
    href: "/news",
    title: "News",
    desc: "Contextual notes on contemporary developments (not price talk).",
  },
  {
    href: "/about",
    title: "About",
    desc: "Institutional background, mission, and governance.",
  },
]

export default function ArchiveStructure() {
  return (
    <section id="structure" className="space-y-6 scroll-mt-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Archive Structure
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-serif text-neutral-100">
            Institutional Sections
          </h2>
        </div>

        <div className="text-sm text-neutral-500">
          <span className="hidden sm:inline">RSS:</span>{" "}
          <a className="underline hover:text-neutral-300" href="/rss.xml">
            /rss.xml
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 hover:bg-neutral-900 transition"
          >
            <div className="text-lg font-serif text-neutral-100">{s.title}</div>
            <div className="mt-2 text-sm text-neutral-400 leading-relaxed">
              {s.desc}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}