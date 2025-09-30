import { useState } from 'react';
import { Mail, MessageSquare, Smartphone, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNotifications } from '@/hooks/useNotifications';

export const AlertChannels = () => {
  const { logs, loading, getDeliveryStats, getChannelStats } = useNotifications();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const deliveryStats = getDeliveryStats();
  const channelStats = getChannelStats();

  const channels = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      stats: channelStats.email
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      stats: channelStats.sms
    },
    {
      id: 'push',
      name: 'Push',
      icon: Smartphone,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      stats: channelStats.push
    }
  ];

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 95) return { variant: 'default' as const, label: 'Excellent' };
    if (rate >= 80) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Poor' };
  };

  const filteredLogs = selectedChannel 
    ? logs.filter(log => log.results.some(result => result.channel === selectedChannel))
    : logs;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Delivery Overview
          </CardTitle>
          <CardDescription>
            Monitor notification delivery performance across all channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{deliveryStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{deliveryStats.successful}</div>
              <div className="text-sm text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(deliveryStats.successRate)}`}>
                {deliveryStats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Performance</span>
              <Badge {...getStatusBadge(deliveryStats.successRate)}>
                {getStatusBadge(deliveryStats.successRate).label}
              </Badge>
            </div>
            <Progress value={deliveryStats.successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((channel) => {
          const IconComponent = channel.icon;
          const isSelected = selectedChannel === channel.id;
          
          return (
            <Card 
              key={channel.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedChannel(isSelected ? null : channel.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${channel.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${channel.color}`} />
                    </div>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                  </div>
                  {channel.stats.rate >= 95 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : channel.stats.rate < 80 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Sent: {channel.stats.total}</span>
                    <span className="text-green-600">Success: {channel.stats.successful}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivery Rate</span>
                      <span className={getStatusColor(channel.stats.rate)}>
                        {channel.stats.rate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={channel.stats.rate} className="h-2" />
                  </div>
                  
                  <Badge 
                    {...getStatusBadge(channel.stats.rate)}
                    className="w-full justify-center"
                  >
                    {getStatusBadge(channel.stats.rate).label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                {selectedChannel 
                  ? `Showing ${selectedChannel} notifications only`
                  : 'All notification channels'
                }
              </CardDescription>
            </div>
            {selectedChannel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedChannel(null)}
              >
                Show All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{log.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.message}</p>
                    <div className="flex items-center gap-2">
                      {log.results.map((result, idx) => {
                        const channel = channels.find(c => c.id === result.channel);
                        if (!channel) return null;
                        
                        const IconComponent = channel.icon;
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            <IconComponent className={`h-3 w-3 ${channel.color}`} />
                            <Badge 
                              variant={result.status === 'sent' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {result.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.sent_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};