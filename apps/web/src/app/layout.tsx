import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SentryWrapper } from '../lib/sentry'
import { PostHogProvider } from '../lib/analytics'

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
        <SentryWrapper>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </SentryWrapper>
      </body>
    </html>
  )
}
