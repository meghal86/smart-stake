import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/design-tokens.css'
import { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AlphaWhale - Whale Intelligence Platform',
  description: 'Track whale movements, token unlocks, and market intelligence with AlphaWhale.',
}

import BrownoutBanner from '../components/BrownoutBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BrownoutBanner />
        <main className="min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
          {children}
        </main>
      </body>
    </html>
  )
}
