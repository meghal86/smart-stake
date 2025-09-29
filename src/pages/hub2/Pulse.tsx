import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePulse } from "@/hooks/hub2";
import { useHub2 } from "@/store/hub2";
import { useUIMode } from "@/store/uiMode";
import SignalCard from "@/components/hub2/SignalCard";
import EntitySummaryCard from "@/components/hub2/EntitySummaryCard";
import GaugeDial from "@/components/hub2/GaugeDial";
import PressureBar from "@/components/hub2/PressureBar";
import AIDigest from "@/components/hub2/AIDigest";
import SummaryKpis from "@/components/hub2/SummaryKpis";
import TimeWindowToggle from "@/components/hub2/TimeWindowToggle";
import HealthBanner from "@/components/hub2/HealthBanner";
import ModeToggle from "@/components/hub2/ModeToggle";
import ProvenanceChip from "@/components/hub2/ProvenanceChip";
import AsOfLabel from "@/components/hub2/AsOfLabel";
import PercentileBadge from "@/components/hub2/PercentileBadge";
import VenueList from "@/components/hub2/VenueList";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Zap, Brain, Eye, Bell, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PulsePage() {
  const navigate = useNavigate();
  const { filters } = useHub2();
  const { mode, setMode } = useUIMode();
  const [selectedWindow, setSelectedWindow] = useState<'24h'|'7d'|'30d'>('24h');
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  
  // Use selectedWindow instead of filters.window to prevent unnecessary refetches
  const { data, isLoading, error, isFetching } = usePulse(selectedWindow);
  
  // Don't show loading state if we have cached data and are just refetching
  const showLoading = isLoading && !data;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load pulse data</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Health Banner */}
        <HealthBanner className="mb-4" />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Market Pulse</h1>
              <p className="text-muted-foreground">
                {mode === 'novice' 
                  ? 'Real-time market signals and whale activity' 
                  : 'Advanced market intelligence with percentile benchmarking and venue analysis'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle mode={mode} onModeChange={setMode} />
              <TimeWindowToggle 
                value={selectedWindow} 
                onChange={setSelectedWindow}
              />
            </div>
          </div>

            {/* Summary KPIs */}
            {import.meta.env.VITE_FF_HUB2_SUMMARY === 'true' && (
              <div className="mb-8">
                <SummaryKpis window={selectedWindow} />
              </div>
            )}

        {/* Timestamp */}
        {data && (
          <div className="text-sm text-muted-foreground text-center mb-6">
            As of {new Date(data.ts).toLocaleString()}
          </div>
        )}

        {/* AI Digest */}
        {data && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">AI Market Digest</CardTitle>
                    <ProvenanceChip provenance="real" size="sm" />
                  </div>
                  <AsOfLabel asOf={data.ts} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Narrative */}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed">
                      {mode === 'novice' 
                        ? `Market activity is ${data.kpis.marketSentiment >= 70 ? 'high' : data.kpis.marketSentiment >= 40 ? 'moderate' : 'low'}. ${data.kpis.whalePressure >= 0 ? 'Whales are buying' : 'Whales are selling'}. This suggests ${data.kpis.risk >= 7 ? 'significant' : data.kpis.risk >= 4 ? 'some' : 'minimal'} market movement ahead.`
                        : `Market sentiment at ${data.kpis.marketSentiment.toFixed(1)}% (${data.kpis.marketSentiment >= 70 ? 'bullish' : data.kpis.marketSentiment >= 40 ? 'neutral' : 'bearish'}). Whale pressure ${data.kpis.whalePressure >= 0 ? 'positive' : 'negative'} with ${Math.abs(data.kpis.whalePressure).toFixed(1)} score. Risk level ${data.kpis.risk.toFixed(1)}/10 (${data.kpis.risk >= 7 ? 'elevated' : data.kpis.risk >= 4 ? 'moderate' : 'low'}).`
                      }
                    </p>
                  </div>

                  {/* Pro Mode: Percentiles and Venues */}
                  {mode === 'pro' && (
                    <div className="flex items-center gap-4">
                      <PercentileBadge percentile={Math.min(100, Math.max(0, (data.kpis.whalePressure + 100) / 2))} type="inflow" />
                      <PercentileBadge percentile={Math.min(100, Math.max(0, data.kpis.risk * 10))} type="risk" />
                      <div className="text-xs text-muted-foreground">
                        vs last 30d
                      </div>
                    </div>
                  )}

                  {/* Action CTAs */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/hub2/watchlist')}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Watch all
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/hub2/alerts')}
                      className="flex items-center gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      Create alert
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowEvidenceModal(true)}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Show transactions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Top Signals */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Top Signals</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

            {showLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.topSignals ? (
          <>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {data.topSignals.slice(0, 6).map((entity, index) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <EntitySummaryCard
                  entity={entity}
                  onSelect={(id) => {
                    // Navigate to entity detail using React Router
                    navigate(`/hub2/entity/${id}`);
                  }}
                  onCompare={(id) => {
                    // Add to comparison
                    console.log('Add to compare:', id);
                  }}
                  onWatch={(id) => {
                    // Add to watchlist
                    console.log('Add to watchlist:', id);
                  }}
                />
              </motion.div>
              ))}
            </motion.div>
            {data.topSignals.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  View All {data.topSignals.length} Signals
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No signals available</h3>
            <p className="text-muted-foreground">
              Check back later for new market signals
            </p>
          </div>
        )}
      </div>

          {/* Signal Stack */}
          {data?.topSignals && data.topSignals.length > 0 && (() => {
            // Get all events from all signals
            const allEvents = data.topSignals.flatMap(entity => entity.lastEvents || []);
            const sortedEvents = allEvents.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
            const displayedEvents = showAllSignals ? sortedEvents : sortedEvents.slice(0, 6);
            
            // If no events from signals, create some mock events for demonstration
            const mockEvents = allEvents.length === 0 ? [
              {
                id: 'mock-1',
                ts: new Date().toISOString(),
                type: 'sentiment_change',
                entity: { kind: 'asset', id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
                impactUsd: 5000000,
                delta: 5.2,
                confidence: 'high' as const,
                source: 'coingecko' as const,
                reasonCodes: ['price_momentum', 'volume_spike']
              },
              {
                id: 'mock-2',
                ts: new Date(Date.now() - 3600000).toISOString(),
                type: 'whale_movement',
                entity: { kind: 'asset', id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
                impactUsd: 15000000,
                delta: -3.1,
                confidence: 'high' as const,
                source: 'etherscan' as const,
                reasonCodes: ['large_transfer', 'exchange_inflow']
              },
              {
                id: 'mock-3',
                ts: new Date(Date.now() - 7200000).toISOString(),
                type: 'risk_change',
                entity: { kind: 'asset', id: 'solana', symbol: 'SOL', name: 'Solana' },
                impactUsd: 8000000,
                delta: 2.8,
                confidence: 'med' as const,
                source: 'internal' as const,
                reasonCodes: ['volatility_spike', 'market_correction']
              }
            ] : [];

            const eventsToShow = displayedEvents.length > 0 ? displayedEvents : mockEvents;
            const totalEvents = allEvents.length > 0 ? allEvents.length : mockEvents.length;

            return (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Signal Stack</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAllSignals(!showAllSignals)}
                  >
                    {showAllSignals ? 'Show less' : 'Show more'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventsToShow.map((event) => (
                    <SignalCard
                      key={event.id}
                      signal={event}
                      onAction={(signal) => {
                        // Navigate to signal detail or entity using React Router
                        navigate(`/hub2/entity/${signal.entity.id}`);
                      }}
                    />
                  ))}
                </div>
                {!showAllSignals && totalEvents > 6 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllSignals(true)}
                    >
                      Show all {totalEvents} signals
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
      </div>
    </Hub2Layout>
  );
}
