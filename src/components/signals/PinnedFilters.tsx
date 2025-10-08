/**
 * Pinned Filters - All | BTC | USDT | XRP | Exchanges
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/telemetry';

interface PinnedFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  signalCounts: Record<string, number>;
}

export function PinnedFilters({ activeFilter, onFilterChange, signalCounts }: PinnedFiltersProps) {
  const filters = [
    { key: 'all', label: 'All', count: signalCounts.all || 0 },
    { key: 'BTC', label: 'BTC', count: signalCounts.BTC || 0 },
    { key: 'USDT', label: 'USDT', count: signalCounts.USDT || 0 },
    { key: 'XRP', label: 'XRP', count: signalCounts.XRP || 0 },
    { key: 'exchanges', label: 'Exchanges', count: signalCounts.exchanges || 0 },
  ];

  const handleFilterClick = (filterKey: string) => {
    onFilterChange(filterKey);
    trackEvent('feed_filter_applied', { 
      filter: filterKey,
      previousFilter: activeFilter,
      signalCount: signalCounts[filterKey] || 0
    });
  };

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/40 dark:border-slate-800 py-3">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'ghost'}
              size="sm"
              className={`flex items-center gap-1.5 whitespace-nowrap ${
                activeFilter === filter.key
                  ? 'bg-[var(--brand-teal,#14B8A6)] text-white hover:bg-[var(--brand-teal,#14B8A6)]/90'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              onClick={() => handleFilterClick(filter.key)}
            >
              {filter.label}
              {filter.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0.5 ${
                    activeFilter === filter.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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