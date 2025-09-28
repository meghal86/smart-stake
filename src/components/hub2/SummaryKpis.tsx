import { useQuery } from "@tanstack/react-query";
import { fetchSummaryKpis } from "@/integrations/api/hub2";
import { TimeWindow } from "@/types/hub2";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MetricGauge from "./MetricGauge";
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryKpisProps {
  window: TimeWindow;
  className?: string;
}

export default function SummaryKpis({ window, className }: SummaryKpisProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hub2', 'summary', window],
    queryFn: () => fetchSummaryKpis(window),
    staleTime: 30_000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
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
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
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

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return 'green';
    if (sentiment >= 40) return 'yellow';
    return 'red';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'red';
    if (risk >= 40) return 'yellow';
    return 'green';
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* Market Sentiment */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
              <div className="text-2xl font-bold">
                {data.marketSentiment.toFixed(0)}%
              </div>
            </div>
            <MetricGauge
              value={data.marketSentiment}
              max={100}
              label=""
              color={getSentimentColor(data.marketSentiment)}
              size="md"
            />
          </div>
          <div className="flex items-center gap-2">
            {data.whalePressure.deltaVsPrev >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              data.whalePressure.deltaVsPrev >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {data.whalePressure.deltaVsPrev >= 0 ? '+' : ''}{data.whalePressure.deltaVsPrev.toFixed(1)}%
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
                {data.whalePressure.score >= 0 ? '+' : ''}{data.whalePressure.score.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {data.whalePressure.direction}
              </div>
            </div>
            <div className="flex items-center">
              {data.whalePressure.direction === 'inflow' ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : data.whalePressure.direction === 'outflow' ? (
                <TrendingDown className="w-8 h-8 text-red-600" />
              ) : (
                <Activity className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.whalePressure.deltaVsPrev >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              data.whalePressure.deltaVsPrev >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {data.whalePressure.deltaVsPrev >= 0 ? '+' : ''}{data.whalePressure.deltaVsPrev.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">vs yesterday</span>
          </div>
        </CardContent>
      </Card>

      {/* Market Risk */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Market Risk</h3>
              <div className="text-2xl font-bold">
                {data.marketRisk?.score?.toFixed(0) || '0'}/100
              </div>
            </div>
            <MetricGauge
              value={data.marketRisk?.score || 0}
              max={100}
              label=""
              color={getRiskColor(data.marketRisk?.score || 0)}
              size="md"
            />
          </div>
          <div className="flex items-center gap-2">
            {(data.marketRisk?.deltaVsPrev || 0) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              (data.marketRisk?.deltaVsPrev || 0) >= 0 ? "text-red-600" : "text-green-600"
            )}>
              {(data.marketRisk?.deltaVsPrev || 0) >= 0 ? '+' : ''}{(data.marketRisk?.deltaVsPrev || 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">vs yesterday</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
