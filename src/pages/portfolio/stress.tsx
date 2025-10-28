import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useStress } from '@/hooks/portfolio/useStress';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import {
  Activity,
  Banknote,
  Bell,
  Bitcoin,
  Coins,
  Compass,
  Home,
  Scale,
  Shield,
  ShieldOff,
  Wallet,
  Zap
} from 'lucide-react';

const modeOptions = [
  { label: 'Novice', value: 'novice' },
  { label: 'Pro', value: 'pro' },
  { label: 'Sim', value: 'sim' }
] as const;

type ModeValue = typeof modeOptions[number]['value'];

type ScenarioKey =
  | 'ethereum'
  | 'bitcoin'
  | 'altcoins'
  | 'stablecoinDepeg'
  | 'liquidityCrisis'
  | 'regulatoryShock';

type ScenarioConfig = Record<ScenarioKey, number>;

const scenarioMeta: Array<{
  key: ScenarioKey;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}> = [
  {
    key: 'ethereum',
    label: 'Ethereum Shock',
    description: 'Layer 1 volatility ripple',
    icon: Coins,
    color: '#7C5CFF'
  },
  {
    key: 'bitcoin',
    label: 'Bitcoin Drawdown',
    description: 'Macro driven sell-off',
    icon: Bitcoin,
    color: '#FFD166'
  },
  {
    key: 'altcoins',
    label: 'Altcoin Capitulation',
    description: 'Risk rotation to majors',
    icon: Zap,
    color: '#FF6666'
  },
  {
    key: 'stablecoinDepeg',
    label: 'Stablecoin Depeg',
    description: 'Peg dislocation detected',
    icon: Banknote,
    color: '#00C9A7'
  },
  {
    key: 'liquidityCrisis',
    label: 'Liquidity Crunch',
    description: 'Order book depth evaporates',
    icon: ShieldOff,
    color: '#F97316'
  },
  {
    key: 'regulatoryShock',
    label: 'Regulatory Shock',
    description: 'Policy turbulence warning',
    icon: Scale,
    color: '#22D3EE'
  }
];

const predefinedScenarios = [
  {
    name: 'Institutional Liquidity Squeeze',
    description: 'Liquidity providers retreat, spreads widen 4x.',
    impacts: {
      ethereum: -35,
      bitcoin: -28,
      altcoins: -55,
      stablecoinDepeg: -8,
      liquidityCrisis: -45,
      regulatoryShock: -20
    }
  },
  {
    name: 'Global Risk-Off Cascade',
    description: 'Macro shock triggers synchronized deleveraging.',
    impacts: {
      ethereum: -30,
      bitcoin: -32,
      altcoins: -48,
      stablecoinDepeg: -4,
      liquidityCrisis: -38,
      regulatoryShock: -30
    }
  },
  {
    name: 'Positive Catalyst Rally',
    description: 'ETF approvals and global adoption spike demand.',
    impacts: {
      ethereum: 15,
      bitcoin: 18,
      altcoins: 22,
      stablecoinDepeg: 4,
      liquidityCrisis: 0,
      regulatoryShock: -5
    }
  }
];

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
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const severityBackground = (value: number) => {
  if (value >= 0) return 'bg-[#00C9A7]/10 border-[#00C9A7]/40';
  if (value >= -15) return 'bg-[#22D3EE]/10 border-[#22D3EE]/40';
  if (value >= -35) return 'bg-[#FFD166]/10 border-[#FFD166]/40';
  return 'bg-[#FF6666]/10 border-[#FF6666]/40';
};

const severityText = (value: number) => {
  if (value >= 0) return 'text-[#00C9A7]';
  if (value >= -15) return 'text-[#22D3EE]';
  if (value >= -35) return 'text-[#FFD166]';
  return 'text-[#FF6666]';
};

const footerLinks = [
  { icon: Home, label: 'Main', href: '/hub' },
  { icon: Activity, label: 'Pulse', href: '/hub2/pulse' },
  { icon: Compass, label: 'Explore', href: '/hunter' },
  { icon: Bell, label: 'Alerts', href: '/guardian' },
  { icon: Shield, label: 'Guardian', href: '/guardian' },
  { icon: Wallet, label: 'Portfolio', href: '/portfolio' }
];

const useAnimatedNumber = (target?: number, duration = 600) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number') return;

    let start: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(target * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
};

export default function Stress() {
  const { data: summary } = usePortfolioSummary();
  const { setParams, run, result, isRunning } = useStress();
  const ui = useUIMode();

  const [localMode, setLocalMode] = useState<ModeValue>(ui?.mode ?? 'novice');
  const [panelView, setPanelView] = useState<'run' | 'custom' | 'predefined'>('custom');
  const [scenarios, setScenarios] = useState<ScenarioConfig>({
    ethereum: -30,
    bitcoin: -25,
    altcoins: -50,
    stablecoinDepeg: -5,
    liquidityCrisis: -40,
    regulatoryShock: -35
  });

  const portfolioValue = summary?.totalValue ?? 125000;
  const pnl24h = summary?.pnl24hPct ?? 0;
  const riskScore = summary?.riskScore ?? 0;
  const trustIndex = summary?.trustIndex ?? 0;

  const animatedValue = useAnimatedNumber(portfolioValue);
  const animatedChange = useAnimatedNumber(pnl24h);
  const animatedRisk = useAnimatedNumber(riskScore);
  const animatedTrust = useAnimatedNumber(trustIndex);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.remove('dark', 'pro');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    if (savedTheme === 'pro') document.documentElement.classList.add('dark', 'pro');
  }, []);

  useEffect(() => {
    if (ui?.mode) {
      setLocalMode(ui.mode as ModeValue);
    }
  }, [ui?.mode]);

  const scenarioSummaries = useMemo(() => {
    return scenarioMeta.map((scenario) => {
      const raw = scenarios[scenario.key];
      const percentage = Math.abs(raw);
      const projected = portfolioValue * (1 + raw / 100);
      const delta = projected - portfolioValue;
      return {
        ...scenario,
        value: raw,
        percentage,
        projected,
        delta
      };
    });
  }, [scenarios, portfolioValue]);

  const handleScenarioUpdate = (key: ScenarioKey, value: number) => {
    setScenarios((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRunStressTest = async () => {
    setParams({
      eth: scenarios.ethereum,
      btc: scenarios.bitcoin,
      alts: scenarios.altcoins,
      depeg: scenarios.stablecoinDepeg <= -10,
      corrBreak: scenarios.liquidityCrisis <= -30
    });

    await run({
      ethereum: scenarios.ethereum,
      bitcoin: scenarios.bitcoin,
      altcoins: scenarios.altcoins,
      stablecoinDepeg: scenarios.stablecoinDepeg,
      liquidityCrisis: scenarios.liquidityCrisis,
      regulatoryShock: scenarios.regulatoryShock
    });
    setPanelView('run');
  };

  const applyPredefinedScenario = (impacts: ScenarioConfig) => {
    setScenarios(impacts);
    setPanelView('custom');
  };

  const resilienceMessage = useMemo(() => {
    if (!result) return 'Awaiting simulation output. Configure parameters to run your stress sequence.';
    const worstCase = result.worstCase || 0;
    const lossPct = (worstCase / (portfolioValue || 1)) * 100;

    if (lossPct < 20) {
      return `Resilience verified. Worst-case drawdown ${formatCurrency(worstCase)} — stronger than 78% of tracked cohorts.`;
    }

    if (lossPct < 40) {
      return `Moderate exposure detected. ${formatCurrency(worstCase)} at risk under compound shocks.`;
    }

    return `Warning: Elevated fragility. ${formatCurrency(worstCase)} vulnerable — diversify across uncorrelated buckets.`;
  }, [result, portfolioValue]);

  return (
    <LegendaryLayout mode={ui?.mode ?? 'novice'}>
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
                className="flex items-center justify-between backdrop-blur-md bg-[rgba(16,18,30,0.75)] border-b border-white/10 px-4 py-2 sticky top-0 z-30 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <img src="/hero_logo_512.png" alt="AlphaWhale" className="h-6 w-6" />
                  <h1 className="text-lg font-semibold text-white">Stress Test</h1>
                </div>
                <p className="text-xs text-gray-400">
                  Simulate extreme market conditions • <span className="text-[#00C9A7]">Live</span>
                </p>
                <div className="flex gap-1">
                  {modeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocalMode(option.value);
                        if (option.value === 'novice' || option.value === 'pro') {
                          ui?.setMode?.(option.value);
                        }
                      }}
                      className={`rounded-xl px-3 py-1 text-sm transition-colors ${
                        localMode === option.value
                          ? 'bg-[#00C9A7]/10 text-[#00C9A7] font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Portfolio Value</p>
                  <motion.p
                    key={portfolioValue}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-4 text-5xl font-semibold text-white"
                  >
                    {formatCurrency(animatedValue || 0)}
                  </motion.p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#00C9A7]/10 px-4 py-1.5 text-sm font-semibold text-[#00C9A7]">
                    {formatPercent(animatedChange || 0)}
                    <span className="text-xs text-gray-300 font-medium">24H delta</span>
                  </div>
                  <p className="mt-6 text-xs text-gray-400">Resilience baseline before stress simulation.</p>
                </Card>

                <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Risk & Trust</p>
                  <div className="mt-4 flex items-end gap-8">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">Risk Score</p>
                      <p className="mt-2 text-4xl font-semibold text-[#FFD166]">
                        {(animatedRisk || 0).toFixed(1)}
                        <span className="text-base text-gray-500"> / 10</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">Trust Index</p>
                      <p className="mt-2 text-4xl font-semibold text-[#00C9A7]">
                        {(animatedTrust || 0).toFixed(0)}
                        <span className="text-base text-gray-500">%</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-6 text-xs text-gray-400">Medium risk posture with high trust confidence.</p>
                </Card>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRunStressTest}
                    className="rounded-xl bg-gradient-to-r from-[#00C9A7] to-[#7C5CFF] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,201,167,0.35)] transition"
                    disabled={isRunning}
                  >
                    {isRunning ? 'Running...' : 'Run Stress Test'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPanelView('custom')}
                    className={`rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-200 transition ${
                      panelView === 'custom' ? 'border-[#00C9A7]/50 text-white shadow-[0_8px_24px_rgba(0,201,167,0.25)]' : ''
                    }`}
                  >
                    Custom Scenarios
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPanelView('predefined')}
                    className={`rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-200 transition ${
                      panelView === 'predefined' ? 'border-[#7C5CFF]/50 text-white shadow-[0_8px_24px_rgba(124,92,255,0.25)]' : ''
                    }`}
                  >
                    Predefined Tests
                  </motion.button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                  <span className="font-semibold text-[#00C9A7]">AlphaWhale Assurance:</span> {resilienceMessage}
                </div>
              </div>

              {panelView === 'custom' && (
                <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 backdrop-blur">
                  <div className="grid gap-6 md:grid-cols-2">
                    {scenarioMeta.slice(0, 3).map((scenario) => (
                      <div key={scenario.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{scenario.label}</p>
                            <p className="text-xs text-gray-400">{scenario.description}</p>
                          </div>
                          <span className={`text-sm font-semibold ${severityText(scenarios[scenario.key])}`}>
                            {formatPercent(scenarios[scenario.key])}
                          </span>
                        </div>
                        <Slider
                          min={-80}
                          max={20}
                          step={1}
                          value={[scenarios[scenario.key]]}
                          onValueChange={(value) => handleScenarioUpdate(scenario.key, value[0])}
                          className="w-full"
                        />
                      </div>
                    ))}
                    {scenarioMeta.slice(3).map((scenario) => (
                      <div key={scenario.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{scenario.label}</p>
                            <p className="text-xs text-gray-400">{scenario.description}</p>
                          </div>
                          <span className={`text-sm font-semibold ${severityText(scenarios[scenario.key])}`}>
                            {formatPercent(scenarios[scenario.key])}
                          </span>
                        </div>
                        <Slider
                          min={-60}
                          max={30}
                          step={1}
                          value={[scenarios[scenario.key]]}
                          onValueChange={(value) => handleScenarioUpdate(scenario.key, value[0])}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {panelView === 'predefined' && (
                <div className="grid gap-4 md:grid-cols-3">
                  {predefinedScenarios.map((preset) => (
                    <motion.div
                      key={preset.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] p-4 backdrop-blur cursor-pointer"
                      onClick={() => applyPredefinedScenario(preset.impacts)}
                    >
                      <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{preset.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-300">
                        {Object.entries(preset.impacts).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="rounded-lg bg-white/5 px-3 py-2 flex items-center justify-between">
                            <span className="capitalize text-[11px] text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className={`${severityText(value)} font-semibold`}>{formatPercent(value)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Market Impact Scenarios</h2>
                  <span className="text-xs text-gray-400">Live sliders drive scenario calibration</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {scenarioSummaries.map((scenario, index) => (
                    <motion.div
                      key={scenario.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`rounded-2xl border ${severityBackground(scenario.value)} p-4 backdrop-blur space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <scenario.icon className="h-5 w-5 text-white/80" />
                          <div>
                            <p className="text-sm font-semibold text-white">{scenario.label}</p>
                            <p className="text-xs text-gray-400">{scenario.description}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${severityText(scenario.value)}`}>
                          {formatPercent(scenario.value)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.abs(scenario.value), 100)}%`,
                            background: scenario.value >= 0
                              ? 'linear-gradient(90deg, rgba(0,201,167,1) 0%, rgba(124,92,255,1) 100%)'
                              : 'linear-gradient(90deg, rgba(255,102,102,1) 0%, rgba(255,180,112,1) 100%)'
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Projected value</span>
                        <span className="text-white font-medium">{formatCurrency(scenario.projected)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Projected Impact</h2>
                  <span className="text-xs text-gray-400">Outputs streamed from AlphaWhale engine</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {scenarioSummaries.map((scenario, index) => (
                    <motion.div
                      key={scenario.key}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.07 }}
                    >
                      <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-5 backdrop-blur space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white">{scenario.label}</h3>
                          <span className={`text-xs font-medium ${severityText(scenario.value)}`}>
                            {scenario.value >= 0 ? 'Upside scenario' : 'Downside scenario'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Portfolio Value: <span className="text-white font-medium">{formatCurrency(scenario.projected)}</span></p>
                        <p className={`${scenario.delta < 0 ? 'text-[#FF6666]' : 'text-[#00C9A7]'} text-sm font-semibold`}>
                          {scenario.delta < 0 ? 'Loss' : 'Gain'}: {formatCurrency(Math.abs(scenario.delta))}
                        </p>
                        <p className="text-xs text-gray-500">{formatPercent(scenario.value)} shock simulated.</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur space-y-4">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Stress Engine Summary</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Simulated recovery curve</h3>
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                          Worst case capital at risk {formatCurrency(result.worstCase)}. Expected loss {formatCurrency(result.expectedLoss)} with recovery horizon of {result.recoveryMonths} months.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-[#FF6666]/40 bg-[#FF6666]/10 px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">Worst Case</p>
                          <p className="mt-2 text-sm font-semibold text-[#FF6666]">{formatCurrency(result.worstCase)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#FFD166]/40 bg-[#FFD166]/10 px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">Expected Loss</p>
                          <p className="mt-2 text-sm font-semibold text-[#FFD166]">{formatCurrency(result.expectedLoss)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#00C9A7]/40 bg-[#00C9A7]/10 px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">Recovery</p>
                          <p className="mt-2 text-sm font-semibold text-[#00C9A7]">{result.recoveryMonths} mo</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendations?.map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-gray-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>

      <footer className="fixed bottom-0 inset-x-0 z-40 h-16 backdrop-blur-md bg-[rgba(16,18,30,0.8)] border-t border-white/10">
        <nav className="mx-auto flex h-full max-w-screen-md items-center justify-around px-4 text-[11px] uppercase tracking-[0.2em] text-gray-400">
          {footerLinks.map(({ icon: Icon, label, href }) => {
            const isActive = label === 'Portfolio';
            return (
              <a
                key={label}
                href={href}
                className={`flex flex-col items-center gap-1 transition ${
                  isActive ? 'text-[#00C9A7] drop-shadow-[0_0_6px_#00C9A7]' : 'hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#00C9A7]' : ''}`} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </footer>
    </LegendaryLayout>
  );
}
