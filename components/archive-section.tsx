import { Separator } from "@/components/ui/separator"

const works = [
  {
    year: "2026",
    author: "Park, S. & Kim, J.",
    title: "Trust Without Testimony: A Formal Account of Zero-Knowledge Epistemics",
    type: "Working Paper",
  },
  {
    year: "2025",
    author: "Cho, H.",
    title: "The Social Contract Recompiled: Governance in Permissionless Systems",
    type: "Monograph",
  },
  {
    year: "2025",
    author: "Lee, M. & Yoon, D.",
    title: "Modal Logic and Protocol Verification: Bridging Kripke Semantics and BFT Consensus",
    type: "Conference Paper",
  },
  {
    year: "2024",
    author: "Kim, J.",
    title: "Scarcity as Artifice: Digital Objects and the Metaphysics of Property",
    type: "Journal Article",
  },
  {
    year: "2024",
    author: "Park, S.",
    title: "On the Ethics of Immutable Code: Smart Contracts and the Limits of Determinism",
    type: "Working Paper",
  },
]

export function ArchiveSection() {
  return (
    <section id="archive" className="mx-auto max-w-4xl px-6 py-20">
      <Separator className="mb-12" />
      <div className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Section III
        </p>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          Archive
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Selected publications, working papers, and lecture transcripts from
          the research collective, catalogued in reverse chronological order.
        </p>
      </div>
      <div className="flex flex-col">
        {works.map((work, i) => (
          <article
            key={i}
            className="group flex flex-col gap-1 border-t border-border py-5 last:border-b md:flex-row md:items-baseline md:gap-6"
          >
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground md:w-12">
              {work.year}
            </span>
            <div className="flex-1">
              <p className="font-serif font-bold text-foreground transition-colors group-hover:text-muted-foreground">
                {work.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {work.author}
              </p>
            </div>
            <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
              {work.type}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
