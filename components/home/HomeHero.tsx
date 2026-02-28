import Link from "next/link"

export default function HomeHero() {
  return (
    <section className="space-y-6 text-left">
      <div className="space-y-2">
        <div className="text-xs tracking-wide text-neutral-500">
          Since March 2026 · Seoul, Republic of Korea
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-neutral-100">
          HYU Crypto Philosophy Archive
        </h1>

        <p className="text-sm sm:text-base text-neutral-400">
          암호화 시대의 화폐 철학을 기록하는 학술 아카이브
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8">
        <div className="text-xs uppercase tracking-wider text-neutral-500">
          Abstract
        </div>

        <div className="mt-4 space-y-4 leading-relaxed text-neutral-200 text-[15px] sm:text-base">
          <p>
            HYU Crypto Philosophy Archive는 한양대학교 비트코인·화폐철학 전공
            대학원 연구자들이 시작한 학술 아카이브로, 암호화폐와 화폐의 철학적
            기반을 연구하고 기록합니다.
          </p>

          <p>
            이곳은 가격·수익률·투자 조언을 다루지 않습니다. 대신 화폐, 신뢰, 국가,
            분산 시스템의 구조를 장기적으로 축적하는 지적 기반을 구축합니다.
          </p>

          <div className="pt-1 text-xs text-neutral-500">
            Keywords: money, trust, state, cryptography, Bitcoin
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#structure"
            className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
          >
            아카이브 탐색 →
          </a>

          <Link
            href="/about"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-200 transition"
          >
            정체성 전문 보기 →
          </Link>
        </div>
      </div>
    </section>
  )
}