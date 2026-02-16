import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { FoundationSection } from "@/components/foundation-section"
import { DialecticSection } from "@/components/dialectic-section"
import { ArchiveSection } from "@/components/archive-section"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <FoundationSection />
        <DialecticSection />
        <ArchiveSection />
      </main>
      <SiteFooter />
    </div>
  )
}
