import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Target, Droplets, Link2, DollarSign, TrendingDown, Shield } from 'lucide-react';
import { GuardianInsightCard } from './GuardianInsightCard';
import { PortfolioHeroCard } from './PortfolioHeroCard';
import { RiskSnapshotCard } from './RiskSnapshotCard';

// Import original portfolio pages
const RiskAnalysis = React.lazy(() => import('../../pages/portfolio/risk'));
const StressTest = React.lazy(() => import('../../pages/portfolio/stress'));
const Results = React.lazy(() => import('../../pages/portfolio/results'));
const Addresses = React.lazy(() => import('../../pages/portfolio/addresses'));
const Guardian = React.lazy(() => import('../../pages/portfolio/guardian'));

interface TabContentProps {
  activeTab: string;
  riskData?: unknown;
  guardianData?: unknown;
  summaryData?: unknown;
  isLoading?: boolean;
}



export function PortfolioTabContent({ 
  activeTab, 
  riskData, 
  guardianData,
  summaryData,
  isLoading = false 
}: TabContentProps) {
  if (activeTab === 'overview') {
    const riskSnapshot = [
      {
        label: 'Liquidity',
        score: riskData?.liquidity ?? 0,
        icon: Droplets,
        color: '#00C9A7'
      },
      {
        label: 'Concentration',
        score: riskData?.concentration ?? 0,
        icon: Target,
        color: '#FFD166'
      },
      {
        label: 'Correlation',
        score: riskData?.correlation ?? 0,
        icon: Link2,
        color: '#7C5CFF'
      }
    ];
    
    return (
      <div className="space-y-8">
        {/* Hero Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PortfolioHeroCard
              title="Portfolio Value"
              value={summaryData?.totalValue ?? 0}
              icon={DollarSign}
              change={summaryData?.pnl24hPct}
              lastSync={summaryData?.updatedAt ? new Date(summaryData.updatedAt) : undefined}
              isLoading={isLoading}
              variant="currency"
              tooltip="Total USD value of all your crypto holdings across connected wallets"
              userMode="novice"
            />
            <PortfolioHeroCard
              title="Risk Score"
              value={summaryData?.riskScore ?? 0}
              icon={TrendingDown}
              lastSync={summaryData?.updatedAt ? new Date(summaryData.updatedAt) : undefined}
              isLoading={isLoading}
              variant="score"
              tooltip="Risk assessment from 0-10 based on portfolio concentration, volatility, and market exposure"
              userMode="novice"
            />
            <PortfolioHeroCard
              title="Trust Index"
              value={summaryData?.trustIndex ?? 0}
              icon={Shield}
              lastSync={guardianData?.lastScan ? new Date(guardianData.lastScan) : undefined}
              isLoading={isLoading}
              variant="percentage"
              tooltip="Confidence score based on Guardian security analysis and data quality"
              userMode="novice"
            />
          </div>
        </motion.section>

        {/* Risk Snapshot Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Risk Snapshot
              </h2>
              <span className="text-xs text-gray-400">
                Liquidity • Concentration • Correlation
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {riskSnapshot.map((snapshot) => (
                <RiskSnapshotCard
                  key={snapshot.label}
                  label={snapshot.label}
                  score={snapshot.score}
                  icon={snapshot.icon}
                  color={snapshot.color}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Guardian Intelligence Snapshot */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <GuardianInsightCard
            trustScore={guardianData?.trust ?? 0}
            flags={guardianData?.flags ?? []}
            lastScan={guardianData?.lastScan ? new Date(guardianData.lastScan) : undefined}
            isLoading={isLoading}
            onViewGuardian={() => window.location.href = '/guardian'}
          />
        </motion.section>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'risk':
        return <RiskAnalysis />;
      case 'stress':
        return <StressTest />;
      case 'guardian':
        return <Guardian />;
      case 'results':
        return <Results />;
      case 'addresses':
        return <Addresses />;
      default:
        return null;
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        {renderTabContent()}
      </Suspense>
    </motion.div>
  );
}