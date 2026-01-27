import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import {
  Activity,
  Bitcoin,
  Coins,
  Banknote,
  Zap,
  ShieldOff,
  Scale,
  TrendingDown,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

type ScenarioKey =
  | 'ethereum'
  | 'bitcoin'
  | 'altcoins'
  | 'stablecoinDepeg'
  | 'liquidityCrisis'
  | 'regulatoryShock';

type ScenarioConfig = Record<ScenarioKey, number>;

interface StressTestPanelProps {
  portfolioValue: number;
  onRunTest?: (scenarios: ScenarioConfig) => void;
}

const scenarioMeta: Array<{
  key: ScenarioKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
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
    color: '#00F5A0'
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100000 ? 0 : 2
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const severityColor = (value: number) => {
  if (value >= 0) return 'text-[#00F5A0]';
  if (value >= -15) return 'text-blue-400';
  if (value >= -35) return 'text-yellow-400';
  return 'text-red-400';
};

const severityBg = (value: number) => {
  if (value >= 0) return 'bg-[#00F5A0]/10 border-[#00F5A0]/30';
  if (value >= -15) return 'bg-blue-500/10 border-blue-500/30';
  if (value >= -35) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

export function StressTestPanel({ portfolioValue, onRunTest }: StressTestPanelProps) {
  const [view, setView] = useState<'custom' | 'predefined' | 'results'>('custom');
  const [isRunning, setIsRunning] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioConfig>({
    ethereum: -30,
    bitcoin: -25,
    altcoins: -50,
    stablecoinDepeg: -5,
    liquidityCrisis: -40,
    regulatoryShock: -35
  });
  const [results, setResults] = useState<{
    worstCase: number;
    expectedLoss: number;
    recoveryMonths: number;
    recommendations: string[];
  } | null>(null);

  const scenarioSummaries = useMemo(() => {
    return scenarioMeta.map((scenario) => {
      const raw = scenarios[scenario.key];
      const projected = portfolioValue * (1 + raw / 100);
      const delta = projected - portfolioValue;
      return {
        ...scenario,
        value: raw,
        projected,
        delta
      };
    });
  }, [scenarios, portfolioValue]);

  const totalImpact = useMemo(() => {
    const avgImpact = Object.values(scenarios).reduce((sum, val) => sum + val, 0) / Object.values(scenarios).length;
    return portfolioValue * (avgImpact / 100);
  }, [scenarios, portfolioValue]);

  const handleScenarioUpdate = (key: ScenarioKey, value: number) => {
    setScenarios((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRunStressTest = async () => {
    setIsRunning(true);
    
    // Simulate stress test calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const avgLoss = Object.values(scenarios).reduce((sum, val) => sum + val, 0) / Object.values(scenarios).length;
    const worstCase = Math.min(...Object.values(scenarios));
    
    setResults({
      worstCase: portfolioValue * (worstCase / 100),
      expectedLoss: portfolioValue * (avgLoss / 100),
      recoveryMonths: Math.abs(Math.floor(avgLoss / 5)),
      recommendations: [
        'Diversify across uncorrelated assets',
        'Increase stablecoin allocation',
        'Consider hedging strategies',
        'Review liquidity positions'
      ]
    });
    
    setView('results');
    setIsRunning(false);
    
    if (onRunTest) {
      onRunTest(scenarios);
    }
  };

  const applyPredefinedScenario = (impacts: ScenarioConfig) => {
    setScenarios(impacts);
    setView('custom');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00F5A0]" />
            Stress Test Simulator
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Simulate extreme market conditions and assess portfolio resilience
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setView('custom')}
          className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
            view === 'custom'
              ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Custom Scenarios
        </motion.button>
        <motion.button
          onClick={() => setView('predefined')}
          className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
            view === 'predefined'
              ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Predefined Tests
        </motion.button>
        {results && (
          <motion.button
            onClick={() => setView('results')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              view === 'results'
                ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Results
          </motion.button>
        )}
      </div>

      {/* Custom Scenarios View */}
      {view === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Scenario Sliders */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            {scenarioMeta.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <div key={scenario.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{scenario.label}</p>
                        <p className="text-xs text-gray-400">{scenario.description}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${severityColor(scenarios[scenario.key])}`}>
                      {formatPercent(scenarios[scenario.key])}
                    </span>
                  </div>
                  <Slider
                    min={-80}
                    max={30}
                    step={1}
                    value={[scenarios[scenario.key]]}
                    onValueChange={(value) => handleScenarioUpdate(scenario.key, value[0])}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Value</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(portfolioValue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Projected Impact</p>
              <p className={`text-3xl font-bold ${totalImpact < 0 ? 'text-red-400' : 'text-[#00F5A0]'}`}>
                {formatCurrency(totalImpact)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Projected Value</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(portfolioValue + totalImpact)}
              </p>
            </div>
          </div>

          {/* Run Button */}
          <motion.button
            onClick={handleRunStressTest}
            disabled={isRunning}
            className="w-full bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-[0_10px_30px_rgba(0,245,160,0.35)] hover:shadow-[0_15px_40px_rgba(0,245,160,0.45)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isRunning ? 1 : 1.02, y: isRunning ? 0 : -2 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Stress Test...
              </span>
            ) : (
              'Run Stress Test'
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Predefined Scenarios View */}
      {view === 'predefined' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {predefinedScenarios.map((preset, index) => (
            <motion.div
              key={preset.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => applyPredefinedScenario(preset.impacts)}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4 className="text-lg font-semibold text-white mb-2">{preset.name}</h4>
              <p className="text-sm text-gray-400 mb-4">{preset.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(preset.impacts).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className={`text-sm font-semibold ${severityColor(value)}`}>
                      {formatPercent(value)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Results View */}
      {view === 'results' && results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Worst Case</p>
              </div>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(results.worstCase)}</p>
              <p className="text-xs text-gray-500 mt-2">Maximum potential loss</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Expected Loss</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{formatCurrency(results.expectedLoss)}</p>
              <p className="text-xs text-gray-500 mt-2">Average scenario impact</p>
            </div>
            <div className="bg-[#00F5A0]/10 border border-[#00F5A0]/30 backdrop-blur-md rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#00F5A0]" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Recovery Time</p>
              </div>
              <p className="text-3xl font-bold text-[#00F5A0]">{results.recoveryMonths} mo</p>
              <p className="text-xs text-gray-500 mt-2">Estimated recovery period</p>
            </div>
          </div>

          {/* Scenario Breakdown */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Scenario Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarioSummaries.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <div
                    key={scenario.key}
                    className={`${severityBg(scenario.value)} border backdrop-blur-md rounded-2xl p-4`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-white/80" />
                        <p className="text-sm font-medium text-white">{scenario.label}</p>
                      </div>
                      <span className={`text-sm font-semibold ${severityColor(scenario.value)}`}>
                        {formatPercent(scenario.value)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Projected Value</span>
                        <span className="text-white font-medium">{formatCurrency(scenario.projected)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Impact</span>
                        <span className={scenario.delta < 0 ? 'text-red-400' : 'text-[#00F5A0]'}>
                          {formatCurrency(scenario.delta)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
            <div className="space-y-3">
              {results.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 bg-white/5 rounded-xl p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#00F5A0] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
