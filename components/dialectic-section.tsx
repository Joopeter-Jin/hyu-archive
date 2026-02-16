import { Separator } from "@/components/ui/separator"

const threads = [
  {
    thesis: "Decentralisation as Radical Autonomy",
    antithesis: "Coordination Requires Central Authority",
    synthesis:
      "Distributed consensus mechanisms demonstrate that formal coordination can emerge without centralised control, yet governance structures inevitably re-introduce hierarchy.",
  },
  {
    thesis: "Code as Immutable Law",
    antithesis: "Law Demands Interpretation and Exception",
    synthesis:
      "Smart contracts encode deterministic rules, but the necessity of oracles, upgrades, and dispute resolution reveals that code alone cannot resolve normative ambiguity.",
  },
  {
    thesis: "Transparency Yields Trust",
    antithesis: "Privacy Is the Condition of Freedom",
    synthesis:
      "Open ledgers create verifiable histories, while zero-knowledge proofs show that verification need not require disclosure, reconciling transparency with individual sovereignty.",
  },
]

export function DialecticSection() {
  return (
    <section id="dialectic" className="mx-auto max-w-4xl px-6 py-20">
      <Separator className="mb-12" />
      <div className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Section II
        </p>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          Dialectic
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          A structured engagement with the contradictions inherent in
          cryptographic thought, pursued through thesis-antithesis-synthesis
          triads.
        </p>
      </div>
      <div className="flex flex-col gap-12">
        {threads.map((thread, i) => (
          <article
            key={i}
            className="rounded-sm border border-border bg-card p-6 md:p-8"
          >
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Thesis
                </p>
                <p className="font-serif text-base font-bold text-foreground">
                  {thread.thesis}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Antithesis
                </p>
                <p className="font-serif text-base font-bold text-foreground">
                  {thread.antithesis}
                </p>
              </div>
            </div>
            <Separator className="mb-6" />
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                Synthesis
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {thread.synthesis}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
