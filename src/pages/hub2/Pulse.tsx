import { useState } from "react";
import { motion } from "framer-motion";
import { usePulse } from "@/hooks/hub2";
import { useHub2 } from "@/store/hub2";
import SignalCard from "@/components/hub2/SignalCard";
import EntitySummaryCard from "@/components/hub2/EntitySummaryCard";
import GaugeDial from "@/components/hub2/GaugeDial";
import PressureBar from "@/components/hub2/PressureBar";
import AIDigest from "@/components/hub2/AIDigest";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PulsePage() {
  const { filters } = useHub2();
  const { data, isLoading, error } = usePulse(filters.window);
  const [selectedWindow, setSelectedWindow] = useState<'24h'|'7d'|'30d'>('24h');

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Market Pulse</h1>
            <p className="text-muted-foreground">
              Real-time market signals and whale activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg p-1">
              {(['24h', '7d', '30d'] as const).map((window) => (
                <Button
                  key={window}
                  size="sm"
                  variant={selectedWindow === window ? 'default' : 'ghost'}
                  onClick={() => setSelectedWindow(window)}
                  className="text-xs px-3"
                >
                  {window}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="space-y-4 mb-8">
          {/* Timestamp */}
          {data && (
            <div className="text-sm text-muted-foreground text-center">
              As of {new Date(data.ts).toLocaleString()}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          ) : data ? (
            <>
              {/* Market Sentiment */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
                      <div className="text-2xl font-bold">
                        {data.kpis.marketSentiment.toFixed(0)}%
                      </div>
                    </div>
                    <GaugeDial
                      value={data.kpis.marketSentiment}
                      max={100}
                      label=""
                      color="blue"
                      size="md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {data.kpis.deltas.sentiment >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      data.kpis.deltas.sentiment >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {data.kpis.deltas.sentiment >= 0 ? '+' : ''}{data.kpis.deltas.sentiment.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Whale Pressure */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Whale Pressure</h3>
                      <div className="text-2xl font-bold">
                        {data.kpis.whalePressure >= 0 ? '+' : ''}{data.kpis.whalePressure.toFixed(0)}
                      </div>
                    </div>
                    <PressureBar value={data.kpis.whalePressure} />
                  </div>
                  <div className="flex items-center gap-2">
                    {data.kpis.deltas.pressure >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      data.kpis.deltas.pressure >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {data.kpis.deltas.pressure >= 0 ? '+' : ''}{data.kpis.deltas.pressure.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Level */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Risk Level</h3>
                      <div className="text-2xl font-bold">
                        {data.kpis.risk.toFixed(1)}/10
                      </div>
                    </div>
                    <GaugeDial
                      value={data.kpis.risk}
                      max={10}
                      label=""
                      color={data.kpis.risk >= 7 ? 'red' : data.kpis.risk >= 4 ? 'yellow' : 'green'}
                      size="md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {data.kpis.deltas.risk >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      data.kpis.deltas.risk >= 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {data.kpis.deltas.risk >= 0 ? '+' : ''}{data.kpis.deltas.risk.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
          </div>
        </div>

        {/* AI Digest */}
        {data && (
          <AIDigest
            summary={`In 12s: ${data.kpis.marketSentiment >= 70 ? 'BTC risk ↑' : 'SOL whales accumulating'}, ${data.kpis.whalePressure >= 0 ? 'whale inflow detected' : 'whale outflow detected'}. Expect ${data.kpis.risk >= 7 ? 'high' : data.kpis.risk >= 4 ? 'moderate' : 'low'} volatility.`}
            confidence={data.kpis.risk >= 7 ? 'high' : data.kpis.risk >= 4 ? 'medium' : 'low'}
            keyInsights={[
              `Sentiment ${data.kpis.marketSentiment >= 70 ? 'bullish' : data.kpis.marketSentiment >= 40 ? 'neutral' : 'bearish'}`,
              `Whale pressure ${data.kpis.whalePressure >= 0 ? 'positive' : 'negative'}`,
              `Risk level ${data.kpis.risk >= 7 ? 'elevated' : data.kpis.risk >= 4 ? 'moderate' : 'low'}`
            ]}
            generatedAt={data.ts}
            className="mb-8"
          />
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

        {isLoading ? (
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
                    // Navigate to entity detail
                    window.location.href = `/hub2/entity/${id}`;
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

      {/* Recent Events */}
      {data?.topSignals && data.topSignals.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topSignals
              .flatMap(entity => entity.lastEvents)
              .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
              .slice(0, 6)
              .map((event) => (
                <SignalCard
                  key={event.id}
                  signal={event}
                  onAction={(signal) => {
                    // Navigate to signal detail or entity
                    window.location.href = `/hub2/entity/${signal.entity.id}`;
                  }}
                />
              ))}
          </div>
        </div>
      )}
      </div>
    </Hub2Layout>
  );
}
