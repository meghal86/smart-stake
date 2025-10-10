import { useQuery } from "@tanstack/react-query";
import { fetchSummaryKpis } from "@/integrations/api/hub2";
import { TimeWindow } from "@/types/hub2";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedKPICard } from "@/components/hub5/EnhancedKPICard";
import { Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryKpisProps {
  window: TimeWindow;
  className?: string;
}

export default function SummaryKpis({ window, className }: SummaryKpisProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hub2', 'summary', window],
    queryFn: () => fetchSummaryKpis(window),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (error) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">
          Unable to load market data. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-800/70 rounded-2xl p-6 border border-slate-700">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">
          Low coverage - market data unavailable
        </p>
      </div>
    );
  }

  const whalePressure = data.whalePressure?.score || 0;
  const sentiment = data.marketSentiment || 50;
  const riskIndex = data.marketRisk?.score || 50;

  const getWhalePressureStatus = () => {
    if (whalePressure > 10) return { label: 'Accumulating', color: 'green' as const, text: 'More Buying' };
    if (whalePressure < -10) return { label: 'Selling', color: 'red' as const, text: 'More Selling' };
    return { label: 'Balanced', color: 'yellow' as const, text: 'Balanced' };
  };

  const getSentimentStatus = () => {
    if (sentiment > 70) return { emoji: '😊', label: 'Confident', color: 'green' as const };
    if (sentiment > 40) return { emoji: '😐', label: 'Cautious', color: 'yellow' as const };
    return { emoji: '😟', label: 'Worried', color: 'red' as const };
  };

  const getRiskStatus = () => {
    if (riskIndex > 60) return { label: 'High', color: 'red' as const };
    if (riskIndex > 40) return { label: 'Medium', color: 'yellow' as const };
    return { label: 'Low', color: 'green' as const };
  };

  const whalePressureStatus = getWhalePressureStatus();
  const sentimentStatus = getSentimentStatus();
  const riskStatus = getRiskStatus();

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <EnhancedKPICard
        title="Big Money Moves"
        value={whalePressureStatus.text}
        subtitle={`(${whalePressure.toFixed(0)})`}
        badge={whalePressureStatus.label}
        badgeColor={whalePressureStatus.color}
        tooltip={`Whales are ${data.whalePressure?.direction === 'inflow' ? 'moving money into' : 'moving money out of'} exchanges. This usually means they're preparing to ${whalePressureStatus.text.toLowerCase()}. Based on ${window} whale transactions over $500K.`}
        lastUpdated="2min ago"
        icon={<Activity className="w-5 h-5 text-cyan-400" />}
      />

      <EnhancedKPICard
        title="Market Mood"
        value={sentimentStatus.label}
        subtitle={`(${sentiment.toFixed(0)}%)`}
        emoji={sentimentStatus.emoji}
        badge={sentimentStatus.label}
        badgeColor={sentimentStatus.color}
        tooltip="Market sentiment based on whale activity patterns. When whales are confident, the market usually follows."
        meter={sentiment}
        lastUpdated="2min ago"
        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
      />

      <EnhancedKPICard
        title="Market Risk"
        value={riskStatus.label}
        subtitle={`(${riskIndex.toFixed(0)}/100)`}
        badge={riskStatus.label}
        badgeColor={riskStatus.color}
        tooltip="Based on active whale addresses and current volatility. More whales trading = more unpredictable moves."
        thermometer={riskIndex}
        lastUpdated="2min ago"
        icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
      />
    </div>
  );
}
