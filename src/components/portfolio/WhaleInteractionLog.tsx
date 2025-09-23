import { Activity, ExternalLink, Filter, Clock, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WhaleInteraction {
  id: string;
  timestamp: Date;
  type: 'CEX_INFLOW' | 'CEX_OUTFLOW' | 'DEX_SWAP' | 'STABLECOIN_MINT' | 'LARGE_TRANSFER' | 'STAKING';
  token: string;
  amount: number;
  value: number;
  whaleAddress: string;
  impact: 'high' | 'medium' | 'low';
  portfolioEffect: number; // percentage impact on portfolio
  description: string;
  txHash?: string;
}

interface WhaleInteractionLogProps {
  interactions: WhaleInteraction[];
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

const INTERACTION_TYPES = {
  CEX_INFLOW: { label: 'CEX Inflow', color: 'bg-red-500/10 text-red-700', icon: TrendingDown },
  CEX_OUTFLOW: { label: 'CEX Outflow', color: 'bg-green-500/10 text-green-700', icon: TrendingUp },
  DEX_SWAP: { label: 'DEX Swap', color: 'bg-blue-500/10 text-blue-700', icon: Activity },
  STABLECOIN_MINT: { label: 'Stablecoin Mint', color: 'bg-purple-500/10 text-purple-700', icon: Activity },
  LARGE_TRANSFER: { label: 'Large Transfer', color: 'bg-orange-500/10 text-orange-700', icon: Activity },
  STAKING: { label: 'Staking', color: 'bg-teal-500/10 text-teal-700', icon: Activity }
};

export function WhaleInteractionLog({ 
  interactions, 
  onFilterChange, 
  currentFilter 
}: WhaleInteractionLogProps) {
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Whale Interaction Log</h3>
          <Badge variant="outline">{interactions.length} events</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={currentFilter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="high">High Impact</SelectItem>
              <SelectItem value="CEX_INFLOW">CEX Inflows</SelectItem>
              <SelectItem value="CEX_OUTFLOW">CEX Outflows</SelectItem>
              <SelectItem value="DEX_SWAP">DEX Swaps</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interaction List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {interactions.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">No Whale Interactions</h4>
            <p className="text-muted-foreground">
              No recent whale activity affecting your portfolio tokens
            </p>
          </div>
        ) : (
          interactions.map((interaction) => {
            const typeConfig = INTERACTION_TYPES[interaction.type];
            const IconComponent = typeConfig.icon;
            
            return (
              <div key={interaction.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{interaction.token}</span>
                        <Badge variant={getImpactColor(interaction.impact) as any} className="text-xs">
                          {interaction.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {interaction.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          {formatAmount(interaction.amount)} {interaction.token}
                        </span>
                        <span className="text-muted-foreground">
                          {formatValue(interaction.value)}
                        </span>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-muted-foreground hover:text-foreground cursor-help">
                              {truncateAddress(interaction.whaleAddress)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Whale Address: {interaction.whaleAddress}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeAgo(interaction.timestamp)}</span>
                    </div>
                    
                    {interaction.portfolioEffect !== 0 && (
                      <div className={`text-sm font-medium ${
                        interaction.portfolioEffect > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {interaction.portfolioEffect > 0 ? '+' : ''}{interaction.portfolioEffect.toFixed(2)}%
                      </div>
                    )}
                    
                    {interaction.txHash && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {interactions.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">High Impact</p>
              <p className="text-lg font-bold text-red-600">
                {interactions.filter(i => i.impact === 'high').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CEX Flows</p>
              <p className="text-lg font-bold">
                {interactions.filter(i => i.type.includes('CEX')).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold">
                {formatValue(interactions.reduce((sum, i) => sum + i.value, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Impact</p>
              <p className={`text-lg font-bold ${
                interactions.reduce((sum, i) => sum + i.portfolioEffect, 0) / interactions.length > 0 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {(interactions.reduce((sum, i) => sum + i.portfolioEffect, 0) / interactions.length).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}