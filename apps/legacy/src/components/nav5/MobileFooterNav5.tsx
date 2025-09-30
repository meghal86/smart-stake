'use client';
import { NavLink5 } from './NavLink5';
import { WhaleIcon5, PortfolioIcon5, ReportsIcon5, SettingsIcon5 } from './icons5';

export default function MobileFooterNav5() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70 md:hidden"
      role="navigation"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 py-2">
        <li>
          <NavLink5 href="/lite5/hub5" activeMatch="/lite5/hub5" label="Hub" icon={<WhaleIcon5 />} className="justify-center" />
        </li>
        <li>
          <NavLink5 href="/lite5/portfolio5" activeMatch="/lite5/portfolio5" label="Portfolio" icon={<PortfolioIcon5 />} className="justify-center" />
        </li>
        <li>
          <NavLink5 href="/lite5/reports5" activeMatch="/lite5/reports5" label="Reports" icon={<ReportsIcon5 />} className="justify-center" />
        </li>
        <li>
          <NavLink5 href="/lite5/settings5" activeMatch="/lite5/settings5" label="Settings" icon={<SettingsIcon5 />} className="justify-center" />
        </li>
      </ul>
    </nav>
  );
}
