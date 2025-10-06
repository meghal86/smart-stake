import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Activity, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface MobileProvenancePanelProps {
  etherscanStatus: {
    status: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    latency: number;
  };
  coingeckoStatus: {
    status: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    cacheAge: number;
  };
  simVersion: string;
  totalHoldings: number;
  realHoldings: number;
  isSticky?: boolean;
}

export function MobileProvenancePanel({ 
  etherscanStatus, 
  coingeckoStatus, 
  simVersion, 
  totalHoldings,
  realHoldings,
  isSticky = false
}: MobileProvenancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-meta';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return Activity;
      case 'down': return Activity;
      default: return Activity;
    }
  };

  return (
    <Card className={`${isSticky ? 'sticky top-4 z-10' : ''} mx-4 mb-4`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full p-4 h-auto justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Data Sources</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(etherscanStatus.status)} bg-current`} />
                <div className={`w-2 h-2 rounded-full ${getStatusColor(coingeckoStatus.status)} bg-current`} />
                <div className="w-2 h-2 rounded-full text-orange-600 bg-current" />
              </div>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Compact Status Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {(() => {
                  const IconComponent = getStatusIcon(etherscanStatus.status);
                  return <IconComponent className={`h-3 w-3 ${getStatusColor(etherscanStatus.status)}`} />;
                })()}
                <span className="font-medium">Real</span>
              </div>
              <div className="flex items-center gap-1">
                {(() => {
                  const IconComponent = getStatusIcon(coingeckoStatus.status);
                  return <IconComponent className={`h-3 w-3 ${getStatusColor(coingeckoStatus.status)}`} />;
                })()}
                <span className="font-medium">Live</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-orange-600" />
                <span className="font-medium">Sim v{simVersion}</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-green-600">{realHoldings}</span> real • 
                <span className="font-medium text-orange-600"> {totalHoldings - realHoldings}</span> simulated
              </div>
              <Badge variant="outline" className="text-xs">
                100% Live Prices
              </Badge>
            </div>

            {/* Connect Wallet CTA */}
            <div className="pt-2 border-t">
              <button className="text-xs text-primary hover:underline font-medium w-full text-center">
                Connect wallet for real token balances →
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}