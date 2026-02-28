// app/layout.tsx
import type { Metadata } from "next"
import { Libre_Baskerville, Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider } from "@/context/AuthContext"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import MobileSidebar from "@/components/MobileSidebar"

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "HYU Crypto Philosophy Archive",
  description:
    "An interdisciplinary research archive exploring the philosophical foundations of cryptographic systems.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${libreBaskerville.variable} ${inter.variable} font-sans antialiased bg-black text-white`}
      >
        <AuthProvider>
          <div className="flex min-h-screen">
            {/* Desktop Sidebar (sticky는 Sidebar 컴포넌트에서 적용) */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
              {/* TopBar: sticky */}
              <TopBar />

              {/* Mobile bar (hamburger row): TopBar 아래에 고정 */}
              <div className="md:hidden sticky top-16 z-30 bg-black flex items-center justify-between h-16 border-b border-neutral-800 px-4">
                <MobileSidebar />
              </div>

              <main className="flex-1 p-8 min-w-0">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}