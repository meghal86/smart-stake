import { useState, useEffect } from 'react';
import { Fish, TrendingUp, Wallet, Bell, ExternalLink, Plus, Heart, HeartOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealtimeWhales } from '@/hooks/useRealtimeWhales';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'whale' | 'portfolio' | 'sentiment';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: unknown;
  deepLink?: string;
  followable?: {
    type: 'address' | 'asset';
    value: string;
  };
}

interface RightActivityFeedProps {
  onItemClick?: (item: ActivityItem) => void;
}

export function RightActivityFeed({ onItemClick }: RightActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const { userPlan } = useSubscription();
  const { events: realtimeEvents } = useRealtimeWhales(10);
  const { data: portfolioData } = usePortfolioSummary();

  useEffect(() => {
    const fetchRealActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch real whale data
        const { data, error } = await supabase.functions.invoke('whale-alerts');
        
        if (!error && data?.transactions) {
          const realActivities: ActivityItem[] = data.transactions
            .slice(0, 20)
            .map((tx: unknown, index: number) => {
              const amount = tx.amount_usd || 0;
              const token = (tx.symbol || 'UNKNOWN').toUpperCase();
              const fromAddr = tx.from?.address || 'Unknown';
              const toAddr = tx.to?.address || 'Unknown';
              const exchange = tx.from?.owner || tx.to?.owner;
              
              let title = 'Whale Transfer';
              let description = `${(amount / 1000000).toFixed(1)}M ${token}`;
              
              if (amount > 10000000) {
                title = 'Mega Whale Alert';
                description = `🚨 ${(amount / 1000000).toFixed(1)}M ${token} transfer`;
              } else if (exchange) {
                title = `${exchange} Activity`;
                description = `${(amount / 1000000).toFixed(1)}M ${token} moved`;
              }
              
              return {
                id: `whale_${tx.hash || tx.id || Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'whale' as const,
                title,
                description,
                timestamp: new Date(tx.timestamp * 1000),
                metadata: { 
                  amount, 
                  token, 
                  from: fromAddr.slice(0, 8) + '...', 
                  to: toAddr.slice(0, 8) + '...',
                  exchange 
                },
                deepLink: `/?tab=market&marketTab=whales&highlight=${tx.hash}`,
                followable: {
                  type: amount > 5000000 ? 'address' : 'asset',
                  value: amount > 5000000 ? fromAddr : token
                }
              };
            });
          
          // Merge realtime events with API data
          const realtimeActivities: ActivityItem[] = realtimeEvents.map((event, index) => ({
            id: `realtime_${event.id}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'whale' as const,
            title: `🔴 Live: ${event.asset} Whale`,
            description: `${(event.usd_amount / 1000000).toFixed(1)}M ${event.asset} moved`,
            timestamp: new Date(event.occurred_at),
            metadata: {
              amount: event.usd_amount,
              token: event.asset,
              risk: event.risk_level,
              isLive: true
            },
            deepLink: `/?tab=market&marketTab=whales&highlight=${event.tx_hash}`,
            followable: {
              type: 'address',
              value: event.whale_address
            }
          }));
          
          // Add portfolio activities if available
          const portfolioActivities: ActivityItem[] = portfolioData ? [
            {
              id: `portfolio_summary_${Date.now()}`,
              type: 'portfolio' as const,
              title: 'Portfolio Update',
              description: `${portfolioData.data.pnl_24h >= 0 ? '+' : ''}$${portfolioData.data.pnl_24h.toLocaleString()} (${portfolioData.data.pnl_24h_pct.toFixed(1)}%)`,
              timestamp: new Date(portfolioData.data.last_activity),
              metadata: {
                totalValue: portfolioData.data.total_value,
                pnl24h: portfolioData.data.pnl_24h,
                addresses: portfolioData.data.monitored_addresses
              },
              deepLink: '/?tab=market&marketTab=portfolio'
            }
          ] : [];
          
          // Combine and sort all activities
          const allActivities = [...realtimeActivities, ...realActivities, ...portfolioActivities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 20);
          
          setActivities(allActivities);
        } else {
          throw new Error('No whale data available');
        }
      } catch (err) {
        console.error('Failed to fetch activity data:', err);
        
        // Fallback to minimal mock data
        const fallbackActivities: ActivityItem[] = [
          {
            id: `fallback_${Date.now()}`,
            type: 'whale',
            title: 'Whale Activity',
            description: 'Live data temporarily unavailable',
            timestamp: new Date(),
            deepLink: '/?tab=market&marketTab=whales'
          }
        ];
        
        setActivities(fallbackActivities);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRealActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRealActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'whale': return <Fish className="h-4 w-4 text-blue-500" />;
      case 'sentiment': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'portfolio': return <Wallet className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isLimited = userPlan.plan === 'free';
  const displayActivities = isLimited ? activities.slice(0, 5) : activities;

  return (
    <Card className="w-80 h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Activity Feed</h3>
          <Badge variant="secondary" className="text-xs">
            {activities.length} items
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3" role="log" aria-live="polite">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : (
            displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onItemClick?.(activity)}
              >
                <div className="mt-0.5">
                  {getIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {activity.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activity.deepLink) {
                          window.location.href = activity.deepLink;
                        }
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className={`text-xs mb-2 line-clamp-2 ${
                    activity.metadata?.isLive ? 'text-green-600 font-medium' : 'text-muted-foreground'
                  }`}>
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {activity.followable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const key = `${activity.followable!.type}:${activity.followable!.value}`;
                            const newFollowing = new Set(following);
                            if (following.has(key)) {
                              newFollowing.delete(key);
                            } else {
                              newFollowing.add(key);
                            }
                            setFollowing(newFollowing);
                          }}
                        >
                          {following.has(`${activity.followable.type}:${activity.followable.value}`) ? 
                            <Heart className="h-3 w-3 text-red-500 fill-current" /> : 
                            <HeartOff className="h-3 w-3" />
                          }
                        </Button>
                      )}
                      
                      {userPlan.plan !== 'free' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Create alert for ${activity.title}`);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Alert
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLimited && activities.length > 5 && (
            <div className="p-3 text-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                {activities.length - 5} more activities
              </p>
              <Button size="sm" variant="outline">
                Upgrade to see all
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}