import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Eye, Plus, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DigestItem {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  clusterId?: string;
  description: string;
  timestamp: string;
}

interface AlertsDigestProps {
  items: DigestItem[];
  onViewCluster?: (clusterId: string) => void;
  onCreateRule?: (item: DigestItem) => void;
  mobile?: boolean;
}

export function AlertsDigest({ items, onViewCluster, onCreateRule, mobile }: AlertsDigestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { track } = useAnalytics();

  const highPriorityItems = items.filter(item => item.severity === 'High');
  const hasHighPriority = highPriorityItems.length > 0;

  const handleViewClick = (item: DigestItem) => {
    if (item.clusterId && onViewCluster) {
      onViewCluster(item.clusterId);
      track('digest_click_view_transactions', { 
        itemId: item.id, 
        clusterId: item.clusterId 
      });
      
      // Announce to screen readers
      const announcement = `Opened ${item.title} details.`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      setTimeout(() => document.body.removeChild(liveRegion), 1000);
    }
  };

  const handleRuleClick = (item: DigestItem) => {
    if (onCreateRule) {
      onCreateRule(item);
      track('digest_click_create_rule', { 
        itemId: item.id, 
        severity: item.severity 
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Medium': return <TrendingUp className="w-4 w-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (mobile) {
    return (
      <>
        {/* Floating Action Button */}
        <button 
          className={cn(
            'fixed bottom-6 right-6 z-30 wh-touch-target',
            'bg-primary text-primary-foreground rounded-full shadow-lg',
            'flex items-center gap-2 px-4 py-3 font-medium text-sm',
            'hover:shadow-xl transition-all duration-200',
            hasHighPriority && 'bg-red-600 animate-pulse'
          )}
          onClick={() => setIsOpen(true)}
          aria-label={`Open AI digest with ${items.length} items`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{items.length}</span>
          {hasHighPriority && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </button>

        {/* Bottom Sheet */}
        <BottomSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          title="AI Digest"
          defaultHeight={hasHighPriority ? 50 : 30}
        >
          <DigestContent 
            items={items}
            onViewClick={handleViewClick}
            onRuleClick={handleRuleClick}
          />
        </BottomSheet>
      </>
    );
  }

  // Desktop version - right rail
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Digest</h3>
        <Badge variant="outline">
          {items.length} items
        </Badge>
      </div>
      <DigestContent 
        items={items}
        onViewClick={handleViewClick}
        onRuleClick={handleRuleClick}
      />
    </div>
  );
}

function DigestContent({ 
  items, 
  onViewClick, 
  onRuleClick 
}: {
  items: DigestItem[];
  onViewClick: (item: DigestItem) => void;
  onRuleClick: (item: DigestItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No alerts in current window</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={item.severity === 'High' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {item.clusterId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => onViewClick(item)}
                    title="View related cluster details"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => onRuleClick(item)}
                  title="Create alert rule from this pattern"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Rule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}