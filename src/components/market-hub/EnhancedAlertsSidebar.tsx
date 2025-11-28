import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { useCSVExport } from '@/hooks/useCSVExport';
import { Eye, Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedAlertsSidebarProps {
  alerts: unknown[];
  onViewCluster: (clusterId: string) => void;
  className?: string;
  isMobile?: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
};

export function EnhancedAlertsSidebar({ 
  alerts, 
  onViewCluster, 
  className,
  isMobile = false 
}: EnhancedAlertsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const { exportData, isExporting } = useCSVExport();

  const handleExportAlert = (alert: unknown) => {
    exportData({
      exportType: 'alerts',
      filters: {
        cluster: alert.cluster,
        severity: alert.severity,
        timeWindow: '24h'
      }
    });
  };

  if (isMobile) {
    return (
      <div className={cn('fixed bottom-0 left-0 right-0 z-50', className)}>
        <Card className="rounded-t-lg rounded-b-none border-b-0">
          <CardHeader 
            className="pb-2 cursor-pointer"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <CardTitle className="flex items-center justify-between text-sm">
              Real-time Alerts ({alerts.length})
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
          
          {!isCollapsed && (
            <CardContent className="max-h-60 overflow-y-auto">
              <AlertsList 
                alerts={alerts}
                onViewCluster={onViewCluster}
                onExportAlert={handleExportAlert}
                isExporting={isExporting}
                compact
              />
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Real-time Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <AlertsList 
          alerts={alerts}
          onViewCluster={onViewCluster}
          onExportAlert={handleExportAlert}
          isExporting={isExporting}
        />
      </CardContent>
    </Card>
  );
}

function AlertsList({ 
  alerts, 
  onViewCluster, 
  onExportAlert, 
  isExporting, 
  compact = false 
}: {
  alerts: unknown[];
  onViewCluster: (clusterId: string) => void;
  onExportAlert: (alert: unknown) => void;
  isExporting: boolean;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div 
          key={index}
          className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {alert.cluster}
                </span>
              </div>
              
              <p className={cn(
                'text-sm font-medium mb-1',
                compact && 'text-xs'
              )}>
                {alert.title || `${alert.cluster} Activity Detected`}
              </p>
              
              <p className={cn(
                'text-xs text-muted-foreground',
                compact && 'text-[10px]'
              )}>
                {alert.description || `${alert.amount_usd ? `$${alert.amount_usd.toLocaleString()}` : 'Large'} transaction detected`}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <EnhancedTooltip content="View cluster details">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onViewCluster(alert.cluster_id || alert.cluster)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </EnhancedTooltip>
              
              <EnhancedTooltip content="Export filtered data">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onExportAlert(alert)}
                  disabled={isExporting}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </EnhancedTooltip>
              
              {alert.tx_hash && (
                <EnhancedTooltip content="View on explorer">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(`https://etherscan.io/tx/${alert.tx_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </EnhancedTooltip>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-sm">No alerts in the last 24h</div>
          <div className="text-xs mt-1">System monitoring for whale activity</div>
        </div>
      )}
    </div>
  );
}