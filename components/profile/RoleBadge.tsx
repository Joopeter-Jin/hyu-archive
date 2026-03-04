type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

export default function RoleBadge({
  role,
  contributorLevel = 0,
  coreCandidate = false,
}: {
  role: Role
  contributorLevel?: number
  coreCandidate?: boolean
}) {
  const label =
    role === "ADMIN"
      ? "ADMIN"
      : role === "PROFESSOR"
        ? "PROF"
        : role === "GRAD"
          ? "GRAD"
          : role === "CONTRIBUTOR"
            ? "CONTRIB"
            : "USER"

  const cls =
    role === "ADMIN"
      ? "border-red-500/40 text-red-300 bg-red-950/30"
      : role === "PROFESSOR"
        ? "border-purple-500/40 text-purple-300 bg-purple-950/30"
        : role === "GRAD"
          ? "border-sky-500/40 text-sky-300 bg-sky-950/30"
          : role === "CONTRIBUTOR"
            ? "border-amber-500/40 text-amber-300 bg-amber-950/30"
            : "border-neutral-700 text-neutral-300 bg-neutral-900/40"

  // Lv5는 자동승급이 아니라 승인이라 희소성이 있으니 강조만 살짝
  const levelLabel = contributorLevel > 0 ? `Lv${contributorLevel}` : null
  const showCandidate = coreCandidate && contributorLevel < 5

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded-full border ${cls}`}>
      <span>{label}</span>

      {levelLabel && (
        <span className="px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80 leading-none">
          {levelLabel}
        </span>
      )}

      {showCandidate && (
        <span className="px-1.5 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-950/30 text-emerald-200 leading-none">
          CAND
        </span>
      )}
    </span>
  )
}