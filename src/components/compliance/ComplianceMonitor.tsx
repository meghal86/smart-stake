import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ComplianceUpdate {
  id: string;
  type: 'sanctions' | 'aml' | 'api' | 'regulation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: Date;
  source: string;
  actionRequired: boolean;
  url?: string;
}

export function ComplianceMonitor() {
  const [updates, setUpdates] = useState<ComplianceUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock compliance updates - replace with real monitoring
    const mockUpdates: ComplianceUpdate[] = [
      {
        id: '1',
        type: 'sanctions',
        title: 'OFAC SDN List Updated',
        description: '15 new entities added to sanctions list',
        severity: 'high',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2),
        source: 'US Treasury OFAC',
        actionRequired: true,
        url: 'https://home.treasury.gov/policy-issues/financial-sanctions'
      },
      {
        id: '2',
        type: 'api',
        title: 'Chainalysis API Rate Limit Change',
        description: 'Rate limits reduced from 10k to 5k requests per 5 minutes',
        severity: 'medium',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        source: 'Chainalysis',
        actionRequired: false,
        url: 'https://docs.chainalysis.com'
      },
      {
        id: '3',
        type: 'regulation',
        title: 'EU MiCA Regulation Update',
        description: 'New compliance requirements for crypto service providers',
        severity: 'high',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48),
        source: 'European Securities and Markets Authority',
        actionRequired: true,
        url: 'https://www.esma.europa.eu'
      },
      {
        id: '4',
        type: 'aml',
        title: 'FATF Travel Rule Update',
        description: 'Threshold lowered to $1000 for virtual asset transfers',
        severity: 'critical',
        date: new Date(Date.now() - 1000 * 60 * 60 * 72),
        source: 'Financial Action Task Force',
        actionRequired: true,
        url: 'https://www.fatf-gafi.org'
      }
    ];

    setUpdates(mockUpdates);
    setLoading(false);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-meta bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sanctions': return Shield;
      case 'aml': return CheckCircle;
      case 'api': return AlertTriangle;
      case 'regulation': return Clock;
      default: return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Compliance Monitor</h3>
          <Badge variant="outline" className="text-xs">
            {updates.filter(u => u.actionRequired).length} require action
          </Badge>
        </div>
        
        <Button size="sm" variant="outline">
          View All Updates
        </Button>
      </div>

      <div className="space-y-4">
        {updates.map((update) => {
          const TypeIcon = getTypeIcon(update.type);
          
          return (
            <div
              key={update.id}
              className={`p-4 rounded-lg border ${getSeverityColor(update.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <TypeIcon className="h-5 w-5 mt-0.5" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{update.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {update.type.toUpperCase()}
                      </Badge>
                      {update.actionRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Action Required
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{update.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span>{update.source}</span>
                      <span>{update.date.toLocaleDateString()}</span>
                      {update.url && (
                        <a 
                          href={update.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {updates.filter(u => u.severity === 'critical').length}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {updates.filter(u => u.severity === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {updates.filter(u => u.severity === 'medium').length}
            </div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {updates.filter(u => u.severity === 'low').length}
            </div>
            <div className="text-xs text-muted-foreground">Low</div>
          </div>
        </div>
      </div>
    </Card>
  );
}