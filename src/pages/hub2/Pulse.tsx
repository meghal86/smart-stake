import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Enhanced Components
import { WhaleHero } from "@/components/cinematic/WhaleHero";
import { EnhancedGlassCard } from "@/components/cinematic/EnhancedGlassCard";
import { ThemeToggle } from "@/components/cinematic/ThemeToggle";
import { KPIBar } from "@/components/cinematic/KPIBar";
import { ROIGradientRing } from "@/components/cinematic/ROIGradientRing";
import { AchievementBadge } from "@/components/cinematic/AchievementBadge";
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

import ModularCard from "@/components/ui/ModularCard";
import ActionButton from "@/components/ui/ActionButton";
import LegendaryLayout from "@/components/ui/LegendaryLayout";
import BrandHeader from "@/components/ui/BrandHeader";
import LegendaryFooter from "@/components/ui/LegendaryFooter";
import ExplainModal from "@/components/ui/ExplainModal";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Zap, Brain, Eye, Bell, ExternalLink, BarChart3, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PulsePage() {
  const navigate = useNavigate();
  const { filters } = useHub2();
  const { mode, setMode } = useUIMode();
  const [selectedWindow, setSelectedWindow] = useState<'24h'|'7d'|'30d'>('24h');
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [explainTopic, setExplainTopic] = useState<'market-intelligence' | 'whale-signals' | 'risk-analysis' | null>(null);
  
  useEffect(() => {
    // Apply cinematic theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);
  
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
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <div style={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          {/* Health Banner */}
          <HealthBanner className="mb-4" />
          
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6">
            <BrandHeader 
              mode={mode} 
              onModeChange={setMode}
            />
            <ThemeToggle />
          </div>
          
          {/* Whale Hero */}
          <div className="mb-8">
            <WhaleHero />
          </div>
          
          {/* KPI Bar */}
          <div className="mb-8">
            <KPIBar />
          </div>
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <EnhancedGlassCard className="p-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-4">
                <h3 style={{ color: "var(--foreground)" }}>24h Profit</h3>
              </div>
              <ROIGradientRing percentage={67} value="+$48.2K" label="ROI: +8.7%" />
              <div className="flex gap-3 mt-6">
                <button
                  className="px-6 py-2 rounded-lg text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--chart-3), var(--primary))",
                  }}
                >
                  Realize Gains
                </button>
                <button
                  className="px-6 py-2 rounded-lg"
                  style={{
                    background: "var(--accent)",
                    border: "1px solid var(--primary)",
                    color: "var(--primary)",
                  }}
                >
                  Export
                </button>
              </div>
            </EnhancedGlassCard>

            <EnhancedGlassCard className="p-6">
              <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { icon: BarChart3, label: "Run Analysis", color: "var(--primary)" },
                  { icon: Shield, label: "Guardian Scan", color: "var(--chart-2)" },
                  { icon: Sparkles, label: "AI Insights", color: "var(--chart-3)" },
                  { icon: Brain, label: "Ask Copilot", color: "var(--chart-4)" },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      background: `${action.color}15`,
                      border: `1px solid ${action.color}30`,
                    }}
                  >
                    <action.icon className="w-5 h-5" style={{ color: action.color }} />
                    <span style={{ color: "var(--foreground)" }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </EnhancedGlassCard>

            <EnhancedGlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: "var(--foreground)" }}>Recent Signals</h3>
                <button
                  className="text-sm"
                  style={{ color: "var(--primary)" }}
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "BTC", value: "+2.4M", color: "var(--chart-3)" },
                  { label: "ETH", value: "+890K", color: "var(--primary)" },
                  { label: "SOL", value: "-450K", color: "var(--chart-2)" },
                ].map((signal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--muted)" }}
                  >
                    <span style={{ color: "var(--foreground)" }}>{signal.label}</span>
                    <span style={{ color: signal.color }}>{signal.value}</span>
                  </div>
                ))}
              </div>
            </EnhancedGlassCard>
          </div>
          
          {/* Achievement Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <AchievementBadge title="First Trade" description="Welcome!" icon="trophy" unlocked rarity="common" />
            <AchievementBadge title="Whale Hunter" description="100 signals tracked" icon="star" unlocked rarity="rare" />
            <AchievementBadge title="Legend" description="$1M+ portfolio" icon="award" unlocked rarity="legendary" />
            <AchievementBadge title="Ultimate" description="Coming soon..." icon="zap" unlocked={false} rarity="legendary" />
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

          {/* Market Intelligence */}
          {data && (
            <ModularCard 
              title="Market Intelligence" 
              mode={mode}
              updating={isFetching}
              onExplain={() => setExplainTopic('market-intelligence')}
              priority="high"
              category="intelligence"
            >
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: mode === 'novice' ? '1.1rem' : '1rem',
                  lineHeight: '1.6',
                  color: '#F0F6FF',
                  margin: 0
                }}>
                  {mode === 'novice' 
                    ? `Market waves are ${data.kpis.marketSentiment >= 70 ? 'strong and rising' : data.kpis.marketSentiment >= 40 ? 'steady' : 'choppy'}. ${data.kpis.whalePressure >= 0 ? 'Big whales are accumulating' : 'Big whales are distributing'}. ${data.kpis.risk >= 7 ? 'Expect major moves soon' : data.kpis.risk >= 4 ? 'Some volatility expected' : 'Calm waters ahead'}.`
                    : `Market sentiment at ${data.kpis.marketSentiment.toFixed(1)}% (${data.kpis.marketSentiment >= 70 ? 'bullish' : data.kpis.marketSentiment >= 40 ? 'neutral' : 'bearish'}). Whale pressure ${data.kpis.whalePressure >= 0 ? 'positive' : 'negative'} with ${Math.abs(data.kpis.whalePressure).toFixed(1)} score.`
                  }
                </p>
              </div>

              {mode === 'pro' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <PercentileBadge percentile={Math.min(100, Math.max(0, (data.kpis.whalePressure + 100) / 2))} type="inflow" />
                  <PercentileBadge percentile={Math.min(100, Math.max(0, data.kpis.risk * 10))} type="risk" />
                  <AsOfLabel asOf={data.ts} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ActionButton 
                  onClick={() => navigate('/hub2/watchlist')}
                  icon={<Eye className="w-4 h-4" />}
                  size={mode === 'novice' ? 'lg' : 'md'}
                >
                  Watch All
                </ActionButton>
                <ActionButton 
                  onClick={() => navigate('/hub2/alerts')}
                  icon={<Bell className="w-4 h-4" />}
                  variant="secondary"
                  size={mode === 'novice' ? 'lg' : 'md'}
                >
                  Create Alert
                </ActionButton>
                <ActionButton 
                  onClick={() => setShowEvidenceModal(true)}
                  icon={<ExternalLink className="w-4 h-4" />}
                  variant="ghost"
                  size={mode === 'novice' ? 'lg' : 'md'}
                >
                  Evidence
                </ActionButton>
              </div>
            </ModularCard>
          )}

          {/* Top Signals */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: mode === 'novice' ? '1.5rem' : '1.25rem',
                fontWeight: 700,
                color: '#F0F6FF',
                margin: 0
              }}>
                {mode === 'novice' ? 'Important Signals' : 'Top Market Signals'}
              </h2>
              <ActionButton variant="ghost" size="sm">
                View All ({data?.topSignals?.length || 0})
              </ActionButton>
            </div>

            <div style={{
              display: 'grid',
              gap: mode === 'novice' ? '24px' : '16px',
              gridTemplateColumns: mode === 'novice' 
                ? 'repeat(auto-fit, minmax(350px, 1fr))'
                : 'repeat(auto-fit, minmax(320px, 1fr))'
            }}>
              {showLoading ? (
                Array.from({ length: mode === 'novice' ? 4 : 6 }).map((_, i) => (
                  <ModularCard
                    key={i}
                    title="Loading..."
                    mode={mode}
                    updating={true}
                    category="signals"
                  >
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(28, 169, 255, 0.3)',
                        margin: '0 auto 12px'
                      }} />
                      <p style={{ color: '#7F9BBF', margin: 0 }}>Loading signal...</p>
                    </div>
                  </ModularCard>
                ))
              ) : data?.topSignals ? (
                data.topSignals.slice(0, mode === 'novice' ? 4 : 6).map((entity) => (
                  <ModularCard
                    key={entity.id}
                    title={`${entity.symbol || entity.id}`}
                    mode={mode}
                    updating={isFetching}
                    category="signals"
                    priority={Math.random() > 0.7 ? 'high' : 'medium'}
                  >
                    <EntitySummaryCard
                      entity={entity}
                      onSelect={(id) => navigate(`/hub2/entity/${id}`)}
                      onCompare={(id) => console.log('Add to compare:', id)}
                      onWatch={(id) => console.log('Add to watchlist:', id)}
                    />
                  </ModularCard>
                ))
              ) : (
                <ModularCard title="No Signals" mode={mode} category="signals">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Activity style={{ width: '32px', height: '32px', color: '#7F9BBF', margin: '0 auto 12px' }} />
                    <p style={{ color: '#7F9BBF', margin: 0 }}>No signals available</p>
                  </div>
                </ModularCard>
              )}
            </div>
          </div>

          {/* Live Signal Stack */}
          {data?.topSignals && data.topSignals.length > 0 && (() => {
            const allEvents = data.topSignals.flatMap(entity => entity.lastEvents || []);
            const sortedEvents = allEvents.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
            const displayedEvents = showAllSignals ? sortedEvents : sortedEvents.slice(0, mode === 'novice' ? 4 : 6);
            
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
              <ModularCard 
                title="Live Signal Stack" 
                mode={mode}
                updating={isFetching}
                onExplain={() => setExplainTopic('whale-signals')}
                category="data"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#7F9BBF', margin: 0 }}>
                      {mode === 'novice' 
                        ? 'Recent whale movements and market events'
                        : `${totalEvents} live signals in the last ${selectedWindow}`
                      }
                    </p>
                    <ActionButton 
                      onClick={() => setShowAllSignals(!showAllSignals)}
                      variant="ghost"
                      size="sm"
                    >
                      {showAllSignals ? 'Show Less' : 'Show More'}
                    </ActionButton>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gap: mode === 'novice' ? '16px' : '12px',
                    gridTemplateColumns: mode === 'novice' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
                  }}>
                    {eventsToShow.map((event) => (
                      <SignalCard
                        key={event.id}
                        signal={event}
                        onAction={(signal) => navigate(`/hub2/entity/${signal.entity.id}`)}
                      />
                    ))}
                  </div>
                  
                  {!showAllSignals && totalEvents > (mode === 'novice' ? 4 : 6) && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <ActionButton 
                        onClick={() => setShowAllSignals(true)}
                        size="lg"
                      >
                        Show All {totalEvents} Signals
                      </ActionButton>
                    </div>
                  )}
                </div>
              </ModularCard>
            );
          })()}
        </div>
      </Hub2Layout>
      
      {/* Legendary Footer */}
      <LegendaryFooter 
        theme="dark" 
        onThemeToggle={() => console.log('Theme toggle clicked')} 
      />
      
      {/* Explain Modal */}
      <ExplainModal 
        isOpen={explainTopic !== null}
        onClose={() => setExplainTopic(null)}
        topic={explainTopic || 'market-intelligence'}
      />
    </LegendaryLayout>
  );
}
