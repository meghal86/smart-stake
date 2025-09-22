import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ApiCall {
  endpoint: string;
  latency: number;
  cacheStatus: string;
  timestamp: Date;
  provider: string;
}

export function DevInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // POLISH: Mock API call tracking - in production, this would be populated by interceptors
  useEffect(() => {
    const mockCalls: ApiCall[] = [
      {
        endpoint: '/market-summary',
        latency: 245,
        cacheStatus: 'HIT',
        timestamp: new Date(Date.now() - 30000),
        provider: 'Enhanced API'
      },
      {
        endpoint: '/whale-alerts',
        latency: 180,
        cacheStatus: 'MISS',
        timestamp: new Date(Date.now() - 60000),
        provider: 'Supabase'
      },
      {
        endpoint: '/prices',
        latency: 320,
        cacheStatus: 'HIT',
        timestamp: new Date(Date.now() - 120000),
        provider: 'CoinGecko'
      }
    ];
    setApiCalls(mockCalls);
  }, []);

  const formatLatency = (ms: number) => {
    if (ms < 100) return 'text-green-500';
    if (ms < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 Dev Info
            <Badge variant="outline" className="text-xs">Ctrl/⌘+.</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recent API Calls</h4>
          {apiCalls.map((call, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs">{call.endpoint}</span>
                <Badge variant={call.cacheStatus === 'HIT' ? 'default' : 'secondary'} className="text-xs">
                  {call.cacheStatus}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Latency: </span>
                  <span className={formatLatency(call.latency)}>{call.latency}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider: </span>
                  <span>{call.provider}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                {call.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Press Ctrl/⌘+. to toggle this panel
        </div>
      </DialogContent>
    </Dialog>
  );
}