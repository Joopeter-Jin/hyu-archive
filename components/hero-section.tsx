export function HeroSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
      <p className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">
        Hanyang University &middot; Research Archive
      </p>
      <h1 className="max-w-2xl font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl md:leading-tight">
        <span className="text-balance">
          Crypto Philosophy Archive
        </span>
      </h1>
      <p className="mt-8 max-w-xl leading-relaxed text-muted-foreground">
        An interdisciplinary research initiative exploring the philosophical
        underpinnings of cryptographic systems&mdash;from epistemic trust and
        formal verification to the ethics of decentralised governance and
        distributed consensus.
      </p>
    </section>
  )
}
