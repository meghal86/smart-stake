/**
 * Signals Tabs + Summary Bar - Sticky Under Header
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trackEvent } from '@/lib/telemetry';

interface SignalsTabsBarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  summary: {
    critical: number;
    volumeUsd: number;
    assets: number;
  };
}

export function SignalsTabsBar({ activeTab, onChange, summary }: SignalsTabsBarProps) {
  const handleTabChange = (tab: string) => {
    trackEvent('signals_tab_changed', { to: tab as 'top' | 'all' | 'raw' });
    onChange(tab);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  return (
    <div className="sticky top-16 z-20 h-12 bg-background/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger 
              value="top" 
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100 text-sm flex items-center gap-1"
              role="tab"
              aria-selected={activeTab === 'top'}
            >
              🦈 Top
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100 text-sm flex items-center gap-1"
              role="tab"
              aria-selected={activeTab === 'all'}
            >
              📜 All
            </TabsTrigger>
            <TabsTrigger 
              value="raw"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100 text-sm flex items-center gap-1"
              role="tab"
              aria-selected={activeTab === 'raw'}
            >
              🛠️ Raw
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Summary */}
        <div className="flex items-center gap-4 text-sm">
          {/* Desktop: Separate items */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-red-500">{summary.critical}</span>
              <span className="text-slate-600 dark:text-slate-400">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatVolume(summary.volumeUsd)}</span>
              <span className="text-slate-600 dark:text-slate-400">Volume</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{summary.assets}</span>
              <span className="text-slate-600 dark:text-slate-400">Assets</span>
            </div>
          </div>

          {/* Mobile: Compact pill */}
          <div className="md:hidden">
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              {summary.critical} Critical • {formatVolume(summary.volumeUsd)} • {summary.assets} Assets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}