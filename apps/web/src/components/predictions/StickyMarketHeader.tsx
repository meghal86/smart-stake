import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function StickyMarketHeader() {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`transition-all duration-200 ${isSticky ? 'sticky top-0 z-40' : ''}`}>
      <div className="h-9 px-4 py-1 bg-background/95 backdrop-blur-sm border-b flex items-center">
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          <span className="font-medium text-green-700">ETH $4,573.53</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium text-orange-600">BTC $42,350</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Provider: CG (Active) / CMC (Backup)</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Cache: 12 keys</span>
        </div>
      </div>
    </div>
  );
}