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
import { Droplets, Flag, Link2, Target } from 'lucide-react';
import { FooterNav } from '@/components/layout/FooterNav';

const timeframeOptions = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

const cardBaseClasses = 'relative overflow-hidden rounded-2xl backdrop-blur-md bg-[rgba(255,255,255,0.05)] border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-4 md:p-6 leading-relaxed';

const labelClass = 'text-sm uppercase tracking-[0.3em] text-gray-400';

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
  const uiMode = useUIMode();
  const mode = uiMode?.mode ?? 'novice';

  const [timeframe, setTimeframe] = useState('24h');

  const animatedValue = useAnimatedNumber(summary?.totalValue ?? 0);
  const animatedChange = useAnimatedNumber(summary?.pnl24hPct ?? 0);
  const animatedTrust = useAnimatedNumber(guardian?.trust ?? 0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.remove('dark', 'pro');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    if (savedTheme === 'pro') document.documentElement.classList.add('dark', 'pro');
  }, []);

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

  const renderLoading = () => (
    <LegendaryLayout mode={mode}>
      <Hub2Layout showBottomNav={false}>
        <PortfolioLayout>
          <div className="relative min-h-screen pb-32">
            <div className="absolute inset-0 bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />
            <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-6 space-y-8">
              <header className="flex items-center justify-between px-4 py-2 backdrop-blur-md bg-[rgba(16,18,30,0.75)] border-b border-white/10 sticky top-0 z-30 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/10" />
                  <div className="h-4 w-20 rounded-full bg-white/10" />
                </div>
                <div className="flex gap-1">
                  {timeframeOptions.map((option) => (
                    <span
                      key={option.value}
                      className={`rounded-xl px-3 py-1 text-sm ${
                        timeframe === option.value
                          ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
                          : 'text-gray-500'
                      }`}
                    >
                      {option.label.toUpperCase()}
                    </span>
                  ))}
                </div>
              </header>
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-36 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-36 rounded-2xl bg-white/5 animate-pulse" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
      <FooterNav />
    </LegendaryLayout>
  );

  if (summaryLoading) {
    return renderLoading();
  }

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout showBottomNav={false}>
        <PortfolioLayout>
          <div className="relative min-h-screen pb-32">
            <div className="absolute inset-0 bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />

            <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-6 space-y-8">
              <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between px-4 py-2 backdrop-blur-md bg-[rgba(16,18,30,0.75)] border-b border-white/10 sticky top-0 z-30 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <img src="/hero_logo_512.png" alt="AlphaWhale" className="h-6 w-6" />
                  <h1 className="text-lg font-semibold text-white">Portfolio</h1>
                </div>
                <div className="flex gap-1">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeframe(option.value)}
                      className={`rounded-xl px-3 py-1 text-sm transition ${
                        timeframe === option.value
                          ? 'bg-[#00C9A7]/10 text-[#00C9A7] font-semibold drop-shadow-[0_0_4px_#00C9A7]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {option.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </motion.header>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className={labelClass}>Portfolio Value</p>
                        <motion.p
                          key={summary?.totalValue}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="mt-4 text-5xl md:text-6xl font-semibold text-white"
                        >
                          {formatCurrency(portfolioValueDisplay ?? 0)}
                        </motion.p>
                        <motion.div
                          className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                            (summary?.pnl24hPct ?? 0) >= 0
                              ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
                              : 'bg-[#EF476F]/10 text-[#EF476F]'
                          }`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          {formatPercent(portfolioChangeDisplay ?? 0)}
                          <span className="text-xs text-gray-300 font-medium">24H change</span>
                        </motion.div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400">
                        Coverage: {timeframe.toUpperCase()} • Last synced {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleTimeString() : '—'}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card className={cardBaseClasses}>
                    <p className={labelClass}>Risk Score</p>
                    <p className="mt-4 text-4xl font-semibold text-[#FFD166]">
                      {summary?.riskScore !== undefined ? summary.riskScore.toFixed(1) : '—'}
                      <span className="text-base text-gray-500"> / 10</span>
                    </p>
                    <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                      Indicates current exposure balance relative to portfolio breadth.
                    </p>
                  </Card>
                  <Card className={cardBaseClasses}>
                    <p className={labelClass}>Trust Index</p>
                    <p className="mt-4 text-4xl font-semibold text-[#00C9A7]">
                      {summary?.trustIndex !== undefined ? summary.trustIndex : '—'}
                      <span className="text-base text-gray-500">%</span>
                    </p>
                    <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                      Confidence weighting anchored to AlphaWhale guardrails.
                    </p>
                  </Card>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className={labelClass}>Risk Snapshot</h2>
                    <span className="text-xs text-gray-400">Liquidity • Concentration • Correlation</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {riskLoading
                      ? [...Array(3)].map((_, index) => (
                          <div key={index} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                        ))
                      : riskSnapshot.map((snapshot) => {
                          const Icon = snapshot.icon;
                          const percentage = Math.min(snapshot.value * 10, 100);
                          return (
                            <motion.div
                              key={snapshot.label}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-4 text-center backdrop-blur"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                                  <Icon className="h-5 w-5 text-white/80" />
                                </div>
                                <p className="text-sm font-medium text-white">{snapshot.label}</p>
                                <p className="text-lg font-semibold text-white">
                                  {snapshot.value.toFixed(1)}
                                  <span className="text-sm text-gray-500"> / 10</span>
                                </p>
                                <p className="text-xs text-gray-400">{Math.round(percentage)}% health</p>
                              </div>
                            </motion.div>
                          );
                        })}
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className={cardBaseClasses}>
                  <p className={labelClass}>Guardian Intelligence Snapshot</p>
                  <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-end gap-6">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#00C9A7]/40 bg-[#00C9A7]/10">
                        <span className="text-4xl font-semibold text-[#00C9A7]">
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
                    <div className="flex-1 space-y-3">
                      {guardianLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, index) => (
                            <div key={index} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        (guardian?.flags ?? []).slice(0, 3).map((flagItem) => (
                          <div
                            key={flagItem.type}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
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
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card className={cardBaseClasses}>
                  <p className={labelClass}>Data Coverage Across Sources</p>
                  <div className="mt-6 space-y-4">
                    {provenanceSources.map((source, index) => (
                      <motion.div
                        key={source.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{source.label}</span>
                          <span className="text-[#00C9A7] font-semibold">{source.value}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#00C9A7] via-[#22D3EE] to-[#7C5CFF]"
                            style={{ width: `${source.value}%` }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.section>
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>

      <FooterNav />
    </LegendaryLayout>
  );
}
