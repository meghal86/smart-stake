/**
 * ExpandablePortfolioOverview Component
 * 
 * Enhanced portfolio overview with progressive disclosure.
 * Shows Portfolio Value with "See breakdown" functionality.
 * 
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Zap,
  PieChart,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Percent,
  Globe,
  Users
} from 'lucide-react';
import { ExpandableCard, ExpandableCardSection } from './ExpandableCard';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PortfolioData {
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  riskScore: number;
  riskChange: number;
  whaleActivity: number;
  // Extended breakdown data
  breakdown?: {
    trustIndex: number;
    trustChange: number;
    chainDistribution: Array<{
      chain: string;
      value: number;
      percentage: number;
      color: string;
    }>;
    topHoldings: Array<{
      symbol: string;
      value: number;
      percentage: number;
      change24h: number;
    }>;
    riskFactors: Array<{
      factor: string;
      level: 'Low' | 'Medium' | 'High';
      impact: number;
      description: string;
    }>;
    performanceMetrics: {
      sharpeRatio: number;
      maxDrawdown: number;
      volatility: number;
      beta: number;
    };
    lastUpdated: string;
  };
}

interface ExpandablePortfolioOverviewProps {
  data: PortfolioData;
  isDarkTheme?: boolean;
  className?: string;
  onBreakdownToggle?: (isExpanded: boolean) => void;
}

export function ExpandablePortfolioOverview({ 
  data, 
  isDarkTheme = true,
  className,
  onBreakdownToggle
}: ExpandablePortfolioOverviewProps) {
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return isDarkTheme ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50';
    if (score >= 6) return isDarkTheme ? 'text-yellow-400 bg-yellow-400/10' : 'text-yellow-600 bg-yellow-50';
    return isDarkTheme ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-50';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 8) return 'Low Risk';
    if (score >= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getTrustColor = (score: number) => {
    if (score >= 8) return isDarkTheme ? 'text-blue-400' : 'text-blue-600';
    if (score >= 6) return isDarkTheme ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkTheme ? 'text-red-400' : 'text-red-600';
  };

  // Key information (always visible)
  const keyContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Total Value */}
      <div className="lg:col-span-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Total Portfolio Value
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <Activity className={`h-4 w-4 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Real-time aggregated value across all monitored addresses</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-bold ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {formatValue(data.totalValue)}
          </span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            data.pnlPercent >= 0 
              ? (isDarkTheme ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-100')
              : (isDarkTheme ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-100')
          }`}>
            {data.pnlPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(data.pnlPercent)}
          </div>
        </div>
        <div className={`mt-2 text-sm ${
          isDarkTheme ? 'text-gray-400' : 'text-gray-600'
        }`}>
          24h Change: <span className={data.pnl24h >= 0 
            ? (isDarkTheme ? 'text-green-400' : 'text-green-600')
            : (isDarkTheme ? 'text-red-400' : 'text-red-600')
          }>
            {data.pnl24h >= 0 ? '+' : ''}{formatValue(data.pnl24h)}
          </span>
        </div>
      </div>

      {/* Risk Score */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Risk Score
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <Shield className={`h-4 w-4 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Composite risk based on whale activity, concentration, and market conditions</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {data.riskScore.toFixed(1)}
          </span>
          <Badge className={getRiskColor(data.riskScore)}>
            {getRiskLabel(data.riskScore)}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm">
          {data.riskChange >= 0 ? (
            <TrendingUp className={`h-3 w-3 ${
              isDarkTheme ? 'text-green-400' : 'text-green-500'
            }`} />
          ) : (
            <TrendingDown className={`h-3 w-3 ${
              isDarkTheme ? 'text-red-400' : 'text-red-500'
            }`} />
          )}
          <span className={data.riskChange >= 0 
            ? (isDarkTheme ? 'text-green-400' : 'text-green-600')
            : (isDarkTheme ? 'text-red-400' : 'text-red-600')
          }>
            {data.riskChange >= 0 ? '+' : ''}{data.riskChange.toFixed(1)} vs yesterday
          </span>
        </div>
      </div>

      {/* Whale Activity */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Whale Activity
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <Zap className={`h-4 w-4 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Recent whale interactions affecting your portfolio</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {data.whaleActivity}
          </span>
          <Badge variant={data.whaleActivity > 10 ? 'destructive' : data.whaleActivity > 5 ? 'default' : 'secondary'}>
            {data.whaleActivity > 10 ? 'High' : data.whaleActivity > 5 ? 'Medium' : 'Low'}
          </Badge>
        </div>
        <div className={`mt-1 text-sm ${
          isDarkTheme ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Last 24h interactions
        </div>
      </div>
    </div>
  );

  // Detailed breakdown (expandable)
  const expandedContent = data.breakdown && (
    <div className="space-y-8">
      {/* Trust Index */}
      <ExpandableCardSection title="Trust & Security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-5 h-5 ${getTrustColor(data.breakdown.trustIndex)}`} />
              <span className={`text-lg font-semibold ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                Trust Index: {data.breakdown.trustIndex.toFixed(1)}/10
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                data.breakdown.trustChange >= 0 
                  ? (isDarkTheme ? 'text-green-400' : 'text-green-600')
                  : (isDarkTheme ? 'text-red-400' : 'text-red-600')
              }`}>
                {data.breakdown.trustChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(data.breakdown.trustChange)}
              </div>
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Based on protocol audits, Guardian scores, and historical performance
            </p>
          </div>
          
          {/* Risk Factors */}
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Risk Factors
            </h4>
            <div className="space-y-2">
              {data.breakdown.riskFactors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {factor.factor}
                  </span>
                  <Badge 
                    variant={factor.level === 'Low' ? 'secondary' : factor.level === 'Medium' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {factor.level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ExpandableCardSection>

      {/* Chain Distribution */}
      <ExpandableCardSection title="Chain Distribution">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {data.breakdown.chainDistribution.map((chain, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chain.color }}
                  />
                  <span className={`text-sm font-medium ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {chain.chain}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    isDarkTheme ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatValue(chain.value)}
                  </div>
                  <div className={`text-xs ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {chain.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Visual representation could go here */}
          <div className={`flex items-center justify-center p-8 rounded-lg border-2 border-dashed ${
            isDarkTheme ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
          }`}>
            <div className="text-center">
              <PieChart className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Chart visualization</p>
            </div>
          </div>
        </div>
      </ExpandableCardSection>

      {/* Top Holdings */}
      <ExpandableCardSection title="Top Holdings">
        <div className="space-y-3">
          {data.breakdown.topHoldings.map((holding, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDarkTheme ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {holding.symbol.slice(0, 2)}
                </div>
                <span className={`font-medium ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {holding.symbol}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatValue(holding.value)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>
                    {holding.percentage.toFixed(1)}%
                  </span>
                  <span className={holding.change24h >= 0 
                    ? (isDarkTheme ? 'text-green-400' : 'text-green-600')
                    : (isDarkTheme ? 'text-red-400' : 'text-red-600')
                  }>
                    {formatPercent(holding.change24h)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ExpandableCardSection>

      {/* Performance Metrics */}
      <ExpandableCardSection title="Performance Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              {data.breakdown.performanceMetrics.sharpeRatio.toFixed(2)}
            </div>
            <div className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Sharpe Ratio
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              {data.breakdown.performanceMetrics.maxDrawdown.toFixed(1)}%
            </div>
            <div className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Max Drawdown
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              {data.breakdown.performanceMetrics.volatility.toFixed(1)}%
            </div>
            <div className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Volatility
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              {data.breakdown.performanceMetrics.beta.toFixed(2)}
            </div>
            <div className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Beta
            </div>
          </div>
        </div>
      </ExpandableCardSection>

      {/* Last Updated */}
      <div className={`text-xs text-center ${
        isDarkTheme ? 'text-gray-500' : 'text-gray-400'
      }`}>
        Last updated: {data.breakdown.lastUpdated}
      </div>
    </div>
  );

  return (
    <ExpandableCard
      id="portfolio-overview"
      expandedContent={expandedContent}
      className={`p-6 ${
        isDarkTheme 
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
          : 'bg-gradient-to-br from-slate-50 to-white border-gray-200'
      } shadow-lg ${className}`}
      showToggleButton={!!data.breakdown}
      onStateChange={onBreakdownToggle}
      toggleButton={data.breakdown && (
        <motion.button
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isDarkTheme
              ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/20'
              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BarChart3 className="w-4 h-4" />
          <span>See Breakdown</span>
        </motion.button>
      )}
    >
      {keyContent}
    </ExpandableCard>
  );
}