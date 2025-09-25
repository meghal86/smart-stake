import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock } from 'lucide-react';

interface HeaderStickyProps {
  timeWindow: string;
  onTimeWindowChange: (window: string) => void;
  onRefresh: () => void;
  lastUpdated?: string;
}

export function HeaderSticky({ timeWindow, onTimeWindowChange, onRefresh, lastUpdated }: HeaderStickyProps) {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    
    const sentinel = document.getElementById('header-sentinel');
    if (sentinel) observer.observe(sentinel);
    
    return () => observer.disconnect();
  }, []);

  const refreshedMinutesAgo = lastUpdated ? 
    Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000) : 0;

  return (
    <>
      <div id="header-sentinel" className="h-0" />
      <div className={`sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b transition-shadow ${
        isStuck ? 'shadow-sm' : ''
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Market Intelligence Hub</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={onRefresh}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              title="Click to refresh all data"
            >
              <Clock className="w-3 h-3" />
              Last updated · {refreshedMinutesAgo}m ago
            </button>
            <WindowChips value={timeWindow} onChange={onTimeWindowChange} />
          </div>
        </div>
      </div>
    </>
  );
}

function WindowChips({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const windows = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' }
  ];

  return (
    <div role="tablist" aria-label="Time window" className="flex gap-1 bg-muted rounded-lg p-1">
      {windows.map((window) => (
        <Button
          key={window.key}
          role="tab"
          aria-selected={value === window.key}
          size="sm"
          variant={value === window.key ? 'default' : 'ghost'}
          className="h-8 px-3 text-xs min-w-[44px]"
          onClick={() => onChange(window.key)}
        >
          {window.label}
        </Button>
      ))}
    </div>
  );
}