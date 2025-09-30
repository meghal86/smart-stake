import type { Metadata } from 'next';
import DesktopSidebarNav5 from '@/components/nav5/DesktopSidebarNav5';
import MobileFooterNav5 from '@/components/nav5/MobileFooterNav5';
import TopStatusBar5 from '@/components/nav5/TopStatusBar5';

export const metadata: Metadata = {
  title: 'AlphaWhale Lite',
  description: 'Track whale movements, token unlocks, and market intelligence with AlphaWhale Lite.',
};

export default function Lite5Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-200">
      <TopStatusBar5 />
      <div className="mx-auto flex w-full max-w-6xl gap-0 md:gap-6">
        <DesktopSidebarNav5 />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileFooterNav5 />
    </div>
  );
}
