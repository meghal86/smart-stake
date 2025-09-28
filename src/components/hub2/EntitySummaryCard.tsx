import { EntitySummary, AssetSentiment } from "@/types/hub2";
import GaugeDial from "./GaugeDial";
import PressureBar from "./PressureBar";
import ProvenanceBadge from "./ProvenanceBadge";
import SentimentBadge from "./SentimentBadge";
import StarButton from "./StarButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntitySummaryCardProps {
  entity: EntitySummary;
  sentiment?: AssetSentiment;
  onSelect?: (id: string) => void;
  onCompare?: (id: string) => void;
  onWatch?: (id: string) => void;
  isSelected?: boolean;
  isInCompare?: boolean;
  isWatched?: boolean;
  className?: string;
}

export default function EntitySummaryCard({
  entity,
  sentiment,
  onSelect,
  onCompare,
  onWatch,
  isSelected = false,
  isInCompare = false,
  isWatched = false,
  className
}: EntitySummaryCardProps) {
  const { gauges, priceUsd, change24h, lastEvents } = entity;
  
  const getRiskColor = (risk: number) => {
    if (risk >= 7) return 'red';
    if (risk >= 4) return 'yellow';
    return 'green';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'green';
    if (sentiment >= 40) return 'yellow';
    return 'red';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        isSelected && "ring-2 ring-primary border-primary",
        className
      )}
      onClick={() => onSelect?.(entity.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-semibold text-sm">{entity.name}</h3>
              {entity.symbol && (
                <p className="text-xs text-muted-foreground">{entity.symbol}</p>
              )}
              {sentiment && import.meta.env.VITE_FF_HUB2_SENTIMENT === 'true' && (
                <SentimentBadge sentiment={sentiment.sentiment} size="sm" />
              )}
            </div>
            <ProvenanceBadge 
              kind={entity.badges[0] || 'sim'}
              source={entity.provenance?.source}
              updatedAt={entity.provenance?.updatedAt}
            />
          </div>
          
          <div className="flex items-center gap-1">
            {priceUsd && (
              <div className="text-right">
                <div className="text-sm font-bold">
                  ${priceUsd.toLocaleString()}
                </div>
                {change24h !== undefined && (
                  <div className={cn(
                    "text-xs flex items-center gap-1",
                    change24h >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change24h).toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Gauges Row */}
        <div className="flex items-center justify-between mb-4">
          <GaugeDial
            value={gauges.sentiment}
            max={100}
            label="Sentiment"
            color={getSentimentColor(gauges.sentiment) as any}
            size="sm"
          />
          <PressureBar value={gauges.whalePressure} />
          <GaugeDial
            value={gauges.risk}
            max={10}
            label="Risk"
            color={getRiskColor(gauges.risk) as any}
            size="sm"
          />
        </div>

        {/* Recent Events */}
        {lastEvents.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">Recent Events</div>
            <div className="flex gap-1">
              {lastEvents.map((event, index) => (
                <Badge 
                  key={event.id}
                  variant="outline" 
                  className="text-xs px-2 py-1"
                >
                  {event.type === 'dormant_awake' && <Activity className="w-3 h-3 mr-1" />}
                  {event.type === 'risk_change' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {event.type.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onCompare?.(entity.id);
            }}
            className={cn(
              "flex-1 text-xs",
              isInCompare && "bg-primary text-primary-foreground"
            )}
          >
            {isInCompare ? 'Remove' : 'Compare'}
          </Button>
          
          {import.meta.env.VITE_FF_HUB2_GLOBAL_WATCHLIST === 'true' && (
            <StarButton
              entityType="asset"
              entityId={entity.id}
              label={entity.name}
              size="sm"
              variant="outline"
            />
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onWatch?.(entity.id);
            }}
            className={cn(
              "flex-1 text-xs",
              isWatched && "bg-primary text-primary-foreground"
            )}
          >
            {isWatched ? 'Watching' : 'Watch'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
