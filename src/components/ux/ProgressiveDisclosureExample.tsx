/**
 * Progressive Disclosure Example Component
 * 
 * Demonstrates the progressive disclosure system with working examples.
 * Shows expandable opportunity cards and portfolio overview with breakdown.
 * 
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { ExpandableCard, ExpandableCardSection, ExpandableCardGrid } from './ExpandableCard';
import { ExpandableOpportunityCard } from './ExpandableOpportunityCard';
import { ExpandablePortfolioOverview } from './ExpandablePortfolioOverview';

// Mock data for examples
const mockOpportunity = {
  id: 'example-airdrop',
  type: 'Airdrop' as const,
  title: 'Example DeFi Airdrop',
  description: 'Participate in this exciting airdrop opportunity with high rewards and low risk.',
  reward: '18.5%',
  confidence: 92,
  duration: '21 days',
  guardianScore: 9,
  riskLevel: 'Low' as const,
  chain: 'Ethereum',
  protocol: 'ExampleDeFi',
  details: {
    liquidity: 2500000,
    volume24h: 450000,
    participants: 3200,
    timeRemaining: '18 days',
    requirements: [
      'Hold minimum 50 EXAMPLE tokens',
      'Complete social media tasks',
      'Maintain wallet activity for 30 days'
    ],
    risks: [
      'Smart contract audit pending',
      'Token price volatility',
      'Regulatory uncertainty'
    ],
    methodology: 'Rewards are distributed based on token holdings, social engagement, and wallet activity score. The calculation uses a weighted algorithm that favors long-term holders.',
    lastUpdated: '2024-01-15 14:30 UTC'
  }
};

const mockPortfolioData = {
  totalValue: 285000,
  pnl24h: 4200,
  pnlPercent: 1.49,
  riskScore: 8.2,
  riskChange: 0.4,
  whaleActivity: 12,
  breakdown: {
    trustIndex: 8.7,
    trustChange: 0.3,
    chainDistribution: [
      { chain: 'Ethereum', value: 180000, percentage: 63.2, color: '#627EEA' },
      { chain: 'Polygon', value: 65000, percentage: 22.8, color: '#8247E5' },
      { chain: 'Arbitrum', value: 40000, percentage: 14.0, color: '#28A0F0' }
    ],
    topHoldings: [
      { symbol: 'ETH', value: 120000, percentage: 42.1, change24h: 2.3 },
      { symbol: 'MATIC', value: 45000, percentage: 15.8, change24h: -0.8 },
      { symbol: 'ARB', value: 35000, percentage: 12.3, change24h: 4.1 },
      { symbol: 'USDC', value: 30000, percentage: 10.5, change24h: 0.0 }
    ],
    riskFactors: [
      { factor: 'Concentration Risk', level: 'Medium' as const, impact: 0.4, description: 'High exposure to ETH' },
      { factor: 'Liquidity Risk', level: 'Low' as const, impact: 0.1, description: 'Good liquidity across assets' },
      { factor: 'Smart Contract Risk', level: 'Low' as const, impact: 0.2, description: 'Audited protocols only' }
    ],
    performanceMetrics: {
      sharpeRatio: 1.45,
      maxDrawdown: -12.8,
      volatility: 22.3,
      beta: 1.15
    },
    lastUpdated: '2024-01-15 15:45 UTC'
  }
};

export function ProgressiveDisclosureExample() {
  const handleJoinQuest = (opportunity: any) => {
    console.log('Joining quest:', opportunity.title);
    alert(`Joining quest: ${opportunity.title}`);
  };

  const handleBreakdownToggle = (isExpanded: boolean) => {
    console.log('Portfolio breakdown toggled:', isExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Progressive Disclosure System
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Demonstration of expandable cards with smooth animations and scroll position maintenance.
            Key information is shown first, with detailed breakdowns available on demand.
          </p>
        </div>

        {/* Portfolio Overview Example */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Portfolio Overview with Breakdown
          </h2>
          <p className="text-gray-300">
            Shows portfolio value with "See breakdown" functionality revealing detailed metrics, 
            chain distribution, top holdings, and performance analytics.
          </p>
          <ExpandablePortfolioOverview 
            data={mockPortfolioData}
            onBreakdownToggle={handleBreakdownToggle}
          />
        </section>

        {/* Opportunity Card Example */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Expandable Opportunity Card
          </h2>
          <p className="text-gray-300">
            Shows key metrics (reward, confidence, Guardian score) first, with detailed information 
            including requirements, risks, and methodology available via "See Breakdown".
          </p>
          <ExpandableOpportunityCard
            opportunity={mockOpportunity}
            index={0}
            onJoinQuest={handleJoinQuest}
            autoCollapse={false}
          />
        </section>

        {/* Basic Expandable Cards Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Basic Expandable Cards
          </h2>
          <p className="text-gray-300">
            Demonstrates the core expandable card functionality with auto-collapse behavior.
          </p>
          
          <ExpandableCardGrid columns={2} gap="lg">
            <ExpandableCard
              id="feature-1"
              autoCollapse={true}
              header={<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Feature Analysis</h3>}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Score</span>
                  <span className="text-lg font-bold text-green-600">8.5/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</span>
                  <span className="text-lg font-bold text-blue-600">94%</span>
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard
              id="feature-2"
              autoCollapse={true}
              header={<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Market Insights</h3>}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Cap</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">$2.4B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24h Volume</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">$145M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trend</span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Bullish</span>
                </div>
              </div>
            </ExpandableCard>
          </ExpandableCardGrid>
        </section>

        {/* Features Demonstration */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Key Features Demonstrated
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Smooth Animations</h3>
              <p className="text-gray-300 text-sm">
                300ms ease-out transitions for expand/collapse with Framer Motion integration.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Scroll Position</h3>
              <p className="text-gray-300 text-sm">
                Maintains scroll position during expansion to prevent jarring jumps.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Auto-Collapse</h3>
              <p className="text-gray-300 text-sm">
                Optional accordion behavior where expanding one card collapses others.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Accessibility</h3>
              <p className="text-gray-300 text-sm">
                Full keyboard navigation and ARIA attributes for screen readers.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Progressive Info</h3>
              <p className="text-gray-300 text-sm">
                Shows key information first, detailed breakdowns on demand.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Customizable</h3>
              <p className="text-gray-300 text-sm">
                Flexible API with custom toggle buttons, headers, and content sections.
              </p>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Usage Instructions
          </h2>
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="space-y-4">
              <p className="text-gray-300">
                <strong className="text-white">Click "See Details" or "See Breakdown"</strong> buttons to expand cards and view detailed information.
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Auto-collapse behavior:</strong> In the basic cards section, expanding one card will automatically collapse the other.
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Keyboard navigation:</strong> Use Tab to focus buttons and Enter/Space to activate them.
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Scroll position:</strong> Notice how the page maintains your scroll position when cards expand/collapse.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}