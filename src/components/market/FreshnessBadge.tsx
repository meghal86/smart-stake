import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/ux/timestampUtils';

interface FreshnessBadgeProps {
  isLive: boolean;
  lastUpdate?: string;
  provider?: string;
}

export function FreshnessBadge({ isLive, lastUpdate, provider }: FreshnessBadgeProps) {
  const getTimeAgo = (timestamp: string) => {
    return formatRelativeTime(timestamp);
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