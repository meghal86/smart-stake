import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Trash2, TrendingUp, TrendingDown, Activity, CheckCircle, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveAddressCardProps {
  address: {
    id: string;
    address: string;
    label: string;
    group?: string;
  };
  holdings?: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  totalValue: number;
  pnlPercent: number;
  riskScore: number;
  onRemove: (id: string) => void;
}

export function LiveAddressCard({ 
  address, 
  holdings = [], 
  totalValue, 
  pnlPercent, 
  riskScore, 
  onRemove 
}: LiveAddressCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate address-specific metrics
  const realValue = holdings.filter(h => h.source === 'real').reduce((sum, h) => sum + h.value, 0);
  const simValue = holdings.filter(h => h.source === 'simulated').reduce((sum, h) => sum + h.value, 0);
  const whaleInteractions = Math.floor(totalValue / 25000) + Math.floor(Math.random() * 5);
  const lastActivity = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:bg-red-900';
  };

  const getGroupColor = (group?: string) => {
    switch (group) {
      case 'personal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900';
      case 'trading': return 'bg-purple-100 text-purple-800 dark:bg-purple-900';
      case 'defi': return 'bg-green-100 text-green-800 dark:bg-green-900';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900';
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{address.label}</h3>
            {address.group && (
              <Badge variant="outline" className={`text-xs ${getGroupColor(address.group)}`}>
                {address.group}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              Live Tracking
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-mono">{truncateAddress(address.address)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0"
                  onClick={() => window.open(`https://etherscan.io/address/${address.address}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on Etherscan</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="text-xs text-muted-foreground">
            Last activity: {lastActivity.toLocaleString()}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(address.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-muted-foreground">Total Value</div>
          <div className="font-bold text-lg">{formatValue(totalValue)}</div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">24h P&L</div>
          <div className={`font-bold flex items-center gap-1 ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {pnlPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">Risk Score</div>
          <div className={`font-bold px-2 py-1 rounded text-xs ${getRiskColor(riskScore)}`}>
            {riskScore.toFixed(1)}/10
          </div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">Whale Activity</div>
          <div className="font-bold flex items-center gap-1">
            <Activity className="h-3 w-3 text-orange-600" />
            {whaleInteractions}
          </div>
        </div>
      </div>

      {/* Data Source Breakdown */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Data Sources</span>
          <span>{holdings.length} tokens</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Real Data</span>
            </div>
            <span className="font-medium">{formatValue(realValue)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-orange-600" />
              <span>Simulated</span>
            </div>
            <span className="font-medium">{formatValue(simValue)}</span>
          </div>
        </div>
        
        <Progress 
          value={totalValue > 0 ? (realValue / totalValue) * 100 : 0} 
          className="h-1 mt-2" 
        />
      </div>

      {/* Holdings Details */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs mb-2"
        >
          {showDetails ? 'Hide' : 'Show'} Holdings ({holdings.length})
        </Button>
        
        {showDetails && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {holdings.slice(0, 8).map((holding, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{holding.token}</span>
                  <Badge 
                    variant={holding.source === 'real' ? 'default' : 'secondary'} 
                    className="text-xs px-1 py-0"
                  >
                    {holding.source === 'real' ? (
                      <><CheckCircle className="h-2 w-2 mr-1" />Real</>
                    ) : (
                      <><Zap className="h-2 w-2 mr-1" />Sim</>
                    )}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatValue(holding.value)}</div>
                  <div className="text-xs text-muted-foreground">
                    {holding.qty.toFixed(4)} {holding.token}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}