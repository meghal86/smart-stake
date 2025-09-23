import { useState, useEffect } from 'react';
import { X, Search, Filter, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  timeframe: string;
  chain: string;
  searchQuery: string;
  onTimeframeChange: (value: string) => void;
  onChainChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  timeframe,
  chain,
  searchQuery,
  onTimeframeChange,
  onChainChange,
  onSearchChange
}: MobileDrawerProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="addr: tx: asset: risk: chain:"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use prefixes: addr:0x... tx:0x... asset:ETH risk:high chain:sol
            </p>
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Blockchain</label>
            <Select value={chain} onValueChange={onChainChange}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="eth">Ethereum</SelectItem>
                <SelectItem value="btc">Bitcoin</SelectItem>
                <SelectItem value="sol">Solana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Filters</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange('risk:high')}
                className="justify-start"
              >
                High Risk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange('amount:>1000000')}
                className="justify-start"
              >
                $1M+
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange('asset:ETH')}
                className="justify-start"
              >
                ETH Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange('asset:BTC')}
                className="justify-start"
              >
                BTC Only
              </Button>
            </div>
          </div>

          {/* Clear All */}
          <Button
            variant="ghost"
            onClick={() => {
              handleSearchChange('');
              onTimeframeChange('24h');
              onChainChange('all');
            }}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}