export default function Page() {
  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <h1 className="text-4xl font-serif font-bold tracking-tight">
          Crypto Philosophy Archive
        </h1>
        <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
          A research platform dedicated to the philosophical,
          economic, and dialectical foundations of cryptographic systems
          and decentralized infrastructures.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Recent Discussions
        </h2>

        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg hover:bg-accent transition">
            The Ontology of Decentralization
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent transition">
            Sovereignty in the Age of Cryptography
          </div>
        </div>
      </section>
    </div>
  )
}
