import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveDataIndicatorProps {
  isLive: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export function LiveDataIndicator({ 
  isLive, 
  lastUpdated, 
  onRefresh, 
  loading = false 
}: LiveDataIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const updated = new Date(lastUpdated);
      const diffMs = now.getTime() - updated.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}s ago`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diffMinutes / 60)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant={isLive ? "default" : "secondary"}
            className={`flex items-center gap-1 ${
              isLive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {isLive ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isLive ? 'Live' : 'Cached'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLive ? 'Real-time data from blockchain' : 'Using cached data'}</p>
          {lastUpdated && <p className="text-xs">Updated: {timeAgo}</p>}
        </TooltipContent>
      </Tooltip>

      {onRefresh && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh data</p>
          </TooltipContent>
        </Tooltip>
      )}

      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      )}
    </div>
  );
}