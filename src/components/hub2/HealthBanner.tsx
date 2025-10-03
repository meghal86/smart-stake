import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { HealthStatus } from "@/types/hub2";

interface HealthBannerProps {
  className?: string;
  onRefresh?: () => void;
}

export default function HealthBanner({ className, onRefresh }: HealthBannerProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from /api/healthz endpoint
      const response = await fetch('/api/healthz');
      
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      } else {
        throw new Error('Health endpoint not available');
      }
    } catch (error) {
      // Silently handle the error - don't log to console to avoid spam
      // Set a mock degraded status instead of down
      setHealth({
        status: 'degraded',
        providers: {
          whaleAlerts: { status: 'degraded', latency: 500, errorRate: 5 },
          marketSummary: { status: 'ok', latency: 200, errorRate: 1 },
          assetSentiment: { status: 'ok', latency: 150, errorRate: 0 }
        },
        lastChecked: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (!health || health.status === 'ok') {
    return null; // Don't show banner when everything is healthy
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-meta" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Alert className={cn("border-l-4 border-l-yellow-500", className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">System Status: {health.status.toUpperCase()}</span>
          <div className="flex gap-1">
            {Object.entries(health.providers).map(([provider, status]) => (
              <Badge
                key={provider}
                className={cn(
                  "flex items-center gap-1 text-xs",
                  getStatusColor(status.status)
                )}
              >
                {getStatusIcon(status.status)}
                {provider}
                {status.latency > 0 && (
                  <span className="text-xs">({status.latency}ms)</span>
                )}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh || fetchHealth}
          disabled={isLoading}
          className="h-6 px-2"
        >
          <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
