import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useHub2 } from "@/store/hub2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Command, 
  X, 
  TrendingUp, 
  Users, 
  Bell, 
  Activity,
  ArrowRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  type: 'asset' | 'address' | 'alert' | 'cluster';
  title: string;
  subtitle: string;
  icon: React.ComponentType<unknown>;
  url: string;
  badge?: string;
}

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const navigate = useNavigate();
  const { filters } = useHub2();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results - in production this would call a search API
  const mockResults: SearchResult[] = [
    {
      id: 'btc',
      type: 'asset',
      title: 'Bitcoin',
      subtitle: 'BTC • $45,230.50',
      icon: TrendingUp,
      url: '/hub2/entity/btc',
      badge: 'Real'
    },
    {
      id: 'eth',
      type: 'asset', 
      title: 'Ethereum',
      subtitle: 'ETH • $3,120.80',
      icon: TrendingUp,
      url: '/hub2/entity/eth',
      badge: 'Real'
    },
    {
      id: 'whale-alert-1',
      type: 'alert',
      title: 'Large BTC Transfer',
      subtitle: 'Alert • 1,200 BTC moved',
      icon: Bell,
      url: '/hub2/alerts',
      badge: 'Active'
    },
    {
      id: 'cluster-1',
      type: 'cluster',
      title: 'Whale Cluster #1',
      subtitle: 'Cluster • 15 addresses',
      icon: Users,
      url: '/hub2/entity/cluster-1',
      badge: 'Real'
    },
    {
      id: 'address-1',
      type: 'address',
      title: '0x742d...3a1f',
      subtitle: 'Address • 2,500 ETH',
      icon: Activity,
      url: '/hub2/entity/address-1',
      badge: 'Real'
    }
  ];

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate search delay
    const timeout = setTimeout(() => {
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return TrendingUp;
      case 'address': return Activity;
      case 'alert': return Bell;
      case 'cluster': return Users;
      default: return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-green-600';
      case 'address': return 'text-blue-600';
      case 'alert': return 'text-orange-600';
      case 'cluster': return 'text-purple-600';
      default: return 'text-meta';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Hub 2
          </DialogTitle>
        </DialogHeader>
        
        <div className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              onKeyDown={handleKeyDown}
              placeholder="Search assets, addresses, alerts..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex items-center gap-1 ml-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            
            {!isLoading && results.length === 0 && query && (
              <div className="p-4 text-center text-muted-foreground">No results found for "{query}"</div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div>
                {results.map((result) => {
                  const Icon = getTypeIcon(result.type);
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted"
                    >
                      <Icon className={cn("w-4 h-4", getTypeColor(result.type))} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      </div>
                      {result.badge && (
                        <Badge variant="outline" className="text-xs">
                          {result.badge}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
            
            {!query && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Command className="w-4 h-4" />
                  <span className="text-sm">Quick Navigation</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">g</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded text-xs">p</kbd> for Pulse</div>
                  <div>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">g</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded text-xs">e</kbd> for Explore</div>
                  <div>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">g</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded text-xs">w</kbd> for Watchlist</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
