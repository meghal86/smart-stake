import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useRisk } from '@/hooks/portfolio/useRisk';
import { useGuardian } from '@/hooks/portfolio/useGuardian';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { FooterNav } from '@/components/layout/FooterNav';
import { Droplets, Flag, Link2, Target } from 'lucide-react';

const timeframeOptions = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

const modeOptions = [
  { label: 'Novice', value: 'novice' },
  { label: 'Pro', value: 'pro' },
  { label: 'Sim', value: 'sim' }
];

const cardBaseClasses = 'relative overflow-hidden rounded-2xl backdrop-blur-md bg-[rgba(255,255,255,0.05)] border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-4 md:p-6 leading-relaxed';

const labelClass = 'text-sm uppercase tracking-[0.3em] text-gray-400';

const metricLabelClass = 'text-xs font-medium text-gray-400 uppercase tracking-[0.2em]';

const useAnimatedNumber = (target?: number, duration = 800) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number') return;

    let start: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(target * progress);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return value;
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100000 ? 0 : 2
  }).format(value);
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  const signed = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  return `${signed}%`;
};

const severityClass: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/40',
  medium: 'bg-[#FFD166]/10 text-[#FFD166] border border-[#FFD166]/40',
  high: 'bg-[#EF476F]/10 text-[#EF476F] border border-[#EF476F]/40'
};

const resolveAnimatedValue = (animated: number, target?: number) => {
  if (typeof target !== 'number') return animated;
  return target >= 0 ? Math.min(animated, target) : Math.max(animated, target);
};

export default function Overview() {
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { metrics, isLoading: riskLoading } = useRisk();
  const { data: guardian, isLoading: guardianLoading } = useGuardian();
  const {
    mode,
    setMode
  } = useUIMode() || { mode: 'novice' as const, setMode: (_mode: 'novice' | 'pro') => undefined };

  const [timeframe, setTimeframe] = useState('24h');
  const [localMode, setLocalMode] = useState<'novice' | 'pro' | 'sim'>(mode);

  const animatedValue = useAnimatedNumber(summary?.totalValue ?? 0);
  const animatedChange = useAnimatedNumber(summary?.pnl24hPct ?? 0);
  const animatedTrust = useAnimatedNumber(guardian?.trust ?? 0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.remove('dark', 'pro');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    if (savedTheme === 'pro') document.documentElement.classList.add('dark', 'pro');
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const portfolioLink = footer.querySelector('a[href="/portfolio"]') as HTMLElement | null;
    const portfolioIcon = portfolioLink?.querySelector('div') as HTMLElement | null;
    const hunterLink = footer.querySelector('a[href="/hunter"]') as HTMLElement | null;
    const hunterIcon = hunterLink?.querySelector('div') as HTMLElement | null;

    const originalStates = {
      portfolioColor: portfolioLink?.style.color,
      portfolioFilter: portfolioLink?.style.filter,
      portfolioBackground: portfolioIcon?.style.background,
      portfolioShadow: portfolioIcon?.style.boxShadow,
      hunterColor: hunterLink?.style.color,
      hunterFilter: hunterLink?.style.filter,
      hunterBackground: hunterIcon?.style.background,
      hunterShadow: hunterIcon?.style.boxShadow
    };

    if (portfolioLink) {
      portfolioLink.style.color = '#00C9A7';
      portfolioLink.style.filter = 'drop-shadow(0 0 6px #00C9A7)';
    }
    if (portfolioIcon) {
      portfolioIcon.style.background = 'linear-gradient(135deg, rgba(0,201,167,0.45), rgba(124,92,255,0.45))';
      portfolioIcon.style.boxShadow = '0 0 20px rgba(0,201,167,0.35)';
    }

    if (hunterLink) {
      hunterLink.style.color = 'rgba(209,213,219,0.7)';
      hunterLink.style.filter = 'none';
    }
    if (hunterIcon) {
      hunterIcon.style.background = 'rgba(255,255,255,0.05)';
      hunterIcon.style.boxShadow = 'none';
    }

    return () => {
      if (portfolioLink) {
        portfolioLink.style.color = originalStates.portfolioColor || '';
        portfolioLink.style.filter = originalStates.portfolioFilter || '';
      }
      if (portfolioIcon) {
        portfolioIcon.style.background = originalStates.portfolioBackground || '';
        portfolioIcon.style.boxShadow = originalStates.portfolioShadow || '';
      }
      if (hunterLink) {
        hunterLink.style.color = originalStates.hunterColor || '';
        hunterLink.style.filter = originalStates.hunterFilter || '';
      }
      if (hunterIcon) {
        hunterIcon.style.background = originalStates.hunterBackground || '';
        hunterIcon.style.boxShadow = originalStates.hunterShadow || '';
      }
    };
  }, []);

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  const provenanceSources = useMemo(
    () => [
      { label: 'Etherscan API', value: 95 },
      { label: 'CoinGecko Pricing', value: 100 },
      { label: 'DeFi Protocols', value: 75 },
      { label: 'Guardian Intelligence', value: 88 }
    ],
    []
  );

  const totalFlags = useMemo(
    () => guardian?.flags?.reduce((acc, flag) => acc + flag.count, 0) ?? 0,
    [guardian?.flags]
  );

  const portfolioValueDisplay = summary ? resolveAnimatedValue(animatedValue, summary.totalValue) : undefined;
  const portfolioChangeDisplay = summary ? resolveAnimatedValue(animatedChange, summary.pnl24hPct) : undefined;
  const trustDisplay = guardian ? resolveAnimatedValue(animatedTrust, guardian.trust) : undefined;

  const riskSnapshot = useMemo(
    () => [
      {
        label: 'Liquidity',
        value: metrics?.liquidity ?? 0,
        icon: Droplets,
        color: '#00C9A7'
      },
      {
        label: 'Concentration',
        value: metrics?.concentration ?? 0,
        icon: Target,
        color: '#FFD166'
      },
      {
        label: 'Correlation',
        value: metrics?.correlation ?? 0,
        icon: Link2,
        color: '#7C5CFF'
      }
    ],
    [metrics]
  );

  const cards = [
    'Portfolio Value',
    'Risk Overview',
    'Data Provenance',
    'Risk Snapshot',
    'Guardian Scan'
  ];

  const renderUnderline = (isActive: boolean) => (
    isActive ? (
      <motion.span
        layoutId="activeTab"
        className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#00C9A7]"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    ) : null
  );

  const renderLoading = () => (
    <LegendaryLayout mode={mode}>
      <Hub2Layout showBottomNav={false}>
        <PortfolioLayout>
          <div className="relative min-h-full pb-24">
            <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          </div>
          <FooterNav />
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );

  if (summaryLoading) {
    return renderLoading();
  }

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout showBottomNav={false}>
        <PortfolioLayout>
          <div className="relative min-h-full bg-gradient-to-br from-[#080B14] via-[#0F1422] to-[#070A12] pb-32">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.15),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.12),transparent_50%)]" />
            <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-6 space-y-8">
              <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between backdrop-blur-md bg-[rgba(16,18,30,0.75)] border-b border-white/10 px-4 py-2 sticky top-0 z-40 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <img src="/hero_logo_512.png" alt="AlphaWhale" className="h-6 w-6" />
                  <h1 className="text-lg font-semibold text-white font-display">Portfolio</h1>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cinematic overview • Updated {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleString() : 'just now'}
                </p>
                <div className="flex gap-1">
                  {modeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocalMode(option.value as 'novice' | 'pro' | 'sim');
                        if (option.value === 'novice' || option.value === 'pro') {
                          setMode(option.value);
                        }
                      }}
                      className={`relative rounded-xl px-3 py-1 text-sm transition-colors ${
                        localMode === option.value
                          ? 'bg-[#00C9A7]/10 text-[#00C9A7] font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                      {renderUnderline(localMode === option.value)}
                    </button>
                  ))}
                </div>
              </motion.header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {cards.map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={index === 0 ? 'w-full md:col-span-2' : 'w-full'}
                  >
                    {index === 0 && (
                      <Card className={cardBaseClasses}>
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className={labelClass}>Portfolio Value</p>
                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                              {timeframeOptions.map((option) => (
                                <motion.button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setTimeframe(option.value)}
                                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                                    timeframe === option.value
                                      ? 'bg-[#00C9A7]/10 text-[#00C9A7] font-semibold shadow-[0_0_12px_rgba(0,201,167,0.35)]'
                                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {option.label}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <motion.span className="mt-1 block text-4xl sm:text-6xl font-bold text-white font-display">
                                {portfolioValueDisplay !== undefined ? formatCurrency(portfolioValueDisplay) : '—'}
                              </motion.span>
                              <motion.div
                                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                                  (summary?.pnl24hPct ?? 0) >= 0
                                    ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
                                    : 'bg-[#EF476F]/10 text-[#EF476F]'
                                }`}
                              >
                                {portfolioChangeDisplay !== undefined ? formatPercent(portfolioChangeDisplay) : '—'}
                                <span className="text-xs font-medium text-gray-300">24H change</span>
                              </motion.div>
                            </div>
                            <div className="grid gap-2 text-sm text-gray-400">
                              <p>Coverage window: {timeframe.toUpperCase()}</p>
                              <p>Last synced: {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleTimeString() : '—'}</p>
                              <p>Total alerts: {totalFlags}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {index === 1 && (
                      <Card className={cardBaseClasses}>
                        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
                          <div>
                            <p className={labelClass}>Portfolio Risk Posture</p>
                            <p className="mt-2 text-lg font-semibold text-white leading-relaxed">
                              Balance between trust and exposure
                            </p>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <p className={metricLabelClass}>Risk Score</p>
                              <p className="mt-2 text-3xl font-semibold text-[#FFD166]">
                                {summary?.riskScore !== undefined ? summary.riskScore.toFixed(1) : '—'}
                                <span className="text-base text-gray-500"> / 10</span>
                              </p>
                            </div>
                            <div>
                              <p className={metricLabelClass}>Trust Index</p>
                              <p className="mt-2 text-3xl font-semibold text-[#00C9A7]">
                                {summary?.trustIndex ?? '—'}
                                <span className="text-base text-gray-500">%</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {index === 2 && (
                      <Card className={cardBaseClasses}>
                        <p className={labelClass}>Data Coverage Across Sources</p>
                        <div className="mt-6 space-y-4">
                          {provenanceSources.map((source, sourceIndex) => (
                            <motion.div
                              key={source.label}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: sourceIndex * 0.08 }}
                            >
                              <div className="flex items-center justify-between text-sm text-gray-300">
                                <span>{source.label}</span>
                                <span className="text-[#00C9A7] font-semibold">{source.value}%</span>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#00C9A7] via-[#22D3EE] to-[#7C5CFF]"
                                  style={{ width: `${source.value}%` }}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {index === 3 && (
                      <Card className={cardBaseClasses}>
                        <p className={labelClass}>Risk Snapshot</p>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          {riskLoading
                            ? [...Array(3)].map((_, skeletonIndex) => (
                                <div key={skeletonIndex} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                              ))
                            : riskSnapshot.map((snapshot) => {
                                const Icon = snapshot.icon;
                                const percentage = Math.min(snapshot.value * 10, 100);
                                return (
                                  <motion.div
                                    key={snapshot.label}
                                    className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur"
                                    whileHover={{ scale: 1.03 }}
                                  >
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                                        <Icon className="h-5 w-5 text-white/80" />
                                      </div>
                                      <span>{snapshot.label}</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4">
                                      <span className="text-2xl font-semibold text-white">
                                        {snapshot.value.toFixed(1)}
                                        <span className="text-sm text-gray-500"> / 10</span>
                                      </span>
                                      <div
                                        className="relative h-14 w-14"
                                        style={{
                                          background: `conic-gradient(${snapshot.color} ${percentage * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
                                        }}
                                      >
                                        <div className="absolute inset-1 rounded-full bg-[rgba(16,18,30,0.9)] flex items-center justify-center text-sm text-white/80">
                                          {Math.round(percentage)}%
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                        </div>
                      </Card>
                    )}

                    {index === 4 && (
                      <Card className={cardBaseClasses}>
                        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                          <div>
                            <p className={labelClass}>Trust Intelligence Snapshot</p>
                            <div className="mt-4 flex items-end gap-4">
                              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#00C9A7]/40 bg-[#00C9A7]/10">
                                <span className="text-3xl font-semibold text-[#00C9A7] font-display">
                                  {trustDisplay !== undefined ? trustDisplay.toFixed(0) : '0'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-300">Trust Score</p>
                                <p className="text-xs text-gray-400">
                                  Last scan {guardian?.lastScan ? new Date(guardian.lastScan).toLocaleTimeString() : '—'}
                                </p>
                                <p className="text-xs text-gray-400">Total flags: {totalFlags}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            {guardianLoading ? (
                              <div className="space-y-3">
                                {[...Array(3)].map((_, skeletonIndex) => (
                                  <div key={skeletonIndex} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                                ))}
                              </div>
                            ) : (
                              (guardian?.flags ?? []).slice(0, 3).map((flagItem) => (
                                <div
                                  key={flagItem.type}
                                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 border border-white/10"
                                >
                                  <div className="flex items-center gap-3">
                                    <Flag className="h-4 w-4 text-white/70" />
                                    <div>
                                      <p className="text-sm text-white capitalize">{flagItem.type}</p>
                                      <p className="text-xs text-gray-400">Occurrences: {flagItem.count}</p>
                                    </div>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClass[flagItem.severity]}`}>
                                    {flagItem.severity}
                                  </span>
                                </div>
                              ))
                            )}
                            {(!guardian?.flags || guardian.flags.length === 0) && !guardianLoading && (
                              <div className="rounded-xl border border-[#00C9A7]/40 bg-[#00C9A7]/10 px-4 py-3 text-sm text-[#00C9A7]">
                                No active security flags detected.
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <FooterNav />
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}
