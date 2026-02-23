export default function RoleBadge({
  role,
}: {
  role: "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"
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

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border ${cls}`}>
      {label}
    </span>
  )
}