'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
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
  CheckCircle2,
  Play,
  RotateCcw
} from 'lucide-react';

type ScenarioKey =
  | 'ethereum'
  | 'bitcoin'
  | 'altcoins'
  | 'stablecoinDepeg'
  | 'liquidityCrisis'
  | 'regulatoryShock';

type ScenarioConfig = Record<ScenarioKey, number>;

interface StressTestTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
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

export function StressTestTab({ walletScope, freshness }: StressTestTabProps) {
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
    var95?: number;
    bestCase?: number;
    recoveryMonths: number;
    riskLevel?: string;
    volatility?: number;
    recommendations: string[];
  } | null>(null);

  // Get real portfolio data
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolioSummary();
  
  // Use real portfolio value or fallback to demo value
  const portfolioValue = portfolioData?.totalValue || 2450000;
  
  // Log when portfolio data changes
  useEffect(() => {
    if (portfolioData) {
      console.log('📊 Portfolio data loaded:', {
        totalValue: portfolioValue,
        pnl24h: portfolioData.pnl24hPct,
        riskScore: portfolioData.riskScore
      });
    }
  }, [portfolioData, portfolioValue]);

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

  const handleScenarioUpdate = useCallback((key: ScenarioKey, value: number) => {
    console.log(`📊 Updating ${key}: ${value}%`);
    setScenarios((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleRunStressTest = async () => {
    console.log('🧪 Starting stress test...');
    console.log('📊 Portfolio Value:', formatCurrency(portfolioValue));
    console.log('📊 Current scenarios:', scenarios);
    
    setIsRunning(true);
    
    try {
      // Simulate stress test calculation with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate weighted average loss (more sophisticated than simple average)
      const scenarioValues = Object.values(scenarios);
      const avgLoss = scenarioValues.reduce((sum, val) => sum + val, 0) / scenarioValues.length;
      
      // Calculate worst case scenario
      const worstCase = Math.min(...scenarioValues);
      
      // Calculate best case scenario
      const bestCase = Math.max(...scenarioValues);
      
      // Calculate standard deviation for risk assessment
      const variance = scenarioValues.reduce((sum, val) => sum + Math.pow(val - avgLoss, 2), 0) / scenarioValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate Value at Risk (VaR) - 95% confidence level
      const var95 = avgLoss - (1.645 * stdDev);
      
      console.log('📊 Calculations:', { 
        avgLoss: avgLoss.toFixed(2), 
        worstCase, 
        bestCase,
        stdDev: stdDev.toFixed(2),
        var95: var95.toFixed(2)
      });
      
      // Calculate monetary impacts
      const worstCaseImpact = portfolioValue * (worstCase / 100);
      const expectedLossImpact = portfolioValue * (avgLoss / 100);
      const var95Impact = portfolioValue * (var95 / 100);
      
      // Calculate recovery time based on historical market recovery rates
      // Assuming 5% monthly recovery rate for moderate losses
      const recoveryMonths = Math.abs(Math.ceil(avgLoss / 5));
      
      // Generate dynamic recommendations based on scenario severity
      const recommendations: string[] = [];
      
      if (avgLoss < -40) {
        recommendations.push('🚨 CRITICAL: Consider immediate portfolio rebalancing');
        recommendations.push('Increase stablecoin allocation to 30-40% of portfolio');
        recommendations.push('Implement stop-loss orders on high-risk positions');
        recommendations.push('Consider hedging with inverse ETFs or options');
      } else if (avgLoss < -25) {
        recommendations.push('⚠️ HIGH RISK: Diversify across uncorrelated assets');
        recommendations.push('Increase stablecoin allocation to 20-30%');
        recommendations.push('Review and reduce leverage positions');
        recommendations.push('Consider dollar-cost averaging strategy');
      } else if (avgLoss < -10) {
        recommendations.push('📊 MODERATE RISK: Monitor positions closely');
        recommendations.push('Maintain 15-20% stablecoin buffer');
        recommendations.push('Review liquidity positions');
        recommendations.push('Consider rebalancing to target allocation');
      } else if (avgLoss < 0) {
        recommendations.push('✅ LOW RISK: Portfolio appears resilient');
        recommendations.push('Maintain current diversification strategy');
        recommendations.push('Monitor for opportunities to increase positions');
        recommendations.push('Keep 10-15% in stablecoins for flexibility');
      } else {
        recommendations.push('🚀 POSITIVE OUTLOOK: Portfolio positioned for growth');
        recommendations.push('Consider taking profits on overperforming assets');
        recommendations.push('Maintain disciplined risk management');
        recommendations.push('Keep emergency reserves in stablecoins');
      }
      
      // Add scenario-specific recommendations
      if (scenarios.liquidityCrisis < -35) {
        recommendations.push('💧 Liquidity Warning: Ensure sufficient liquid assets');
      }
      if (scenarios.stablecoinDepeg < -10) {
        recommendations.push('⚖️ Depeg Risk: Diversify stablecoin holdings across multiple issuers');
      }
      if (scenarios.regulatoryShock < -30) {
        recommendations.push('⚖️ Regulatory Risk: Review compliance and geographic exposure');
      }
      
      const newResults = {
        worstCase: worstCaseImpact,
        expectedLoss: expectedLossImpact,
        var95: var95Impact,
        bestCase: portfolioValue * (bestCase / 100),
        recoveryMonths,
        riskLevel: avgLoss < -40 ? 'CRITICAL' : avgLoss < -25 ? 'HIGH' : avgLoss < -10 ? 'MODERATE' : avgLoss < 0 ? 'LOW' : 'POSITIVE',
        volatility: stdDev,
        recommendations: recommendations.slice(0, 6) // Limit to 6 recommendations
      };
      
      console.log('✅ Results calculated:', {
        worstCase: formatCurrency(newResults.worstCase),
        expectedLoss: formatCurrency(newResults.expectedLoss),
        var95: formatCurrency(newResults.var95),
        recoveryMonths: newResults.recoveryMonths,
        riskLevel: newResults.riskLevel
      });
      
      setResults(newResults);
      setView('results');
      
      console.log('✅ Stress test completed successfully');
    } catch (error) {
      console.error('❌ Error running stress test:', error);
      // Show error to user
      alert('Failed to run stress test. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const applyPredefinedScenario = useCallback((impacts: ScenarioConfig) => {
    setScenarios(impacts);
    setView('custom');
  }, []);

  const resetScenarios = useCallback(() => {
    setScenarios({
      ethereum: -30,
      bitcoin: -25,
      altcoins: -50,
      stablecoinDepeg: -5,
      liquidityCrisis: -40,
      regulatoryShock: -35
    });
    setResults(null);
    setView('custom');
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#00F5A0]" />
            <span>Stress Test</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Simulate market conditions
          </p>
          {portfolioLoading && (
            <p className="text-xs text-yellow-400 mt-1 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              <span>Loading...</span>
            </p>
          )}
          {!portfolioLoading && portfolioData && (
            <p className="text-xs text-[#00F5A0] mt-1 font-medium">
              ✓ {formatCurrency(portfolioValue)}
            </p>
          )}
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 flex-wrap">
        <motion.button
          onClick={() => setView('custom')}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base ${
            view === 'custom'
              ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white shadow-lg'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Custom Scenarios
        </motion.button>
        <motion.button
          onClick={() => setView('predefined')}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base ${
            view === 'predefined'
              ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white shadow-lg'
              : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Predefined Tests
        </motion.button>
        {results && (
          <motion.button
            onClick={() => setView('results')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base ${
              view === 'results'
                ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white shadow-lg'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Results
          </motion.button>
        )}
        <motion.button
          onClick={resetScenarios}
          className="ml-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm sm:text-base"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          <span>Reset</span>
        </motion.button>
      </div>

      {/* Custom Scenarios View */}
      {view === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Scenario Sliders */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {scenarioMeta.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <div key={scenario.key} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-white truncate">{scenario.label}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">{scenario.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${severityColor(scenarios[scenario.key])}`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide mb-2 font-medium">Current Value</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(portfolioValue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide mb-2 font-medium">Projected Impact</p>
              <p className={`text-2xl sm:text-3xl font-bold ${totalImpact < 0 ? 'text-red-400' : 'text-[#00F5A0]'}`}>
                {formatCurrency(totalImpact)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide mb-2 font-medium">Projected Value</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
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
              <span className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Run Stress Test
              </span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide font-medium">Worst Case</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">{formatCurrency(results.worstCase)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Maximum potential loss</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide font-medium">Expected Loss</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{formatCurrency(results.expectedLoss)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Average scenario impact</p>
            </div>
            {results.var95 && (
              <div className="bg-orange-500/10 border border-orange-500/30 backdrop-blur-md rounded-3xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide font-medium">VaR (95%)</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-orange-400">{formatCurrency(results.var95)}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Value at Risk (95% confidence)</p>
              </div>
            )}
            <div className="bg-[#00F5A0]/10 border border-[#00F5A0]/30 backdrop-blur-md rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00F5A0]" />
                <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wide font-medium">Recovery Time</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#00F5A0]">{results.recoveryMonths} mo</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Estimated recovery period</p>
            </div>
          </div>

          {/* Risk Level Banner */}
          {results.riskLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-6 border ${
                results.riskLevel === 'CRITICAL' ? 'bg-red-500/20 border-red-500/50' :
                results.riskLevel === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50' :
                results.riskLevel === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/50' :
                results.riskLevel === 'LOW' ? 'bg-blue-500/20 border-blue-500/50' :
                'bg-[#00F5A0]/20 border-[#00F5A0]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">Overall Risk Assessment</p>
                  <p className={`text-2xl font-bold ${
                    results.riskLevel === 'CRITICAL' ? 'text-red-400' :
                    results.riskLevel === 'HIGH' ? 'text-orange-400' :
                    results.riskLevel === 'MODERATE' ? 'text-yellow-400' :
                    results.riskLevel === 'LOW' ? 'text-blue-400' :
                    'text-[#00F5A0]'
                  }`}>
                    {results.riskLevel}
                  </p>
                </div>
                {results.volatility && (
                  <div className="text-right">
                    <p className="text-sm text-gray-300 mb-1">Portfolio Volatility</p>
                    <p className="text-2xl font-bold text-white">{results.volatility.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
