import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWatchlist, removeFromWatchlist } from "@/integrations/api/hub2";
import { WatchItem } from "@/types/hub2";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  StarOff, 
  Download, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Trash2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WatchPage() {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const { data: watchlist, isLoading, error } = useQuery({
    queryKey: ['hub2', 'watchlist'],
    queryFn: listWatchlist,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  
  const removeMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub2', 'watchlist'] });
      setSelectedItems([]);
    }
  });
  
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  const handleRemoveSelected = () => {
    selectedItems.forEach(id => {
      removeMutation.mutate(id);
    });
  };
  
  const handleExportCSV = () => {
    if (!watchlist) return;
    
    const csvContent = [
      ['Entity Type', 'Entity ID', 'Label', 'Sentiment', 'Whale Pressure', 'Risk', 'Updated At'],
      ...watchlist.map(item => [
        item.entityType,
        item.entityId,
        item.label || '',
        item.snapshots?.sentiment?.toFixed(1) || 'N/A',
        item.snapshots?.whalePressure?.toFixed(1) || 'N/A',
        item.snapshots?.risk?.toFixed(1) || 'N/A',
        item.snapshots?.updatedAt || item.createdAt
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (error) {
    return (
      <Hub2Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load watchlist</h2>
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Watchlist</h1>
              <p className="text-muted-foreground">
                Track your favorite assets, addresses, and clusters
              </p>
            </div>
            <div className="flex items-center gap-2">
              {watchlist && watchlist.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/hub2/explore'}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Items
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveSelected}
                disabled={removeMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Selected
              </Button>
            </div>
          )}
        </div>
        
        {/* Watchlist Items */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : watchlist && watchlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((item) => (
              <Card 
                key={item.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all duration-200",
                  selectedItems.includes(item.id) && "ring-2 ring-primary border-primary"
                )}
                onClick={() => handleSelectItem(item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{item.label || item.entityId}</h3>
                        <p className="text-xs text-muted-foreground">
                          {item.entityType} • {item.entityId}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.entityType}
                    </Badge>
                  </div>
                  
                  {/* Snapshots */}
                  {item.snapshots && (
                    <div className="space-y-2 mb-4">
                      {item.snapshots.sentiment !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sentiment</span>
                          <span className={cn(
                            "font-medium",
                            item.snapshots.sentiment >= 60 ? "text-green-600" :
                            item.snapshots.sentiment >= 40 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {item.snapshots.sentiment.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      
                      {item.snapshots.whalePressure !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Whale Pressure</span>
                          <div className="flex items-center gap-1">
                            {item.snapshots.whalePressure >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-600" />
                            )}
                            <span className={cn(
                              "font-medium",
                              item.snapshots.whalePressure >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {item.snapshots.whalePressure >= 0 ? '+' : ''}{item.snapshots.whalePressure.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {item.snapshots.risk !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Risk</span>
                          <span className={cn(
                            "font-medium",
                            item.snapshots.risk >= 7 ? "text-red-600" :
                            item.snapshots.risk >= 4 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {item.snapshots.risk.toFixed(1)}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMutation.mutate(item.id);
                      }}
                      disabled={removeMutation.isPending}
                      className="flex-1 text-xs"
                    >
                      <StarOff className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to entity detail
                        window.location.href = `/hub2/entity/${item.entityId}`;
                      }}
                      className="flex-1 text-xs"
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items in watchlist</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding assets, addresses, or clusters to your watchlist
            </p>
            <Button onClick={() => window.location.href = '/hub2/explore'}>
              Browse Assets
            </Button>
          </div>
        )}
      </div>
    </Hub2Layout>
  );
}
