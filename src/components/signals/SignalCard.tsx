import { motion } from "framer-motion";
import { SignalEvent } from "@/types/hub2";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Sparkline from "@/components/hub2/Sparkline";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/telemetry";
import { useEffect, useState, useRef } from "react";

interface SignalCardProps {
  signal: SignalEvent;
  onAction?: (signal: SignalEvent) => void;
  onDetailsClick?: (signal: SignalEvent) => void;
  className?: string;
}

export default function SignalCard({ signal, onAction, onDetailsClick, className }: SignalCardProps) {
  const [relativeTime, setRelativeTime] = useState("");
  const [sparklineVisible, setSparklineVisible] = useState(false);
  const [detailsPreloaded, setDetailsPreloaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    trackEvent('signal_rendered', { 
      id: signal.id, 
      type: signal.type, 
      amountUsd: signal.impactUsd 
    });
  }, [signal.id, signal.type, signal.impactUsd]);

  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatTime(signal.ts));
    };
    
    updateTime();
    
    if (!prefersReducedMotion) {
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [signal.ts, prefersReducedMotion]);

  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSparklineVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

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
      default: return 'text-muted-foreground bg-muted/50';
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

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const generateSparklineData = (type: string) => {
    const base = 50;
    const variation = 20;
    return Array.from({ length: 12 }, (_, i) => {
      const trend = type.includes('outflow') ? -1 : type.includes('inflow') ? 1 : 0;
      return base + (Math.random() - 0.5) * variation + trend * (i / 12) * 10;
    });
  };

  const sparklineData = generateSparklineData(signal.type);

  const handleHover = () => {
    setIsHovered(true);
    if (!detailsPreloaded) {
      fetch(`/api/signals/${signal.id}`)
        .then(res => res.json())
        .then(() => setDetailsPreloaded(true))
        .catch(() => {});
      
      trackEvent('signal_hovered', { id: signal.id, type: signal.type });
    }
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('signal_alert_clicked', { id: signal.id, type: signal.type });
    onAction?.(signal);
  };

  const handleExplainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('signal_explain_clicked', { id: signal.id, type: signal.type });
  };

  const handleDetailsClick = () => {
    trackEvent('signal_details_clicked', { id: signal.id });
    onDetailsClick?.(signal);
  };

  const sourceStatus = Math.random() > 0.3 ? 'live' : 'cached';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverEnd}
      onClick={handleDetailsClick}
      className={cn("cursor-pointer signal-card", className)}
    >
      <Card className={cn(
        "transition-all duration-200 border-l-4 border-l-primary/20",
        isHovered && !prefersReducedMotion && "motion-safe:scale-[1.02] motion-safe:shadow-[0_0_6px_rgba(56,189,248,0.25)] bg-card/95"
      )}>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-help"
                      aria-label={`Source: Whale Alert • ${sourceStatus === 'live' ? 'Live' : 'Cached'}`}
                    >
                      {sourceStatus === 'live' ? '✓' : '○'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Source: Whale Alert • {sourceStatus === 'live' ? 'Live ✓' : 'Cached'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">
                {relativeTime}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {signal.impactUsd && (
                  <div className="text-kpi">
                    ${(signal.impactUsd / 1e6).toFixed(1)}M impact
                  </div>
                )}
                {signal.delta !== undefined && (
                  <div className={cn(
                    "text-kpi",
                    signal.delta >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {signal.delta >= 0 ? '+' : ''}{signal.delta}
                  </div>
                )}
              </div>
              
              <div className="text-meta">
                {Math.floor(Math.random() * 12) + 1} affected assets
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  signal.delta >= 0 ? "bg-green-500" : "bg-red-500"
                )}
                style={{ 
                  width: `${Math.min(Math.abs(signal.delta || 0) * 10, 100)}%` 
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {relativeTime}
              </div>
              {sparklineVisible ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkline 
                    data={sparklineData}
                    width={40}
                    height={12}
                    color={signal.delta >= 0 ? "#10b981" : "#ef4444"}
                    animated={true}
                  />
                </motion.div>
              ) : (
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              )}
            </div>
          </div>

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

          {onAction && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExplainClick}
                className="flex-1 text-xs"
              >
                Explain
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFollowClick}
                className="flex-1 text-xs"
              >
                Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
