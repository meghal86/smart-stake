import { Bell, X, Check, AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts';

interface RealTimeAlertsProps {
  walletAddress?: string;
}

export function RealTimeAlerts({ walletAddress }: RealTimeAlertsProps) {
  const { 
    alerts, 
    acknowledgeAlert, 
    clearAlert, 
    clearAllAlerts,
    unacknowledgedCount 
  } = useRealTimeAlerts(walletAddress);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'large_transaction': return TrendingUp;
      case 'risk_threshold': return AlertTriangle;
      case 'sanctions_match': return Shield;
      case 'defi_health': return Activity;
      default: return Bell;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-medium text-muted-foreground">No Active Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring is active. Alerts will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h3 className="font-medium">Real-Time Alerts</h3>
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unacknowledgedCount} new
            </Badge>
          )}
        </div>
        
        {alerts.length > 0 && (
          <Button size="sm" variant="outline" onClick={clearAllAlerts}>
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2">
          {alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertIcon className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearAlert(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Alert Statistics */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium">{alerts.length}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="font-medium text-red-600">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
            <div className="text-muted-foreground">Critical</div>
          </div>
          <div>
            <div className="font-medium text-green-600">
              {alerts.filter(a => a.acknowledged).length}
            </div>
            <div className="text-muted-foreground">Resolved</div>
          </div>
        </div>
      </div>
    </Card>
  );
}