import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExplore } from "@/hooks/hub2";
import { useHub2 } from "@/store/hub2";
import { useUIMode } from "@/store/uiMode";
import EntitySummaryCard from "@/components/hub2/EntitySummaryCard";
import FilterChips from "@/components/hub2/FilterChips";
import ModeToggle from "@/components/hub2/ModeToggle";
import ProvenanceChip from "@/components/hub2/ProvenanceChip";
import PercentileBadge from "@/components/hub2/PercentileBadge";
import VenueList from "@/components/hub2/VenueList";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, Search, Filter, GitCompare, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { filters, compare, toggleCompare, watchlist, addWatch, removeWatch } = useHub2();
  const { mode, setMode } = useUIMode();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (filters.chains.length > 0) {
      params.set('chains', filters.chains.join(','));
    }
    if (filters.assets.length > 0) {
      params.set('assets', filters.assets.join(','));
    }
    if (filters.sentimentMin !== undefined) {
      params.set('sentiment_min', filters.sentimentMin.toString());
    }
    if (filters.riskMax !== undefined) {
      params.set('risk_max', filters.riskMax.toString());
    }
    if (filters.window) {
      params.set('window', filters.window);
    }
    if (filters.realOnly !== null) {
      params.set('real', filters.realOnly ? '1' : '0');
    }
    if (filters.sort) {
      params.set('sort', filters.sort);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    return params.toString();
  };

  const queryString = buildQueryString();
  const { data, isLoading, error } = useExplore(queryString);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // Implement infinite scroll logic here
    setTimeout(() => setIsLoadingMore(false), 1000);
  };

  if (error) {
    return (
      <Hub2Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Hub2Layout>
    );
  }

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Explore</h1>
              <p className="text-muted-foreground">
                {mode === 'novice' 
                  ? 'Discover assets, chains, and clusters' 
                  : 'Advanced asset discovery with percentile benchmarking and venue analysis'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle mode={mode} onModeChange={setMode} />
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex border rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Compare Button */}
                {compare.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Open compare modal
                      console.log('Open compare modal');
                    }}
                    className="flex items-center gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare ({compare.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assets, chains, or clusters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips />

        {/* Results */}
        <div className="mt-6">
          {isLoading ? (
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            )}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {data.items.length} of {data.total} results
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <select 
                    value={filters.sort || ''} 
                    onChange={(e) => {
                      const newFilters = { ...filters, sort: e.target.value as any };
                      // Update filters and URL
                    }}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="">Default</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="risk">Risk</option>
                    <option value="pressure">Pressure</option>
                    <option value="price">Price</option>
                  </select>
                </div>
              </div>

              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {data.items.map((entity) => (
                  <EntitySummaryCard
                    key={entity.id}
                    entity={entity}
                    isSelected={false}
                    isInCompare={compare.includes(entity.id)}
                    isWatched={watchlist.includes(entity.id)}
                    onSelect={(id) => {
                      navigate(`/hub2/entity/${id}`);
                    }}
                    onCompare={(id) => {
                      toggleCompare(id);
                    }}
                    onWatch={(id) => {
                      if (watchlist.includes(id)) {
                        removeWatch(id);
                      } else {
                        addWatch(id);
                      }
                    }}
                    className={viewMode === 'list' ? 'flex flex-row' : ''}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {data.hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="w-32"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={() => {
                  // Clear all filters
                  const newFilters = {
                    chains: [],
                    assets: [],
                    sentimentMin: undefined,
                    riskMax: undefined,
                    window: '24h' as const,
                    realOnly: null,
                    sort: undefined
                  };
                  // Update filters
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Hub2Layout>
  );
}