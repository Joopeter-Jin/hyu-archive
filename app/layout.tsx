import type { Metadata } from "next"
import { Libre_Baskerville, Inter } from "next/font/google"

import "./globals.css"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"

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
    "An interdisciplinary research archive exploring the philosophical foundations of cryptographic systems, dialectic methods, and decentralized knowledge.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${libreBaskerville.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex flex-col flex-1">
            <TopBar />

            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
