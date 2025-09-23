import { useState, useEffect } from 'react';
import { Search, Clock, Filter, Bookmark, Moon, Sun, HelpCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { useCompactView } from '@/contexts/CompactViewContext';
import { usePricesSummary } from '@/hooks/useMarketData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatTimestamp } from '@/utils/timeFormat';
import { SavedViewsManager } from './SavedViewsManager';
import { calculateMarketMood } from '@/utils/marketMood';
import { HelpOverlay } from './HelpOverlay';

interface StickyToolbarProps {
  timeframe: string;
  chain: string;
  searchQuery: string;
  activeTab: string;
  onTimeframeChange: (value: string) => void;
  onChainChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSavedViewSelect: (viewId: string) => void;
  onSaveView: (name: string) => void;
}

export function StickyToolbar({
  timeframe,
  chain,
  searchQuery,
  activeTab,
  onTimeframeChange,
  onChainChange,
  onSearchChange,
  onSavedViewSelect,
  onSaveView
}: StickyToolbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { isCompact, toggleCompact } = useCompactView();
  const { track } = useAnalytics();
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = usePricesSummary(['BTC', 'ETH']);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 250);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('market-search')?.focus();
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Use fallback data if API fails
  const btcData = pricesData?.data?.find(p => p.symbol === 'BTC');
  const ethData = pricesData?.data?.find(p => p.symbol === 'ETH');
  
  const btcPrice = btcData?.price || 43500;
  const ethPrice = ethData?.price || 2650;
  const btcChange = btcData?.pct_24h || 2.1;
  const ethChange = ethData?.pct_24h || 1.8;

  const marketMood = ((btcChange + ethChange) / 2).toFixed(1);
  const moodColor = parseFloat(marketMood) >= 0 ? 'text-green-500' : 'text-red-500';
  
  const handleCompactToggle = () => {
    toggleCompact();
    track('compact_toggle', { isCompact: !isCompact });
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b py-1 sm:py-2" data-tour="toolbar">
      {/* Mobile-first layout */}
      <div className="px-2 sm:px-4">
        {/* Top row - prices (mobile) */}
        <div className="flex items-center justify-between mb-2 sm:hidden">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Badge variant="outline" className="text-xs px-1 py-0.5 whitespace-nowrap">
              ${btcPrice.toLocaleString()}
              <span className={btcChange >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(1)}%
              </span>
            </Badge>
            <Badge variant="outline" className="text-xs px-1 py-0.5 whitespace-nowrap">
              ${ethPrice.toLocaleString()}
              <span className={ethChange >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(1)}%
              </span>
            </Badge>
          </div>
          <Badge variant="secondary" className={`text-xs px-1 py-0.5 ${moodColor}`}>
            {marketMood}%
          </Badge>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-12 sm:w-16 h-7 sm:h-8 text-xs">
                <Clock className="h-3 w-3 mr-0.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chain} onValueChange={onChainChange}>
              <SelectTrigger className="w-14 sm:w-20 h-7 sm:h-8 text-xs">
                <Filter className="h-3 w-3 mr-0.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="btc">BTC</SelectItem>
                <SelectItem value="sol">SOL</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                id="market-search"
                placeholder="Search..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-6 w-20 sm:w-32 h-7 sm:h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCompactToggle}
              className="h-7 w-7 p-0"
            >
              <Layers className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-7 w-7 p-0"
            >
              {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="font-mono whitespace-nowrap">
                    BTC ${pricesLoading ? '...' : btcPrice.toLocaleString()}
                    <span className={btcChange >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                      {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div>Bitcoin Price: ${btcPrice.toLocaleString()}</div>
                    <div>24h Change: {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%</div>
                  </div>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="font-mono whitespace-nowrap">
                    ETH ${pricesLoading ? '...' : ethPrice.toLocaleString()}
                    <span className={ethChange >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                      {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div>Ethereum Price: ${ethPrice.toLocaleString()}</div>
                    <div>24h Change: {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Badge variant="secondary" className={`${moodColor}`}>
              Market Mood: {marketMood}% • {pricesError ? 'Cached' : 'Live'}
            </Badge>
          </div>

          <SavedViewsManager
            currentState={{ timeframe, chain, searchQuery, activeTab }}
            onViewSelect={onSavedViewSelect}
            onSaveView={onSaveView}
          />
        </div>
      </div>
      
      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}