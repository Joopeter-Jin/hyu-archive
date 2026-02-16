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

            <Sidebar />

            <div className="flex-1 flex flex-col">

              <TopBar />

              <div className="flex items-center justify-between h-16 border-b border-neutral-800 px-4 md:hidden">
                <MobileSidebar />
              </div>
              
              <main className="flex-1 p-8">
                {children}
              </main>
            </div>

          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
