import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Zap } from "lucide-react";
import { SignalEvent } from "@/types/hub2";
import { cn } from "@/lib/utils";

interface EntityTimelineProps {
  events: SignalEvent[];
  priceData?: Array<{ timestamp: string; price: number }>;
  className?: string;
}

export default function EntityTimeline({ events, priceData, className }: EntityTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sentiment_change':
        return <TrendingUp className="w-4 h-4" />;
      case 'cex_outflow':
        return <TrendingDown className="w-4 h-4" />;
      case 'risk_change':
        return <AlertTriangle className="w-4 h-4" />;
      case 'dormant_awake':
        return <Activity className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'sentiment_change':
        return 'text-green-600 bg-green-50';
      case 'cex_outflow':
        return 'text-red-600 bg-red-50';
      case 'risk_change':
        return 'text-orange-600 bg-orange-50';
      case 'dormant_awake':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-meta bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Timeline</h3>
        <Badge variant="outline" className="text-xs">
          {events.length} events
        </Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {events.slice(0, 10).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline dot */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background z-10",
                getEventColor(event.type)
              )}>
                {getEventIcon(event.type)}
              </div>

              {/* Event content */}
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm capitalize">
                        {event.type.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.ts)}
                      </p>
                    </div>
                    <Badge 
                      variant={event.confidence === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {event.confidence}
                    </Badge>
                  </div>

                  {event.impactUsd && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        ${(event.impactUsd / 1e6).toFixed(1)}M impact
                      </span>
                    </div>
                  )}

                  {event.delta !== undefined && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className={cn(
                        "text-sm font-medium",
                        event.delta >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {event.delta >= 0 ? '+' : ''}{event.delta}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.type.includes('sentiment') ? 'sentiment' : 'risk'}
                      </span>
                    </div>
                  )}

                  {event.reasonCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.reasonCodes.slice(0, 3).map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                      {event.reasonCodes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.reasonCodes.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {events.length > 10 && (
          <div className="text-center mt-6">
            <Button variant="outline" size="sm">
              View All {events.length} Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
