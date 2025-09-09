import { useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Trash2, ChevronDown, ChevronUp, HelpCircle, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddressCardProps {
  address: {
    id: string;
    address: string;
    label: string;
    totalValue: number;
    pnl: number;
    riskScore: number;
    whaleInteractions: number;
    lastActivity: Date;
    holdings: Array<{
      token: string;
      amount: number;
      value: number;
      change24h: number;
    }>;
  };
  onRemove: (id: string) => void;
}

export function AddressCard({ address, onRemove }: AddressCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-green-500 bg-green-500/20';
    if (score >= 4) return 'text-yellow-500 bg-yellow-500/20';
    return 'text-red-500 bg-red-500/20';
  };

  return (
    <TooltipProvider>
      <Card className="p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{address.label}</h3>
              {address.group && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {address.group}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground font-mono">{formatAddress(address.address)}</p>
              <button
                onClick={() => window.open(`https://etherscan.io/address/${address.address}`, '_blank')}
                className="text-xs text-[#14B8A6] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Explorer
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${getRiskColor(address.riskScore)} cursor-help flex items-center gap-1`}>
                Risk: {address.riskScore}/10
                <HelpCircle className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-48">
                Risk score based on transaction patterns, token diversity, and historical volatility. 
                Lower scores indicate higher risk.
              </p>
            </TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onRemove(address.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total Value</p>
          <p className="font-medium">{formatValue(address.totalValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">P&L</p>
          <div className="flex items-center gap-1">
            <p className={`font-medium ${address.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {address.pnl >= 0 ? '+' : ''}{address.pnl.toFixed(1)}%
            </p>
            {address.pnl >= 0 ? 
              <TrendingUp className="h-3 w-3 text-green-500" /> : 
              <TrendingDown className="h-3 w-3 text-red-500" />
            }
          </div>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <p className="text-muted-foreground flex items-center gap-1">
                  Whale Interactions
                  <HelpCircle className="h-3 w-3" />
                </p>
                <p className="font-medium">{address.whaleInteractions}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-48">
                Number of transactions with addresses holding &gt;$1M in assets. 
                Higher counts may indicate institutional activity.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <p className="text-muted-foreground">Last Activity</p>
          <p className="font-medium">{Math.floor((Date.now() - new Date(address.lastActivity).getTime()) / (1000 * 60 * 60))}h ago</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-3">Holdings Breakdown</h4>
          <div className="space-y-2">
            {address.holdings.map((holding, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{holding.token}</span>
                  <span className="text-sm text-muted-foreground">{holding.amount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatValue(holding.value)}</p>
                  <p className={`text-xs ${holding.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
    </TooltipProvider>
  );
}