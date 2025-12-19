import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/ux/timestampUtils';

interface LiveDataStatusProps {
  lastUpdate?: string;
  apiHealth?: 'healthy' | 'degraded' | 'down';
  transactionCount?: number;
}

export function LiveDataStatus({ 
  lastUpdate, 
  apiHealth = 'healthy', 
  transactionCount = 0 
}: LiveDataStatusProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      setTimeSinceUpdate(formatRelativeTime(lastUpdate));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusColor = () => {
    switch (apiHealth) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (apiHealth) {
      case 'healthy': return <Wifi className="h-3 w-3" />;
      case 'degraded': return <Activity className="h-3 w-3" />;
      case 'down': return <WifiOff className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        {getStatusIcon()}
        <span className="capitalize">{apiHealth}</span>
      </Badge>
      
      {transactionCount > 0 && (
        <Badge variant="secondary">
          {transactionCount.toLocaleString()} alerts
        </Badge>
      )}
      
      {timeSinceUpdate && (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {timeSinceUpdate}
        </Badge>
      )}
    </div>
  );
}