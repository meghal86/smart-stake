'use client'

import { NavLink } from './NavLink'
import { WhaleIcon, PortfolioIcon, ReportsIcon, SettingsIcon } from './icons'
import Link from 'next/link'

export default function DesktopSidebarNav() {
  return (
    <aside
      className="sticky top-0 hidden h-[100dvh] w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950/60 p-4 md:block"
      aria-label="Primary"
    >
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/20 text-teal-400">
          <WhaleIcon />
        </div>
        <Link href="/lite/hub" className="text-lg font-semibold text-white">
          AlphaWhale Lite
        </Link>
      </div>

      <nav className="space-y-1">
        <NavLink href="/lite/hub" activeMatch="/lite/hub" icon={<WhaleIcon />} label="Hub" />
        <NavLink href="/lite/portfolio" activeMatch="/lite/portfolio" icon={<PortfolioIcon />} label="Portfolio" />
        <NavLink href="/lite/reports" activeMatch="/lite/reports" icon={<ReportsIcon />} label="Reports" />
        <NavLink href="/lite/settings" activeMatch="/lite/settings" icon={<SettingsIcon />} label="Settings" />
      </nav>

      <div className="mt-auto hidden md:block fixed bottom-4 left-4 right-4">
        <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-blue-700 p-3 text-center shadow">
          <p className="text-sm font-semibold text-white">Unlock Full Alpha</p>
          <Link
            href="/lite/settings?upgrade=1"
            className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-700"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </aside>
  )
}
