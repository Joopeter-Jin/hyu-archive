// components/home/CoreQuestions.tsx
export default function CoreQuestions() {
  const questions = [
    "What is money?",
    "How is trust organized?",
    "How do states construct economic order?",
    "What transformation does Bitcoin signal?",
  ]

  return (
    <section className="space-y-6">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        Core Questions
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q}
            className="text-2xl sm:text-3xl font-serif tracking-tight text-neutral-100"
          >
            {q}
          </div>
        ))}
      </div>

      <p className="max-w-3xl text-sm sm:text-base text-neutral-400 leading-relaxed">
        We optimize for clarity, continuity, and intellectual traceability—rather
        than immediacy.
      </p>
    </section>
  )
}