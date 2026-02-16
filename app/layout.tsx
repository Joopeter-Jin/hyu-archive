import type { Metadata } from 'next'
import { Libre_Baskerville, Inter } from 'next/font/google'

import './globals.css'


const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'HYU Crypto Philosophy Archive',
  description:
    'An interdisciplinary research archive exploring the philosophical foundations of cryptographic systems, dialectic methods, and decentralized knowledge.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${libreBaskerville.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
