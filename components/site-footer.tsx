import { Separator } from "@/components/ui/separator"

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-4xl px-6 pb-12 pt-20">
      <Separator className="mb-8" />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-serif text-sm text-foreground">
            HYU Crypto Philosophy Archive
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hanyang University &middot; Department of the Philosophy of Bitcoin as Money &middot; Seoul,
            South Korea
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; 2026 All rights reserved.
        </p>
      </div>
    </footer>
  )
}
