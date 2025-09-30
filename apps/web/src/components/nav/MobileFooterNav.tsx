'use client'

import { NavLink } from './NavLink'
import { WhaleIcon, PortfolioIcon, ReportsIcon, SettingsIcon } from './icons'

export default function MobileFooterNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70 md:hidden"
      role="navigation"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 py-2">
        <li>
          <NavLink href="/lite/hub" activeMatch="/lite/hub" label="Hub" icon={<WhaleIcon />} className="justify-center" />
        </li>
        <li>
          <NavLink href="/lite/portfolio" activeMatch="/lite/portfolio" label="Portfolio" icon={<PortfolioIcon />} className="justify-center" />
        </li>
        <li>
          <NavLink href="/lite/reports" activeMatch="/lite/reports" label="Reports" icon={<ReportsIcon />} className="justify-center" />
        </li>
        <li>
          <NavLink href="/lite/settings" activeMatch="/lite/settings" label="Settings" icon={<SettingsIcon />} className="justify-center" />
        </li>
      </ul>
    </nav>
  )
}
