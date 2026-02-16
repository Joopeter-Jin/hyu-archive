import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-baseline justify-between px-6 py-5">
        <Link href="/" className="font-serif text-sm tracking-wide text-foreground">
          HYU Crypto Philosophy Archive
        </Link>
        <nav className="hidden items-center gap-8 sm:flex" aria-label="Main navigation">
          <Link
            href="#foundation"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Foundation
          </Link>
          <Link
            href="#dialectic"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Dialectic
          </Link>
          <Link
            href="#archive"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Archive
          </Link>
        </nav>
      </div>
    </header>
  )
}
