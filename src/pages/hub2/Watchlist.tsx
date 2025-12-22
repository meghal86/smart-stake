import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWatchlist, removeFromWatchlist } from "@/integrations/api/hub2";
import { WatchItem } from "@/types/hub2";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisabledTooltipButton } from "@/components/ui/disabled-tooltip-button";
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

export default function WatchlistPage() {
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
      queryClient.invalidateQueries(['hub2', 'watchlist']);
    },
  });

  const handleRemoveItem = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      setSelectedItems(prev => prev.filter(item => item !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleRemoveSelected = async () => {
    try {
      await Promise.all(selectedItems.map(id => removeMutation.mutateAsync(id)));
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to remove selected items:', error);
    }
  };

  const handleExportCSV = () => {
    if (!watchlist || watchlist.length === 0) return;
    
    const headers = ['entityType', 'entityId', 'label', 'sentiment', 'whalePressure', 'risk', 'updatedAt'];
    const csvRows = [
      headers.join(','),
      ...watchlist.map(item => {
        const sentiment = item.snapshots?.sentiment ?? '';
        const whalePressure = item.snapshots?.whalePressure ?? '';
        const risk = item.snapshots?.risk ?? '';
        const updatedAt = item.snapshots?.updatedAt ?? '';
        return `${item.entityType},${item.entityId},"${item.label || ''}",${sentiment},${whalePressure},${risk},${updatedAt}`;
      })
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'hub2_watchlist.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Hub2Layout>
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="mb-3">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24 ml-auto" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Hub2Layout>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Watchlist</h1>
            <p className="text-muted-foreground">
              Monitor your priority assets, addresses, and clusters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DisabledTooltipButton 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV} 
              disabled={!watchlist || watchlist.length === 0}
              disabledTooltip={!watchlist || watchlist.length === 0 ? "No items to export" : undefined}
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </DisabledTooltipButton>
            <DisabledTooltipButton 
              variant="destructive" 
              size="sm" 
              onClick={handleRemoveSelected} 
              disabled={selectedItems.length === 0}
              disabledTooltip={selectedItems.length === 0 ? "Select items to remove" : undefined}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Selected
            </DisabledTooltipButton>
          </div>
        </div>

        {!watchlist || watchlist.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Star assets from the Explore page or Asset Detail to add them here.
            </p>
            <Button onClick={() => window.location.href = '/hub2/explore'}>
              Explore Assets
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={selectedItems.length === watchlist.length && watchlist.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(watchlist.map(item => item.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="w-32">Entity</span>
                <span className="flex-1">Label</span>
                <span className="w-24 text-center">Sentiment</span>
                <span className="w-24 text-center">Pressure</span>
                <span className="w-24 text-center">Risk</span>
                <span className="w-32 text-right">Last Updated</span>
                <span className="w-8"></span>
              </CardContent>
            </Card>

            {watchlist.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {
                      setSelectedItems(prev =>
                        prev.includes(item.id) 
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                    className="w-4 h-4"
                  />
                  <div className="w-32 font-medium">
                    {item.entityType === 'asset' && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto" 
                        onClick={() => window.location.href = `/hub2/entity/${item.entityId}`}
                      >
                        {item.entityId.toUpperCase()}
                      </Button>
                    )}
                    {item.entityType === 'address' && item.entityId.slice(0, 8) + '...'}
                    {item.entityType === 'cluster' && item.entityId.replace('cluster_', '').replace('_', ' ')}
                  </div>
                  <div className="flex-1 text-muted-foreground">{item.label || '-'}</div>
                  <div className="w-24 text-center">
                    {item.snapshots?.sentiment !== undefined ? (
                      <Badge 
                        variant={item.snapshots.sentiment > 60 ? 'default' : item.snapshots.sentiment < 40 ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.snapshots.sentiment > 60 ? 'Positive' : item.snapshots.sentiment < 40 ? 'Negative' : 'Neutral'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div className="w-24 text-center">
                    {item.snapshots?.whalePressure !== undefined ? (
                      <div className="flex items-center justify-center">
                        {item.snapshots.whalePressure > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : item.snapshots.whalePressure < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="ml-1 text-xs">
                          {Math.abs(item.snapshots.whalePressure)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div className="w-24 text-center">
                    {item.snapshots?.risk !== undefined ? (
                      <Badge 
                        variant={item.snapshots.risk >= 70 ? 'destructive' : item.snapshots.risk >= 40 ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {item.snapshots.risk.toFixed(0)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div className="w-32 text-right text-xs text-muted-foreground">
                    {item.snapshots?.updatedAt ? new Date(item.snapshots.updatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="w-8">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Hub2Layout>
  );
}