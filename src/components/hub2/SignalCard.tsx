import { motion } from "framer-motion";
import { SignalEvent } from "@/types/hub2";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Sparkline from "./Sparkline";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  signal: SignalEvent;
  onAction?: (signal: SignalEvent) => void;
  className?: string;
}

export default function SignalCard({ signal, onAction, className }: SignalCardProps) {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'dormant_awake': return <Activity className="w-4 h-4" />;
      case 'risk_change': return <AlertTriangle className="w-4 h-4" />;
      case 'sentiment_change': return <TrendingUp className="w-4 h-4" />;
      case 'cex_outflow': return <TrendingDown className="w-4 h-4" />;
      case 'defi_leverage': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'dormant_awake': return 'text-blue-600 bg-blue-50';
      case 'risk_change': return 'text-red-600 bg-red-50';
      case 'sentiment_change': return 'text-green-600 bg-green-50';
      case 'cex_outflow': return 'text-orange-600 bg-orange-50';
      case 'defi_leverage': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'med': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Generate mock sparkline data based on signal type
  const generateSparklineData = (type: string) => {
    const base = 50;
    const variation = 20;
    return Array.from({ length: 12 }, (_, i) => {
      const trend = type.includes('outflow') ? -1 : type.includes('inflow') ? 1 : 0;
      return base + (Math.random() - 0.5) * variation + trend * (i / 12) * 10;
    });
  };

  const sparklineData = generateSparklineData(signal.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn("cursor-pointer", className)}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
        <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", getSignalColor(signal.type))}>
              {getSignalIcon(signal.type)}
            </div>
            <div>
              <h4 className="font-medium text-sm">
                {signal.entity.name}
                {signal.entity.symbol && (
                  <span className="text-muted-foreground ml-1">({signal.entity.symbol})</span>
                )}
              </h4>
              <p className="text-xs text-muted-foreground">
                {signal.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs", getConfidenceColor(signal.confidence))}
            >
              {signal.confidence}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(signal.ts)}
            </span>
          </div>
        </div>

        {/* Impact and Delta with Sparkline */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {signal.impactUsd && (
              <div className="text-sm font-medium">
                ${(signal.impactUsd / 1e6).toFixed(1)}M impact
              </div>
            )}
            {signal.delta !== undefined && (
              <div className={cn(
                "text-sm font-medium",
                signal.delta >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {signal.delta >= 0 ? '+' : ''}{signal.delta}
              </div>
            )}
          </div>
          
          {/* Animated Sparkline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Sparkline 
              data={sparklineData}
              width={60}
              height={20}
              color={signal.delta >= 0 ? "#10b981" : "#ef4444"}
              animated={true}
            />
          </motion.div>
        </div>

        {/* Reason Codes */}
        {signal.reasonCodes.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Reasons</div>
            <div className="flex flex-wrap gap-1">
              {signal.reasonCodes.slice(0, 3).map((reason, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {reason}
                </Badge>
              ))}
              {signal.reasonCodes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{signal.reasonCodes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onAction && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(signal)}
            className="w-full text-xs"
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}
