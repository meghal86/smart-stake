import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface FreshnessBadgeProps {
  isLive: boolean;
  lastUpdate?: string;
  provider?: string;
}

export function FreshnessBadge({ isLive, lastUpdate, provider }: FreshnessBadgeProps) {
  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffSeconds = Math.floor((now - then) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  if (isLive) {
    return (
      <Badge variant="outline" className="text-green-500 border-green-500/30">
        <Wifi className="h-3 w-3 mr-1" />
        Live
        {provider && <span className="ml-1 text-xs opacity-70">({provider})</span>}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-orange-500 border-orange-500/30">
      <Clock className="h-3 w-3 mr-1" />
      Cached {lastUpdate ? getTimeAgo(lastUpdate) : ''}
      {provider && <span className="ml-1 text-xs opacity-70">({provider})</span>}
    </Badge>
  );
}