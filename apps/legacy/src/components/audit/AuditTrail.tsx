import { useState, useEffect } from 'react';
import { Clock, User, FileText, Shield, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export function AuditTrail() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock audit events - replace with real API
    const mockEvents: AuditEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        userId: 'user-123',
        userEmail: 'analyst@company.com',
        action: 'WATCHLIST_ADD',
        resource: 'wallet:0x742d35...925a3',
        details: { label: 'Whale #1', tags: ['high-value', 'defi'] },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        userId: 'user-456',
        userEmail: 'compliance@company.com',
        action: 'ALERT_RULE_CREATE',
        resource: 'alert:risk-threshold',
        details: { threshold: 7, notifications: ['email', 'slack'] },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        userId: 'user-123',
        userEmail: 'analyst@company.com',
        action: 'WALLET_SCAN',
        resource: 'wallet:0x1da582...2f2b5a',
        details: { riskScore: 8, sanctioned: true },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      }
    ];

    setAuditEvents(mockEvents);
    setLoading(false);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'WATCHLIST_ADD':
      case 'WATCHLIST_REMOVE':
        return Eye;
      case 'ALERT_RULE_CREATE':
      case 'ALERT_RULE_UPDATE':
        return Shield;
      case 'WALLET_SCAN':
        return FileText;
      default:
        return User;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-600';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-600';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'text-yellow-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Audit Trail</h3>
        <Badge variant="outline" className="text-xs">
          {auditEvents.length} events
        </Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {auditEvents.map((event) => {
            const ActionIcon = getActionIcon(event.action);
            
            return (
              <div key={event.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-muted rounded-full">
                    <ActionIcon className={`h-4 w-4 ${getActionColor(event.action)}`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {event.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">{event.userEmail}</span> performed action on{' '}
                    <span className="font-mono text-xs">{event.resource}</span>
                  </div>
                  
                  {Object.keys(event.details).length > 0 && (
                    <div className="text-xs bg-muted/50 p-2 rounded mt-2">
                      <strong>Details:</strong>{' '}
                      {JSON.stringify(event.details, null, 2)}
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                    <span>IP: {event.ipAddress}</span>
                    <span>ID: {event.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Export Options */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex gap-2">
          <button className="text-sm text-primary hover:underline">
            Export CSV
          </button>
          <span className="text-muted-foreground">•</span>
          <button className="text-sm text-primary hover:underline">
            Export JSON
          </button>
          <span className="text-muted-foreground">•</span>
          <button className="text-sm text-primary hover:underline">
            Compliance Report
          </button>
        </div>
      </div>
    </Card>
  );
}