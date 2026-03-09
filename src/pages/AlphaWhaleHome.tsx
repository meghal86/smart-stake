import { HomeErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { HomeAuthProvider } from '@/lib/context/HomeAuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowRight,
  Compass,
  Leaf,
  Shield,
  Sparkles,
  Activity,
  Wallet,
  Radar,
  CheckCircle2,
} from 'lucide-react';

const productCards = [
  {
    title: 'Guardian',
    href: '/guardian',
    icon: Shield,
    eyebrow: 'Wallet safety',
    summary: 'Scan approvals, trust posture, and exposures across every connected wallet.',
    accent: 'from-[#7ea3f2]/18 to-transparent',
  },
  {
    title: 'Hunter',
    href: '/hunter',
    icon: Compass,
    eyebrow: 'Opportunity desk',
    summary: 'Follow flow, identify setups, and keep the best whale opportunities in one place.',
    accent: 'from-[#d6c08d]/16 to-transparent',
  },
  {
    title: 'Harvest',
    href: '/harvestpro',
    icon: Leaf,
    eyebrow: 'Tax optimization',
    summary: 'Review harvest windows, savings estimates, and execution-ready opportunities.',
    accent: 'from-[#b9d5c0]/16 to-transparent',
  },
];

const systemPillars = [
  {
    title: 'Signals that explain themselves',
    body: 'Large flow, exchange exits, and portfolio moves show up with context instead of noise.',
    icon: Activity,
  },
  {
    title: 'One place for every wallet',
    body: 'Guardian, portfolio, and harvesting work off the same wallet universe instead of separate silos.',
    icon: Wallet,
  },
  {
    title: 'Built for action, not screenshots',
    body: 'The product is designed to move from detection to decision to execution without switching modes.',
    icon: Radar,
  },
];

const trustRows = [
  { label: 'Signal desk', value: 'Live + cached fallback' },
  { label: 'Guardian posture', value: 'Wallet-scoped checks' },
  { label: 'Portfolio scope', value: 'All wallets by default' },
  { label: 'Execution surface', value: 'Hunter + Harvest + Guardian' },
];

const onboardingSteps = [
  {
    step: '01',
    title: 'Connect your wallet set',
    body: 'Bring in the addresses you actually manage instead of operating one wallet at a time.',
  },
  {
    step: '02',
    title: 'Read the daily surface',
    body: 'Use cockpit, signals, and Guardian to see what changed before taking action.',
  },
  {
    step: '03',
    title: 'Execute from the same system',
    body: 'Move straight into harvest, opportunities, or review flows without losing context.',
  },
];

export default function AlphaWhaleHome() {
  const { manualRefresh } = useHomeMetrics();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/cockpit');
    }
  }, [user, navigate]);

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: manualRefresh,
    threshold: 80,
  });

  return (
    <HomeAuthProvider>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />

      <div className="min-h-screen overflow-x-hidden bg-[#050505] text-[#f6f2ea]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.18),transparent_25%),radial-gradient(circle_at_20%_80%,rgba(214,192,141,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_34%)]" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 25%, rgba(126,163,242,0.08) 0%, transparent 45%)',
              'radial-gradient(circle at 78% 30%, rgba(214,192,141,0.08) 0%, transparent 42%)',
              'radial-gradient(circle at 52% 72%, rgba(255,255,255,0.03) 0%, transparent 40%)',
              'radial-gradient(circle at 20% 25%, rgba(126,163,242,0.08) 0%, transparent 45%)',
            ],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
        />

        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load header</div>}>
          <GlobalHeader className="border-white/8 bg-[#050505]/94" />
        </HomeErrorBoundary>

        <div className="relative mx-auto max-w-[1600px] px-4 pb-36 pt-8 sm:px-6 sm:pb-40 sm:pt-10 lg:px-8">
          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load landing page</div>}>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
              <div className="rounded-[34px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
                  Private market operating system
                </div>
                <h1
                  className="mt-6 max-w-4xl text-5xl leading-[0.95] tracking-tight text-[#f6f2ea] sm:text-6xl xl:text-7xl"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  See your wallets the way a serious desk would.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-7 text-[#b8b2a7] sm:text-lg">
                  WhalePulse combines signal flow, wallet safety, portfolio oversight, and tax execution into one clean surface.
                  No stitched dashboards. No toy charts. One operating layer for what matters now.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#f6f2ea] px-6 text-sm font-medium text-[#111111] transition hover:bg-[#ffffff]"
                  >
                    Start with your wallets
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/signals"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-[#f6f2ea] transition hover:bg-white/[0.06]"
                  >
                    View live signals
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Guardian</p>
                    <p className="mt-3 text-sm leading-6 text-[#f6f2ea]">Trust posture, approvals, and remediation.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Signals</p>
                    <p className="mt-3 text-sm leading-6 text-[#f6f2ea]">Whale flow with direct links into action.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Harvest</p>
                    <p className="mt-3 text-sm leading-6 text-[#f6f2ea]">Tax savings surfaced alongside real positions.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.18),rgba(255,255,255,0.02))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#dbe4ff]">Daily surface</p>
                  <p
                    className="mt-5 text-4xl text-[#f6f2ea]"
                    style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                  >
                    Good morning, Meghal
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d7ddef]">
                    One opening screen for signals, wallet health, and executable opportunities.
                  </p>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-[22px] border border-white/10 bg-[#0b0b0c]/65 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Current read</span>
                        <Sparkles className="h-4 w-4 text-[#d6c08d]" />
                      </div>
                      <p className="mt-3 text-2xl text-[#f6f2ea]">3 items need review</p>
                      <p className="mt-2 text-sm text-[#b8b2a7]">1 approval cleanup, 1 harvest window, 1 high-signal flow.</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-[#0b0b0c]/65 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">Wallet coverage</span>
                        <Wallet className="h-4 w-4 text-[#a7c0ff]" />
                      </div>
                      <p className="mt-3 text-2xl text-[#f6f2ea]">All wallets, one scope</p>
                      <p className="mt-2 text-sm text-[#b8b2a7]">Portfolio and Guardian read from the same wallet registry.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Trust surface</p>
                  <div className="mt-4 divide-y divide-white/8">
                    {trustRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-4">
                        <span className="text-sm text-[#9c978f]">{row.label}</span>
                        <span className="text-sm text-[#f6f2ea]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-3">
              {productCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.href}
                    className="group relative overflow-hidden rounded-[32px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] transition hover:border-white/14 hover:bg-[#101011]"
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">{card.eyebrow}</span>
                        <Icon className="h-5 w-5 text-[#f6f2ea]" />
                      </div>
                      <h2
                        className="mt-8 text-4xl text-[#f6f2ea]"
                        style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                      >
                        {card.title}
                      </h2>
                      <p className="mt-4 text-sm leading-6 text-[#b8b2a7]">{card.summary}</p>
                      <div className="mt-8 inline-flex items-center text-sm text-[#f6f2ea]">
                        Open {card.title}
                        <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-[34px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Signal desk preview</p>
                    <h3
                      className="mt-4 text-4xl text-[#f6f2ea]"
                      style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                    >
                      Follow flow without leaving the system
                    </h3>
                  </div>
                  <Link
                    to="/signals"
                    className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#f6f2ea] transition hover:bg-white/[0.06] md:inline-flex"
                  >
                    View signals
                  </Link>
                </div>

                <div className="mt-8 grid gap-4">
                  {[
                    { asset: 'ETH', move: '$14.2M', context: 'Custody accumulation across 3 wallets', tone: '#b9d5c0' },
                    { asset: 'SOL', move: '$9.8M', context: 'Exchange inflow flagged for review', tone: '#d6c08d' },
                    { asset: 'BTC', move: '$22.4M', context: 'High-conviction movement tied to known desks', tone: '#a7c0ff' },
                  ].map((row) => (
                    <div key={row.asset} className="grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[100px_120px_1fr] md:items-center">
                      <span className="text-lg text-[#f6f2ea]">{row.asset}</span>
                      <span className="text-lg text-[#f6f2ea]">{row.move}</span>
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.tone }} />
                        <span className="text-sm text-[#b8b2a7]">{row.context}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(214,192,141,0.15),rgba(255,255,255,0.02))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#eadfbf]">Why teams stay here</p>
                <div className="mt-6 space-y-5">
                  {systemPillars.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <div key={pillar.title} className="rounded-[24px] border border-white/10 bg-[#0b0b0c]/60 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full border border-white/10 bg-white/[0.04] p-2">
                            <Icon className="h-4 w-4 text-[#f6f2ea]" />
                          </div>
                          <p className="text-sm font-medium text-[#f6f2ea]">{pillar.title}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#d6d0c4]">{pillar.body}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[34px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">First hour</p>
                <h3
                  className="mt-4 text-4xl text-[#f6f2ea]"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  A cleaner onboarding path than a pile of dashboards
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#b8b2a7]">
                  The first-use path should feel like a product with conviction: connect wallets, read the system, then act from one place.
                </p>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {onboardingSteps.map((step) => (
                  <div key={step.step} className="rounded-[26px] border border-white/8 bg-white/[0.02] p-5">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">{step.step}</div>
                    <h4
                      className="mt-5 text-3xl text-[#f6f2ea]"
                      style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                    >
                      {step.title}
                    </h4>
                    <p className="mt-4 text-sm leading-6 text-[#b8b2a7]">{step.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#dbe4ff]">Start properly</p>
                  <h3
                    className="mt-4 text-4xl text-[#f6f2ea]"
                    style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                  >
                    Bring your wallets in once and use the full system from day one.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#d7ddef]">
                    Guardian, Hunter, Harvest, cockpit, and the signal desk should feel like one premium product. This page now points into that system.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#f6f2ea] px-6 text-sm font-medium text-[#111111] transition hover:bg-[#ffffff]"
                  >
                    Create account
                  </Link>
                  <Link
                    to="/signin"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-[#f6f2ea] transition hover:bg-white/[0.06]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#d7ddef]">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0c]/55 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[#b9d5c0]" />
                  Live wallet scope
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0c]/55 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[#b9d5c0]" />
                  Shared shell across products
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0c]/55 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[#b9d5c0]" />
                  Signals, Guardian, Harvest, Hunter
                </span>
              </div>
            </section>
          </HomeErrorBoundary>
        </div>

        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load footer</div>}>
          <FooterNav currentRoute="/" />
        </HomeErrorBoundary>
      </div>
    </HomeAuthProvider>
  );
}
