import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useHub2 } from "@/store/hub2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, Clock, TrendingUp, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB' },
];

const ASSETS = [
  { id: 'usdt', name: 'Tether', symbol: 'USDT' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC' },
  { id: 'dai', name: 'Dai', symbol: 'DAI' },
  { id: 'wbtc', name: 'Wrapped Bitcoin', symbol: 'WBTC' },
];

export default function FilterChips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters } = useHub2();
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync URL params with store
  useEffect(() => {
    const chains = searchParams.get('chains')?.split(',').filter(Boolean) || [];
    const assets = searchParams.get('assets')?.split(',').filter(Boolean) || [];
    const sentimentMin = searchParams.get('sentiment_min') ? Number(searchParams.get('sentiment_min')) : undefined;
    const riskMax = searchParams.get('risk_max') ? Number(searchParams.get('risk_max')) : undefined;
    const window = (searchParams.get('window') as '24h'|'7d'|'30d') || '24h';
    const realOnly = searchParams.get('real') === '1' ? true : searchParams.get('real') === '0' ? false : null;
    const sort = (searchParams.get('sort') as 'sentiment'|'risk'|'pressure'|'price') || undefined;

    setFilters({
      chains,
      assets,
      sentimentMin,
      riskMax,
      window,
      realOnly,
      sort
    });
  }, [searchParams, setFilters]);

  // Update URL when filters change
  const updateURL = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams);
    
    if (newFilters.chains?.length) {
      params.set('chains', newFilters.chains.join(','));
    } else {
      params.delete('chains');
    }
    
    if (newFilters.assets?.length) {
      params.set('assets', newFilters.assets.join(','));
    } else {
      params.delete('assets');
    }
    
    if (newFilters.sentimentMin !== undefined) {
      params.set('sentiment_min', newFilters.sentimentMin.toString());
    } else {
      params.delete('sentiment_min');
    }
    
    if (newFilters.riskMax !== undefined) {
      params.set('risk_max', newFilters.riskMax.toString());
    } else {
      params.delete('risk_max');
    }
    
    if (newFilters.window) {
      params.set('window', newFilters.window);
    }
    
    if (newFilters.realOnly !== null) {
      params.set('real', newFilters.realOnly ? '1' : '0');
    } else {
      params.delete('real');
    }
    
    if (newFilters.sort) {
      params.set('sort', newFilters.sort);
    } else {
      params.delete('sort');
    }
    
    setSearchParams(params);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const removeFilter = (key: keyof typeof filters) => {
    const newFilters = { ...filters, [key]: key === 'chains' || key === 'assets' ? [] : undefined };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = {
      chains: [],
      assets: [],
      sentimentMin: undefined,
      riskMax: undefined,
      window: '24h' as const,
      realOnly: null,
      sort: undefined
    };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const activeFiltersCount = [
    filters.chains.length,
    filters.assets.length,
    filters.sentimentMin !== undefined ? 1 : 0,
    filters.riskMax !== undefined ? 1 : 0,
    filters.minUsd !== undefined ? 1 : 0,
    filters.realOnly !== null ? 1 : 0,
    filters.sort ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Chains Filter */}
          <Select onValueChange={(value) => {
            if (!filters.chains.includes(value)) {
              handleFilterChange('chains', [...filters.chains, value]);
            }
          }}>
            <SelectTrigger className="w-32 h-8">
              <Globe className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Chains" />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map(chain => (
                <SelectItem key={chain.id} value={chain.id}>
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assets Filter */}
          <Select onValueChange={(value) => {
            if (!filters.assets.includes(value)) {
              handleFilterChange('assets', [...filters.assets, value]);
            }
          }}>
            <SelectTrigger className="w-32 h-8">
              <TrendingUp className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Assets" />
            </SelectTrigger>
            <SelectContent>
              {ASSETS.map(asset => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Window */}
          <Select value={filters.window} onValueChange={(value) => handleFilterChange('window', value)}>
            <SelectTrigger className="w-24 h-8">
              <Clock className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
            </SelectContent>
          </Select>

          {/* Signal Type Filter */}
          <Select onValueChange={(value) => {
            // This would filter by signal type
            console.log('Signal type filter:', value);
          }}>
            <SelectTrigger className="w-36 h-8">
              <Shield className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Signal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="whales">Whales</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
            </SelectContent>
          </Select>

          {/* Min USD Filter */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min USD"
              className="w-20 h-8 px-2 text-xs border rounded"
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                handleFilterChange('minUsd', value);
              }}
            />
          </div>

          {/* Real/Sim Toggle */}
          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={filters.realOnly === true ? "default" : "ghost"}
              onClick={() => handleFilterChange('realOnly', filters.realOnly === true ? null : true)}
              className="h-8 px-3 text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />
              Real
            </Button>
            <Button
              size="sm"
              variant={filters.realOnly === false ? "default" : "ghost"}
              onClick={() => handleFilterChange('realOnly', filters.realOnly === false ? null : false)}
              className="h-8 px-3 text-xs"
            >
              Sim
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {filters.chains.map(chainId => {
              const chain = CHAINS.find(c => c.id === chainId);
              return (
                <Badge key={chainId} variant="secondary" className="flex items-center gap-1">
                  {chain?.name || chainId}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('chains', filters.chains.filter(c => c !== chainId))}
                  />
                </Badge>
              );
            })}
            
            {filters.assets.map(assetId => {
              const asset = ASSETS.find(a => a.id === assetId);
              return (
                <Badge key={assetId} variant="secondary" className="flex items-center gap-1">
                  {asset?.name || assetId}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('assets', filters.assets.filter(a => a !== assetId))}
                  />
                </Badge>
              );
            })}
            
            {filters.sentimentMin !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sentiment ≥ {filters.sentimentMin}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('sentimentMin', undefined)}
                />
              </Badge>
            )}
            
            {filters.riskMax !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Risk ≤ {filters.riskMax}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('riskMax', undefined)}
                />
              </Badge>
            )}
            
            {filters.minUsd !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min ${filters.minUsd}M
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('minUsd', undefined)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chains */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Chains</label>
              <Select onValueChange={(value) => {
                if (!filters.chains.includes(value)) {
                  handleFilterChange('chains', [...filters.chains, value]);
                }
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Add chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map(chain => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assets */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Assets</label>
              <Select onValueChange={(value) => {
                if (!filters.assets.includes(value)) {
                  handleFilterChange('assets', [...filters.assets, value]);
                }
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Add asset" />
                </SelectTrigger>
                <SelectContent>
                  {ASSETS.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sentiment Min */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Min Sentiment</label>
              <Input
                type="number"
                placeholder="0-100"
                value={filters.sentimentMin || ''}
                onChange={(e) => handleFilterChange('sentimentMin', e.target.value ? Number(e.target.value) : undefined)}
                className="h-8"
                min="0"
                max="100"
              />
            </div>

            {/* Risk Max */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Max Risk</label>
              <Input
                type="number"
                placeholder="0-10"
                value={filters.riskMax || ''}
                onChange={(e) => handleFilterChange('riskMax', e.target.value ? Number(e.target.value) : undefined)}
                className="h-8"
                min="0"
                max="10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
