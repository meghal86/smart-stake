import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastEventTime: Date | null;
  eventCount: number;
  section?: string;
}

export function RealtimeIndicator({ 
  isConnected, 
  lastEventTime, 
  eventCount, 
  section = 'whale events' 
}: RealtimeIndicatorProps) {
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation when new events arrive
  useEffect(() => {
    if (lastEventTime) {
      setPulseKey(prev => prev + 1);
    }
  }, [lastEventTime]);

  const getTimeSinceLastEvent = () => {
    if (!lastEventTime) return 'No events yet';
    
    const seconds = Math.floor((Date.now() - lastEventTime.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (!isConnected) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="text-red-500 border-red-500/30">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Realtime connection lost for {section}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="text-green-500 border-green-500/30">
          <div className="relative mr-1">
            <Wifi className="h-3 w-3" />
            {lastEventTime && (
              <div 
                key={pulseKey}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping"
              />
            )}
          </div>
          Live
          {eventCount > 0 && (
            <span className="ml-1 text-xs">({eventCount})</span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p>Realtime {section} active</p>
          <p>Last event: {getTimeSinceLastEvent()}</p>
          <p>Total events: {eventCount}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}