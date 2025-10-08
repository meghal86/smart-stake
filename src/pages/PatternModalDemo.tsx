/**
 * PatternModalDemo - Showcase the world-class Pattern Modal
 * Tesla × Airbnb × Robinhood × Perplexity DNA demonstration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatternModal } from '@/components/signals/PatternModal';
import SignalCard from '@/components/signals/SignalCard';
import { BarChart3, Sparkles, TrendingUp, Activity } from 'lucide-react';
import type { Signal } from '@/types/signal';
import type { SignalEvent } from '@/types/hub2';

// Mock signal data for demonstration
const mockSignals: Signal[] = [
  {
    id: 'btc-inflow-1',
    asset: 'BTC',
    assetSymbol: 'BTC',
    direction: 'inflow',
    amountUsd: 125000000,
    amount: 2750,
    timestamp: new Date().toISOString(),
    ownerType: 'whale',
    txHash: '0x1234...5678',
    from: '0xabcd...efgh',
    to: '0x9876...5432',
    source: 'whale_alert',
    risk: 'medium',
    impactScore: 8.7,
    isLive: true,
    reason: 'Large accumulation pattern detected'
  },
  {
    id: 'eth-outflow-1',
    asset: 'ETH',
    assetSymbol: 'ETH',
    direction: 'outflow',
    amountUsd: 89000000,
    amount: 31750,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    ownerType: 'exchange',
    source: 'etherscan',
    risk: 'high',
    impactScore: 7.2,
    isLive: false,
    reason: 'Exchange withdrawal spike'
  },
  {
    id: 'usdc-distribution-1',
    asset: 'USDC',
    assetSymbol: 'USDC',
    direction: 'distribution',
    amountUsd: 250000000,
    amount: 250000000,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    ownerType: 'protocol',
    source: 'defi_pulse',
    risk: 'low',
    impactScore: 6.8,
    isLive: true,
    reason: 'Stablecoin rebalancing'
  }
];

// Convert Signal to SignalEvent for SignalCard compatibility
const convertToSignalEvent = (signal: Signal): SignalEvent => ({
  id: signal.id,
  type: `${signal.direction}_${signal.ownerType}`,
  entity: {
    name: signal.asset,
    symbol: signal.assetSymbol || signal.asset,
    type: signal.ownerType
  },
  impactUsd: signal.amountUsd,
  delta: signal.direction === 'inflow' ? 2.3 : -1.8,
  confidence: signal.risk === 'high' ? 'high' : signal.risk === 'medium' ? 'med' : 'low',
  ts: signal.timestamp,
  reasonCodes: [signal.reason || 'Pattern detected'],
  metadata: {
    source: signal.source,
    isLive: signal.isLive
  }
});

export default function PatternModalDemo() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewPattern = (signal: Signal) => {
    setSelectedSignal(signal);
    setIsModalOpen(true);
  };

  const handleCreateAlert = () => {
    console.log('Creating alert for:', selectedSignal?.asset);
    // In real app, this would open alert creation flow
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-[var(--brand-teal,#14B8A6)]/10 rounded-xl">
              <BarChart3 className="h-8 w-8 text-[var(--brand-teal,#14B8A6)]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                Pattern Modal Demo
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Tesla × Airbnb × Robinhood × Perplexity DNA
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand-teal,#14B8A6)]" />
              <span>AI-Powered Explanations</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Predictive Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Real-time Patterns</span>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-[var(--brand-teal,#14B8A6)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Charting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <ul className="space-y-1">
                <li>• Candlestick & line charts</li>
                <li>• Animated signal markers</li>
                <li>• Interactive event tooltips</li>
                <li>• Real-time drift overlays</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <ul className="space-y-1">
                <li>• One-sentence explanations</li>
                <li>• Pattern confidence scoring</li>
                <li>• Predictive drift analysis</li>
                <li>• Historical accuracy metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Frictionless Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <ul className="space-y-1">
                <li>• One-tap alert creation</li>
                <li>• Keyboard navigation</li>
                <li>• Accessibility compliant</li>
                <li>• Performance optimized</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Signal Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Live Whale Signals
            </h2>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
              Click "View Pattern" to see the magic ✨
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockSignals.map((signal) => (
              <div key={signal.id} className="relative">
                <SignalCard
                  signal={convertToSignalEvent(signal)}
                  onDetailsClick={() => handleViewPattern(signal)}
                  onAction={() => console.log('Quick action for', signal.asset)}
                />
                
                {/* Highlight overlay for demo */}
                <div className="absolute inset-0 pointer-events-none border-2 border-[var(--brand-teal,#14B8A6)]/30 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Demo Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => handleViewPattern(mockSignals[0])}
            className="bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Demo BTC Pattern
          </Button>
          <Button
            variant="outline"
            onClick={() => handleViewPattern(mockSignals[1])}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Demo ETH Pattern
          </Button>
          <Button
            variant="outline"
            onClick={() => handleViewPattern(mockSignals[2])}
          >
            <Activity className="h-4 w-4 mr-2" />
            Demo USDC Pattern
          </Button>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-[var(--brand-teal,#14B8A6)] font-mono tabular-nums">
                  &lt;400ms
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Modal Load Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                  &lt;250ms
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Chart Render</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
                  100%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Accessibility</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums">
                  60fps
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Smooth Animations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The World-Class Pattern Modal */}
      <PatternModal
        signal={selectedSignal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
}