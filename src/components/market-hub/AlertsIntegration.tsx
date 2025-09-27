import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  ExternalLink,
  Fish,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Eye,
  X
} from 'lucide-react';
import { formatUSD } from '@/lib/market/compute';

interface Alert {
  id: string;
  clusterId?: string;
  clusterName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  amountUSD?: number;
  token?: string;
  chain?: string;
  address?: string;
  txHash?: string;
  impact?: string;
  read?: boolean;
}

interface AlertsIntegrationProps {
  alerts: Alert[];
  clusters: any[];
  onAlertClick?: (alert: Alert) => void;
  onClusterClick?: (clusterId: string) => void;
  compact?: boolean;
}

export function AlertsIntegration({ 
  alerts = [], 
  clusters = [],
  onAlertClick,
  onClusterClick,
  compact = false
}: AlertsIntegrationProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  // Enhanced mock alerts with cluster connections
  const mockAlerts: Alert[] = [
    {
      id: 'alert_1',
      clusterId: 'dormant_awakening_btc',
      clusterName: 'Dormant BTC Whales',
      severity: 'critical',
      title: 'Large Dormant Whale Activation',
      description: 'Whale moved 2,340 BTC after 3 years of inactivity',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      amountUSD: 104100000,
      token: 'BTC',
      chain: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      txHash: '0x123...abc',
      impact: 'High price impact expected',
      read: false
    },
    {
      id: 'alert_2',
      clusterId: 'cex_whale_outflow',
      clusterName: 'CEX Whale Outflows',
      severity: 'high',
      title: 'Major Exchange Outflow',
      description: 'Large withdrawal from Binance hot wallet',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      amountUSD: 28900000,
      token: 'ETH',
      chain: 'Ethereum',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96',
      txHash: '0x456...def',
      impact: 'Supply shock potential',
      read: false
    },
    {
      id: 'alert_3',
      clusterId: 'smart_money_accumulation',
      clusterName: 'Smart Money',
      severity: 'medium',
      title: 'Smart Money Accumulation',
      description: 'Known whale accumulated 1,200 ETH',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      amountUSD: 4200000,
      token: 'ETH',
      chain: 'Ethereum',
      address: '0x8ba1f109551bD432803012645Hac136c',
      txHash: '0x789...ghi',
      impact: 'Bullish accumulation signal',
      read: true
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : mockAlerts;

  const filteredAlerts = displayAlerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'high') return alert.severity === 'high' || alert.severity === 'critical';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Bell className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return alertTime.toLocaleDateString();
  };

  if (compact) {
    return <CompactAlertsView alerts={filteredAlerts} onAlertClick={onAlertClick} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Whale Alerts
            {filteredAlerts.filter(a => !a.read).length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {filteredAlerts.filter(a => !a.read).length} new
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high')}
            >
              High
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No alerts match your filter</p>
            <p className="text-sm">Try adjusting your filter settings</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <div key={alert.id}>
              <AlertCard 
                alert={alert}
                onAlertClick={onAlertClick}
                onClusterClick={onClusterClick}
              />
              {index < filteredAlerts.length - 1 && <Separator className="my-3" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: Alert;
  onAlertClick?: (alert: Alert) => void;
  onClusterClick?: (clusterId: string) => void;
}

function AlertCard({ alert, onAlertClick, onClusterClick }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Bell className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return alertTime.toLocaleDateString();
  };

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
        !alert.read ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
      }`}
      onClick={() => onAlertClick?.(alert)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                {!alert.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={getSeverityColor(alert.severity)}>
              {alert.severity}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeAgo(alert.timestamp)}
            </span>
          </div>
        </div>

        {/* Cluster Connection */}
        {alert.clusterId && alert.clusterName && (
          <div className="flex items-center gap-2">
            <Fish className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">From cluster:</span>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onClusterClick?.(alert.clusterId!);
              }}
            >
              {alert.clusterName}
            </Button>
          </div>
        )}

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <div className="font-semibold">
              {alert.amountUSD ? formatUSD(alert.amountUSD) : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Token:</span>
            <div className="font-semibold">{alert.token || 'N/A'}</div>
          </div>
        </div>

        {/* Impact */}
        {alert.impact && (
          <div className="bg-muted/30 rounded p-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-medium">Impact:</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{alert.impact}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-6">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            {alert.txHash && (
              <Button size="sm" variant="outline" className="text-xs h-6">
                <ExternalLink className="w-3 h-3 mr-1" />
                Explorer
              </Button>
            )}
          </div>
          
          {alert.address && (
            <span className="text-xs font-mono text-muted-foreground">
              {alert.address.slice(0, 6)}...{alert.address.slice(-4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactAlertsView({ 
  alerts, 
  onAlertClick 
}: { 
  alerts: Alert[]; 
  onAlertClick?: (alert: Alert) => void; 
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Recent Alerts
        {alerts.filter(a => !a.read).length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {alerts.filter(a => !a.read).length}
          </Badge>
        )}
      </h3>
      
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className={`p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors ${
              !alert.read ? 'bg-blue-50/50 border-blue-200' : ''
            }`}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium truncate">{alert.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(alert.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            {alert.amountUSD && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatUSD(alert.amountUSD)} • {alert.token}
              </div>
            )}
          </div>
        ))}
        
        {alerts.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View {alerts.length - 3} more alerts
          </Button>
        )}
      </div>
    </div>
  );
}