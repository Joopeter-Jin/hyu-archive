import { Separator } from "@/components/ui/separator"

const entries = [
  {
    number: "01",
    title: "Epistemic Trust in Zero-Knowledge Proofs",
    description:
      "How zero-knowledge protocols redefine the relationship between knowledge and verification, drawing from Kantian epistemology and analytic philosophy of language.",
  },
  {
    number: "02",
    title: "Ontology of Digital Scarcity",
    description:
      "An inquiry into the metaphysical status of artificially scarce digital objects and their implications for property theory and social contract traditions.",
  },
  {
    number: "03",
    title: "Formal Methods and Philosophical Logic",
    description:
      "Exploring how modal logic and type theory serve as shared foundations for both cryptographic protocol verification and contemporary analytic philosophy.",
  },
]

export function FoundationSection() {
  return (
    <section id="foundation" className="mx-auto max-w-4xl px-6 py-20">
      <Separator className="mb-12" />
      <div className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Section I
        </p>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          Foundation
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Core research threads establishing the philosophical groundwork for
          understanding cryptographic systems as objects of formal and
          speculative inquiry.
        </p>
      </div>
      <div className="flex flex-col gap-10">
        {entries.map((entry) => (
          <article key={entry.number} className="group flex gap-6">
            <span className="shrink-0 font-serif text-3xl font-bold text-border">
              {entry.number}
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                {entry.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
