import { useState } from "react";
import { useEntity, useBacktest } from "@/hooks/hub2";
import { useHub2 } from "@/store/hub2";
import GaugeDial from "@/components/hub2/GaugeDial";
import PressureBar from "@/components/hub2/PressureBar";
import ProvenanceBadge from "@/components/hub2/ProvenanceBadge";
import SignalCard from "@/components/hub2/SignalCard";
import EntityTimeline from "@/components/hub2/EntityTimeline";
import ExportButton from "@/components/hub2/ExportButton";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Brain,
  BarChart3,
  Clock,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityDetailProps {
  entityId: string;
}

export default function EntityDetailPage({ entityId }: EntityDetailProps) {
  const { watchlist, addWatch, removeWatch } = useHub2();
  const { data, isLoading, error } = useEntity(entityId);
  const backtestMutation = useBacktest();
  const [isWatched, setIsWatched] = useState(watchlist.includes(entityId));

  const handleWatch = () => {
    if (isWatched) {
      removeWatch(entityId);
      setIsWatched(false);
    } else {
      addWatch(entityId);
      setIsWatched(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.summary.name,
          text: `Check out ${data?.summary.name} on WhalePlus`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBacktest = async () => {
    if (data?.summary) {
      try {
        const result = await backtestMutation.mutateAsync({
          entityId: data.summary.id,
          timeframe: '30d',
          strategy: 'momentum'
        });
        console.log('Backtest result:', result);
      } catch (err) {
        console.error('Backtest failed:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load entity</h2>
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

  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const { summary, timeline = [], ai = { soWhat: '', next: [] } } = data;
  
  // Ensure ai.next is always an array
  const aiNext = ai?.next || [];

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{summary.name}</h1>
              {summary.symbol && (
                <p className="text-muted-foreground">{summary.symbol}</p>
              )}
            </div>
            <ProvenanceBadge 
              kind={summary.badges[0] || 'sim'}
              source={summary.provenance?.source}
              updatedAt={summary.provenance?.updatedAt}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleWatch}
              className={cn(
                "flex items-center gap-2",
                isWatched && "bg-primary text-primary-foreground"
              )}
            >
              <Star className={cn("w-4 h-4", isWatched && "fill-current")} />
              {isWatched ? 'Watching' : 'Watch'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <ExportButton 
              data={data} 
              type="entity" 
              className="hidden sm:flex"
            />
          </div>
        </div>

        {/* Price and Change */}
        {summary.priceUsd && (
          <div className="flex items-center gap-4 mb-6">
            <div className="text-3xl font-bold">
              ${summary.priceUsd.toLocaleString()}
            </div>
            {summary.change24h !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-lg font-medium",
                summary.change24h >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {summary.change24h >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {Math.abs(summary.change24h).toFixed(2)}%
              </div>
            )}
          </div>
        )}

        {/* Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Sentiment</h3>
                <GaugeDial
                  value={summary.gauges.sentiment}
                  max={100}
                  label=""
                  color={summary.gauges.sentiment >= 70 ? 'green' : summary.gauges.sentiment >= 40 ? 'yellow' : 'red'}
                  size="md"
                />
              </div>
              <div className="text-2xl font-bold">
                {summary.gauges.sentiment.toFixed(0)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Whale Pressure</h3>
                <PressureBar value={summary.gauges.whalePressure} />
              </div>
              <div className="text-2xl font-bold">
                {summary.gauges.whalePressure >= 0 ? '+' : ''}{summary.gauges.whalePressure.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Risk</h3>
                <GaugeDial
                  value={summary.gauges.risk}
                  max={10}
                  label=""
                  color={summary.gauges.risk >= 7 ? 'red' : summary.gauges.risk >= 4 ? 'yellow' : 'green'}
                  size="md"
                />
              </div>
              <div className="text-2xl font-bold">
                {summary.gauges.risk.toFixed(1)}/10
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EntityTimeline 
                events={summary.lastEvents} 
                priceData={[]} // TODO: Add price data when available
              />
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">So What?</h4>
                  <p className="text-sm text-muted-foreground">
                    {ai.soWhat || "No AI analysis available"}
                  </p>
                </div>
                
                {aiNext.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {aiNext.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backtest Card - Only show if ready */}
          {backtestMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Backtest Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(backtestMutation.data.winRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {backtestMutation.data.avgReturnPct > 0 ? '+' : ''}{backtestMutation.data.avgReturnPct.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Return</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Events */}
      {timeline.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Recent Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeline.slice(0, 8).map((event) => (
              <SignalCard
                key={event.id}
                signal={event}
                onAction={(signal) => {
                  // Show event details
                  console.log('Event details:', signal);
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
