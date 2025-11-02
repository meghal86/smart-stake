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
    group?: string;
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
    if (!value && value !== 0) return '$0';
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
      <Card className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white text-lg">{address.label}</h3>
              {address.group && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {address.group}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-400 font-mono">{formatAddress(address.address)}</p>
              <button
                onClick={() => window.open(`https://etherscan.io/address/${address.address}`, '_blank')}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
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
              <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRiskColor(address.riskScore)} cursor-help gap-1`}>
                Risk: {address.riskScore}/10
                <HelpCircle className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-48">
                Risk score based on transaction patterns, token diversity, and historical volatility. 
                Lower scores indicate higher risk.
              </p>
            </TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white hover:bg-gray-700/50">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onRemove(address.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="font-bold text-white text-lg">{formatValue(address.totalValue)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">P&L</p>
          <div className="flex items-center gap-1">
            <p className={`font-bold text-lg ${address.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {address.pnl >= 0 ? '+' : ''}{address.pnl.toFixed(1)}%
            </p>
            {address.pnl >= 0 ? 
              <TrendingUp className="h-4 w-4 text-emerald-400" /> : 
              <TrendingDown className="h-4 w-4 text-red-400" />
            }
          </div>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  Whale Interactions
                  <HelpCircle className="h-3 w-3" />
                </p>
                <p className="font-bold text-white text-lg">{address.whaleInteractions}</p>
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
          <p className="text-gray-400 text-sm">Last Activity</p>
          <p className="font-bold text-white text-lg">{Math.floor((Date.now() - new Date(address.lastActivity).getTime()) / (1000 * 60 * 60))}h ago</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <h4 className="font-semibold text-white mb-4">Holdings Breakdown</h4>
          <div className="space-y-2">
            {address.holdings.map((holding, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{holding.token}</span>
                  <span className="text-sm text-gray-400">{holding.amount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatValue(holding.value)}</p>
                  <p className={`text-sm font-medium ${holding.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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