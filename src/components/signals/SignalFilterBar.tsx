/**
 * Signal Filter Bar - Lite App Styling
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { SignalFilter } from '@/types/signal';

interface SignalFilterBarProps {
  filter: SignalFilter;
  onChange: (filter: SignalFilter) => void;
}

export function SignalFilterBar({ filter, onChange }: SignalFilterBarProps) {
  const hasActiveFilters = 
    filter.mutedWallets.length > 0 || 
    filter.mutedExchanges.length > 0 || 
    filter.mutedAssets.length > 0;

  const clearAllFilters = () => {
    onChange({
      mutedWallets: [],
      mutedExchanges: [],
      mutedAssets: [],
    });
  };

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="border-b border-slate-200/40 dark:border-slate-800 px-4 py-2 bg-slate-50/30 dark:bg-slate-900/30">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Filters:</span>
        
        {filter.mutedAssets.map((asset) => (
          <Badge 
            key={asset} 
            variant="outline" 
            className="text-xs bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
          >
            Muted: {asset}
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 ml-1 hover:bg-red-100 dark:hover:bg-red-900/20"
              onClick={() => onChange({
                ...filter,
                mutedAssets: filter.mutedAssets.filter(a => a !== asset)
              })}
            >
              <X className="h-2 w-2" />
            </Button>
          </Badge>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}