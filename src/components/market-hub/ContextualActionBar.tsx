import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, TrendingUp, Plus, Share, Download, FileText } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface ContextualActionBarProps {
  entity: {
    type: 'whale' | 'cluster' | 'alert';
    id: string;
    name?: string;
    address?: string;
    severity?: string;
    [key: string]: any;
  };
  onClose: () => void;
}

export function ContextualActionBar({ entity, onClose }: ContextualActionBarProps) {
  const { userPlan } = useSubscription();
  const { isEnabled } = useFeatureFlags();
  const isPro = userPlan.plan !== 'free';
  const tradeEnabled = isEnabled('oneClickTrade');

  const handleTrade = () => {
    if (!tradeEnabled) {
      alert('Trading feature is coming soon! Enable in feature flags to test.');
      return;
    }
    // Trade/hedge logic would go here
    console.log('Trade/hedge action for:', entity);
  };

  const handleAddToWatchlist = () => {
    // Add to watchlist logic
    console.log('Add to watchlist:', entity);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/market/hub?entity=${entity.type}:${entity.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!isPro) {
      alert('Export feature is available for Pro subscribers only');
      return;
    }
    // Export logic
    console.log(`Export ${format} for:`, entity);
  };

  const getEntityDisplay = () => {
    switch (entity.type) {
      case 'whale':
        return {
          title: entity.address || entity.name || 'Whale Address',
          subtitle: `Balance: $${((entity.balanceUsd || 0) / 1000000).toFixed(1)}M`,
          badge: entity.riskScore ? `Risk: ${entity.riskScore}` : null
        };
      case 'cluster':
        return {
          title: entity.name || 'Whale Cluster',
          subtitle: `${entity.membersCount || 0} members • $${((entity.sumBalanceUsd || 0) / 1000000000).toFixed(1)}B`,
          badge: entity.type ? entity.type.replace('_', ' ') : null
        };
      case 'alert':
        return {
          title: entity.title || 'Alert',
          subtitle: `$${((entity.usdAmount || 0) / 1000000).toFixed(1)}M • ${entity.chain}`,
          badge: entity.severity
        };
      default:
        return {
          title: 'Selected Entity',
          subtitle: '',
          badge: null
        };
    }
  };

  const display = getEntityDisplay();

  return (
    <Card className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{display.title}</h3>
                {display.badge && (
                  <Badge variant="outline" className="text-xs">
                    {display.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{display.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Trade/Hedge Button */}
          <Button 
            variant="default" 
            size="sm"
            onClick={handleTrade}
            disabled={!tradeEnabled}
            className="relative"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trade/Hedge
            {!tradeEnabled && (
              <Badge className="absolute -top-2 -right-2 text-xs bg-orange-500">
                Soon
              </Badge>
            )}
          </Button>

          {/* Add to Watchlist */}
          <Button variant="outline" size="sm" onClick={handleAddToWatchlist}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Watchlist
          </Button>

          {/* Share */}
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>

          {/* Export CSV */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('csv')}
            disabled={!isPro}
            className="relative"
          >
            <FileText className="h-4 w-4 mr-2" />
            CSV
            {!isPro && (
              <Badge className="absolute -top-2 -right-2 text-xs bg-primary">
                Pro
              </Badge>
            )}
          </Button>

          {/* Export PDF */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('pdf')}
            disabled={!isPro}
            className="relative"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
            {!isPro && (
              <Badge className="absolute -top-2 -right-2 text-xs bg-primary">
                Pro
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}