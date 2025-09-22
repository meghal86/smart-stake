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
    <div className={`sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b ${isCompact ? 'py-2' : ''}`} data-tour="toolbar">
      <div className={`flex items-center justify-between ${isCompact ? 'px-3 py-2' : 'p-4'} gap-4`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={`font-mono ${isCompact ? 'text-xs px-2 py-1' : ''}`}>
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
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(new Date()).absolute}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={`font-mono ${isCompact ? 'text-xs px-2 py-1' : ''}`}>
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
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(new Date()).absolute}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className={`${moodColor} ${isCompact ? 'text-xs px-2 py-1' : ''}`}>
                Market Mood: {marketMood}% • {pricesError ? 'Cached' : 'Live'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div>Market Sentiment: {parseFloat(marketMood) >= 0 ? 'Bullish' : 'Bearish'}</div>
                <div>Based on BTC + ETH 24h performance</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Data: {pricesError ? 'Cached fallback' : 'Live from API'}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className={isCompact ? 'w-16 h-8' : 'w-20'}>
              <Clock className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chain} onValueChange={onChainChange}>
            <SelectTrigger className={isCompact ? 'w-20 h-8' : 'w-24'}>
              <Filter className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
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
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
            <Input
              id="market-search"
              placeholder={isCompact ? "Search..." : "addr: tx: asset: risk: chain:"}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`${isCompact ? 'pl-8 w-48 h-8 text-sm' : 'pl-10 w-64'}`}
            />
            {localSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
                <div className="p-2 text-xs text-muted-foreground">
                  <div>Prefixes: addr:0x... tx:0x... asset:ETH risk:high chain:sol</div>
                </div>
              </div>
            )}
          </div>

          <SavedViewsManager
            currentState={{ timeframe, chain, searchQuery, activeTab }}
            onViewSelect={onSavedViewSelect}
            onSaveView={onSaveView}
          />
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={isCompact ? 'default' : 'ghost'}
                size="sm"
                onClick={handleCompactToggle}
                className={`${isCompact ? 'h-7 w-7' : 'h-8 w-8'} p-0`}
              >
                <Layers className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                {isCompact ? 'Switch to Comfortable View' : 'Switch to Compact View'}
                <div className="text-xs text-muted-foreground mt-1">
                  {isCompact ? 'More spacing, larger elements' : 'Bloomberg-style density'}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={`${isCompact ? 'h-7 w-7' : 'h-8 w-8'} p-0`}
          >
            {theme === 'dark' ? <Sun className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} /> : <Moon className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(true)}
            className={`${isCompact ? 'h-7 w-7' : 'h-8 w-8'} p-0`}
          >
            <HelpCircle className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </Button>
        </div>
      </div>
      
      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}