import type { Metadata } from 'next'
import DesktopSidebarNav from '@/components/nav/DesktopSidebarNav'
import MobileFooterNav from '@/components/nav/MobileFooterNav'
import TopStatusBar from '@/components/nav/TopStatusBar'

export const metadata: Metadata = {
  title: 'AlphaWhale Lite',
}

export default function LiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-200">
      <TopStatusBar />
      <div className="mx-auto flex w-full max-w-6xl gap-0 md:gap-6">
        <DesktopSidebarNav />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileFooterNav />
    </div>
  )
}
