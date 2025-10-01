import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/design-tokens.css'
import { TooltipProvider } from '../components/ui/Tooltip'
import BrownoutBanner from '../components/BrownoutBanner'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider>
          <BrownoutBanner />
          <main className="min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  )
}
