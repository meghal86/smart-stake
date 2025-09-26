import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Bell, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface WatchlistItem {
  id: string;
  type: 'cluster' | 'chain' | 'address';
  name: string;
  value: string;
  change: number;
  isAlerted: boolean;
}

interface WatchlistCarouselProps {
  items: WatchlistItem[];
  onToggleAlert?: (id: string) => void;
  onToggleStar?: (id: string) => void;
}

export function WatchlistCarousel({ items, onToggleAlert, onToggleStar }: WatchlistCarouselProps) {
  const { track } = useAnalytics();

  const handlePrimaryAction = (item: WatchlistItem) => {
    if (item.isAlerted && onToggleStar) {
      onToggleStar(item.id);
      track('watchlist_star_toggle', { itemId: item.id, action: 'unstar' });
    } else if (onToggleAlert) {
      onToggleAlert(item.id);
      track('watchlist_alert_toggle', { itemId: item.id, action: 'alert' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Star a cluster or chain to pin it here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div 
        className="flex gap-4 pb-4 snap-x snap-mandatory"
        style={{ width: 'max-content' }}
        onScroll={(e) => {
          const container = e.currentTarget;
          const scrollLeft = container.scrollLeft;
          const itemWidth = 200; // Approximate item width
          const currentIndex = Math.round(scrollLeft / itemWidth);
          
          track('watchlist_scroll', { 
            scrollPosition: scrollLeft,
            currentIndex,
            totalItems: items.length
          });
        }}
      >
        {items.map((item) => (
          <Card 
            key={item.id}
            className="min-w-[180px] snap-center flex-shrink-0 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-8 w-8 p-0 min-w-[44px] min-h-[44px]',
                      'focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    )}
                    onClick={() => handlePrimaryAction(item)}
                    title={item.isAlerted ? 'Remove from alerts' : 'Add alert'}
                  >
                    {item.isAlerted ? (
                      <Bell className="w-4 h-4 text-blue-500 fill-current" />
                    ) : (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <TrendingUp className={cn(
                    'w-3 h-3',
                    item.change >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'
                  )} />
                  <span className={cn(
                    'text-xs font-medium',
                    item.change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}