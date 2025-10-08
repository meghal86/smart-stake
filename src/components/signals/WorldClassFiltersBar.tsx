/**
 * World-Class Filters Bar - Sticky chips with live counts
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/telemetry';

interface WorldClassFiltersBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

export function WorldClassFiltersBar({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: WorldClassFiltersBarProps) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all || 0 },
    { key: 'BTC', label: 'BTC', count: counts.BTC || 0 },
    { key: 'USDT', label: 'USDT', count: counts.USDT || 0 },
    { key: 'XRP', label: 'XRP', count: counts.XRP || 0 },
    { key: 'exchanges', label: 'Exchanges', count: counts.exchanges || 0 },
    { key: 'large', label: 'Large', count: counts.large || 0 },
  ];

  const handleFilterClick = (filterKey: string) => {
    onFilterChange(filterKey);
    trackEvent('feed_filter_applied', { 
      filter: filterKey,
      previousFilter: activeFilter,
      signalCount: counts[filterKey] || 0
    });
  };

  return (
    <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/40 dark:border-slate-800 py-2 mb-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'ghost'}
              size="sm"
              className={`flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 text-xs px-3 py-2 h-8 min-w-fit flex-shrink-0 ${
                activeFilter === filter.key
                  ? 'bg-[var(--brand-teal,#14B8A6)] text-white hover:bg-[var(--brand-teal,#14B8A6)]/90 shadow-[0_2px_8px_rgba(20,184,166,0.25)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              onClick={() => handleFilterClick(filter.key)}
            >
              <span className="text-xs">{filter.label}</span>
              {filter.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-1.5 py-0.5 h-4 min-w-[18px] tabular-nums flex items-center justify-center rounded-full ${
                    activeFilter === filter.key
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {filter.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}