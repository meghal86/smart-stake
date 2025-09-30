import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  DollarSign,
  Shield,
  X,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface WhaleNotification {
  id: string;
  type: 'high_risk' | 'large_transaction' | 'unusual_activity' | 'price_impact' | 'clustering';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  whaleAddress: string;
  whaleName?: string;
  value?: number;
  isRead: boolean;
}

interface WhaleNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: WhaleNotification) => void;
}

export function WhaleNotifications({ isOpen, onClose, onNotificationClick }: WhaleNotificationsProps) {
  const [notifications, setNotifications] = useState<WhaleNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // Mock notifications - in real implementation, these would come from WebSocket or API
  useEffect(() => {
    const mockNotifications: WhaleNotification[] = [
      {
        id: '1',
        type: 'large_transaction',
        title: '🚨 Large Transaction Alert',
        message: 'Whale 0x1234...5678 moved $50M USDC to Binance',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        severity: 'critical',
        whaleAddress: '0x1234567890abcdef1234567890abcdef12345678',
        whaleName: 'Mega Whale #1',
        value: 50000000,
        isRead: false
      },
      {
        id: '2',
        type: 'high_risk',
        title: '⚠️ High Risk Activity',
        message: 'Unusual trading pattern detected in whale cluster',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        severity: 'high',
        whaleAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        isRead: false
      },
      {
        id: '3',
        type: 'unusual_activity',
        title: '📈 Unusual Activity',
        message: 'Whale showing accumulation pattern after 3 months of dormancy',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        severity: 'medium',
        whaleAddress: '0x9876543210fedcba9876543210fedcba98765432',
        whaleName: 'Dormant Whale #5',
        isRead: true
      },
      {
        id: '4',
        type: 'clustering',
        title: '🐋 Whale Clustering',
        message: '5 whales showing coordinated behavior patterns',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        severity: 'medium',
        whaleAddress: '0x1111222233334444555566667777888899990000',
        isRead: true
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high_risk': return <Shield className="w-4 h-4" />;
      case 'large_transaction': return <DollarSign className="w-4 h-4" />;
      case 'unusual_activity': return <Activity className="w-4 h-4" />;
      case 'price_impact': return <TrendingUp className="w-4 h-4" />;
      case 'clustering': return <Zap className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'critical') return notification.severity === 'critical';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Whale Alerts</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter and Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {[
                { label: 'All', value: 'all' },
                { label: 'Unread', value: 'unread' },
                { label: 'Critical', value: 'critical' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.value}
                  variant={filter === filterOption.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterOption.value as any)}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 
                   filter === 'critical' ? 'No critical alerts' : 
                   'No notifications available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 border-l-blue-500' : 'border-l-transparent'
                    }`}
                    onClick={() => {
                      onNotificationClick(notification);
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(notification.severity)}`}
                          >
                            {notification.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">
                            {notification.whaleAddress.slice(0, 8)}...{notification.whaleAddress.slice(-6)}
                          </span>
                          <span>
                            {notification.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {notification.value && (
                          <div className="mt-2 text-sm font-medium text-green-600">
                            ${(notification.value / 1e6).toFixed(1)}M
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
