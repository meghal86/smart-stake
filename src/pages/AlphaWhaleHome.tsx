import { HomeErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { HomeAuthProvider } from '@/lib/context/HomeAuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Leaf,
  Shield,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const modules = [
  {
    title: 'Guardian',
    eyebrow: 'Wallet safety',
    body: 'Check token permissions, wallet trust, and the next safest cleanup.',
    href: '/guardian',
    icon: Shield,
  },
  {
    title: 'Hunter',
    eyebrow: 'Signal desk',
    body: 'Read whale flow with context and move directly into the right action.',
    href: '/hunter',
    icon: Compass,
  },
  {
    title: 'Harvest',
    eyebrow: 'Tax execution',
    body: 'Review harvest windows and execution-ready savings in one place.',
    href: '/harvestpro',
    icon: Leaf,
  },
];

const previewRows = [
  { label: 'Wallet safety', value: 'Guardian', tone: '#9bc0ff' },
  { label: 'Live signals', value: 'Hunter', tone: '#d8c08a' },
  { label: 'Tax moves', value: 'Harvest', tone: '#9fd2b4' },
];

const authHref = (path: string) => `/login?next=${encodeURIComponent(path)}`;
const HERO_CACHE_KEY = 'whalepulse-marketing-hero-v1';
const HERO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export default function AlphaWhaleHome() {
  const { manualRefresh } = useHomeMetrics();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/cockpit');
    }
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadHeroImage = async () => {
      try {
        const cachedRaw = window.localStorage.getItem(HERO_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { imageDataUrl?: string; cachedAt?: number };
          if (cached.imageDataUrl && cached.cachedAt && Date.now() - cached.cachedAt < HERO_CACHE_TTL_MS) {
            if (!cancelled) {
              setHeroImage(cached.imageDataUrl);
            }
            return;
          }
        }
      } catch {
        // Ignore invalid cache and regenerate.
      }

      try {
        const { data, error } = await supabase.functions.invoke('marketing-hero-image', {
          body: { variant: 'landing' },
        });

        if (!error && data?.imageDataUrl) {
          if (!cancelled) {
            setHeroImage(data.imageDataUrl);
          }
          window.localStorage.setItem(
            HERO_CACHE_KEY,
            JSON.stringify({ imageDataUrl: data.imageDataUrl, cachedAt: Date.now() }),
          );
        }
      } catch {
        // Keep gradient fallback if generation is unavailable.
      }
    };

    void loadHeroImage();

    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.14),transparent_26%),radial-gradient(circle_at_18%_72%,rgba(196,152,82,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_32%)]" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 22% 18%, rgba(126,163,242,0.10) 0%, transparent 38%)',
              'radial-gradient(circle at 76% 28%, rgba(196,152,82,0.10) 0%, transparent 36%)',
              'radial-gradient(circle at 55% 78%, rgba(255,255,255,0.03) 0%, transparent 34%)',
              'radial-gradient(circle at 22% 18%, rgba(126,163,242,0.10) 0%, transparent 38%)',
            ],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
        />

        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load header</div>}>
          <GlobalHeader className="border-white/8 bg-[#050505]/94" />
        </HomeErrorBoundary>

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-[1500px] items-center px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load landing page</div>}>
            <section className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
              <div className="flex flex-col justify-center rounded-[36px] border border-white/8 bg-[#0a0a0b] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.34)] sm:p-10">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
                  Private market operating system
                </div>

                <h1
                  className="mt-6 max-w-4xl text-5xl leading-[0.94] tracking-tight text-[#f6f2ea] sm:text-6xl xl:text-7xl"
                  style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                >
                  One clean screen for every wallet decision.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-[#b8b2a7] sm:text-lg">
                  See live signals, wallet risk, portfolio scope, and tax actions in one place.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={authHref('/settings/wallets/add')}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#f6f2ea] px-6 text-sm font-medium text-[#111111] transition hover:bg-white"
                  >
                    Connect your wallets
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/signals"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-[#f6f2ea] transition hover:bg-white/[0.06]"
                  >
                    View live signals
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 md:grid-cols-3">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <Link
                        key={module.title}
                        to={authHref(module.href)}
                        className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/14 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">{module.eyebrow}</p>
                          <Icon className="h-4 w-4 text-[#f6f2ea]" />
                        </div>
                        <p className="mt-4 text-2xl text-[#f6f2ea]" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                          {module.title}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(160deg,#111621_0%,#0a0d14_40%,#17110a_100%)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.34)] sm:p-8">
                  {heroImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-65"
                      style={{ backgroundImage: `url("${heroImage}")` }}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.2),rgba(5,5,5,0.64)_42%,rgba(5,5,5,0.88)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(126,163,242,0.32),transparent_24%),radial-gradient(circle_at_78%_24%,rgba(212,169,93,0.24),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_30%)]" />
                  <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[#b58442]/18 blur-3xl" />
                  <div className="pointer-events-none absolute -left-14 bottom-8 h-52 w-52 rounded-full bg-[#5575b6]/20 blur-3xl" />

                  <div className="relative flex h-full min-h-[440px] flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[#c4cde3]">Private desk preview</p>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#f6f2ea]">
                        Live routes
                      </span>
                    </div>

                    <div className="mx-auto flex w-full max-w-[360px] flex-1 items-center justify-center py-10">
                      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/12 bg-black/30 p-6 backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.28em] text-[#a7c0ff]">Desk surface</p>
                              <p className="mt-3 text-3xl text-[#f6f2ea]" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                                WhalePulse
                              </p>
                            </div>
                            <img src="/header.png" alt="WhalePulse mark" className="h-14 w-14 rounded-full object-cover opacity-95" />
                          </div>

                          <div className="mt-8 space-y-3">
                            {previewRows.map((row) => (
                              <div key={row.label} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/25 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.tone }} />
                                  <span className="text-sm text-[#f6f2ea]">{row.label}</span>
                                </div>
                                <span className="text-sm text-[#cfc8bb]">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#cfc8bb]">Daily opening read</p>
                        <p
                          className="mt-3 text-4xl text-[#f6f2ea]"
                          style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
                        >
                          One place to see what matters.
                        </p>
                        <p className="mt-3 max-w-sm text-sm leading-6 text-[#d2cbbe]">
                          Signals, wallet checks, and portfolio scope stay tied to the same wallet set.
                        </p>
                      </div>
                      <Sparkles className="hidden h-8 w-8 text-[#d8c08a] sm:block" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </HomeErrorBoundary>
        </div>
      </div>
    </HomeAuthProvider>
  );
}
