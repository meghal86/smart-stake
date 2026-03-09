import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Brain, Briefcase, Layers, MapPin, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { Button } from '@/components/ui/button';
import {
  ContextualGuideDrawer,
  type PortfolioGuideContext,
} from '@/components/copilot/ContextualGuideDrawer';
import { cn } from '@/lib/utils';

interface PortfolioExperienceShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  guideContext?: PortfolioGuideContext;
  guideLabel?: string;
  children: ReactNode;
}

const portfolioNav = [
  { href: '/portfolio', label: 'Overview', icon: Briefcase },
  { href: '/portfolio/positions', label: 'Positions', icon: Layers },
  { href: '/portfolio/risk', label: 'Risk', icon: TrendingUp },
  { href: '/portfolio/guardian', label: 'Guardian', icon: Shield },
  { href: '/portfolio/stress', label: 'Stress', icon: Activity },
  { href: '/portfolio/addresses', label: 'Addresses', icon: MapPin },
];

export function PortfolioExperienceShell({
  title,
  subtitle,
  badge,
  actions,
  aside,
  guideContext,
  guideLabel,
  children,
}: PortfolioExperienceShellProps) {
  const location = useLocation();
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f6f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_35%)]" />
      <GlobalHeader className="border-white/8 bg-[#050505]/94" />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[28px] border border-white/8 bg-[#0b0b0c] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
              <div className="mb-6 px-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Portfolio</p>
                <p
                  className="mt-3 text-[28px] leading-none text-[#f6f2ea]"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  Command
                </p>
              </div>

              <nav className="space-y-1" aria-label="Portfolio sections">
                {portfolioNav.map(({ href, label, icon: Icon }) => {
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors',
                        active
                          ? 'bg-white/[0.08] text-[#f6f2ea]'
                          : 'text-[#9c978f] hover:bg-white/[0.04] hover:text-[#f6f2ea]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#b7c8f0]">Focus</p>
                <p
                  className="mt-3 text-2xl text-[#f6f2ea]"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  Stay ahead of drift.
                </p>
                <p className="mt-3 text-sm leading-6 text-[#b8b2a7]">
                  Review risk, trust, and address activity from one quieter portfolio surface.
                </p>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                {badge ? (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {badge}
                  </div>
                ) : null}
                <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm text-[#9c978f] sm:text-base">{subtitle}</p> : null}
              </div>
              {actions || guideContext ? (
                <div className="flex flex-wrap gap-3">
                  {guideContext ? (
                    <Button
                      variant="outline"
                      onClick={() => setGuideOpen(true)}
                      className="rounded-full border-white/10 bg-white/[0.03] px-5 text-[#f6f2ea] hover:bg-white/[0.08]"
                    >
                      <Brain className="mr-2 h-4 w-4 text-[#a7c0ff]" />
                      {guideLabel ?? 'Ask Portfolio AI'}
                    </Button>
                  ) : null}
                  {actions}
                </div>
              ) : null}
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {portfolioNav.map(({ href, label }) => {
                const active = location.pathname === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      'whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors',
                      active
                        ? 'border-[#7ea3f2]/40 bg-[#7ea3f2]/18 text-[#f6f2ea]'
                        : 'border-white/10 bg-white/[0.03] text-[#9c978f]'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className={cn('grid gap-6', aside ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : 'grid-cols-1')}>
              <div className="min-w-0 space-y-6">{children}</div>
              {aside ? <div className="space-y-6">{aside}</div> : null}
            </div>
          </main>
        </div>
      </div>

      <FooterNav currentRoute={location.pathname} />
      {guideContext ? (
        <ContextualGuideDrawer
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          kind="portfolio"
          context={guideContext}
        />
      ) : null}
    </div>
  );
}
