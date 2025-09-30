import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ExternalLink, TrendingDown, TrendingUp, Activity, Zap, CheckCircle } from 'lucide-react';
import { TokenSourceChip } from './TokenSourceChip';

interface ChainSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
  tokens: Array<{
    symbol: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
    change24h: number;
  }>;
}

interface WhaleEvent {
  id: string;
  timestamp: Date;
  type: string;
  token: string;
  amount: number;
  value: number;
  impact: 'high' | 'medium' | 'low';
}

interface PieDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainSlice: ChainSlice | null;
  whaleEvents: WhaleEvent[];
}

export function PieDrilldownModal({ isOpen, onClose, chainSlice, whaleEvents }: PieDrilldownModalProps) {
  const [stressScenario, setStressScenario] = useState([0]);
  const [stressResult, setStressResult] = useState<{ newValue: number; impact: number } | null>(null);

  if (!chainSlice) return null;

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const runMiniStressSim = () => {
    const scenarioPercent = stressScenario[0];
    const newValue = chainSlice.value * (1 + scenarioPercent / 100);
    const impact = newValue - chainSlice.value;
    setStressResult({ newValue, impact });
  };

  const getChainExplorerUrl = (chain: string) => {
    const urls: Record<string, string> = {
      'Ethereum': 'https://etherscan.io',
      'Bitcoin': 'https://blockstream.info',
      'Solana': 'https://solscan.io',
      'Polygon': 'https://polygonscan.com'
    };
    return urls[chain] || 'https://etherscan.io';
  };

  const getTokenUrl = (token: string, chain: string) => {
    if (chain === 'Ethereum') {
      return `https://etherscan.io/token/${token}`;
    }
    return getChainExplorerUrl(chain);
  };

  const chainWhaleEvents = whaleEvents.filter(event => 
    chainSlice.tokens.some(token => token.symbol === event.token)
  ).slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: chainSlice.color }}
            />
            {chainSlice.name} Chain Analysis
            <Badge variant="outline" className="text-xs">
              {formatValue(chainSlice.value)} • {chainSlice.percentage.toFixed(1)}%
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold">Token Breakdown</h3>
            <div className="space-y-3">
              {chainSlice.tokens.map((token, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.symbol}</span>
                      <TokenSourceChip symbol={token.symbol} source={token.source} />
                      <button
                        onClick={() => window.open(getTokenUrl(token.symbol, chainSlice.name), '_blank')}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Explorer
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatValue(token.value)}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.qty.toFixed(4)} {token.symbol}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      {token.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {((token.value / chainSlice.value) * 100).toFixed(1)}% of chain
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Stress Sim + Whale Events */}
          <div className="space-y-6">
            {/* Mini Stress Simulation */}
            <div className="space-y-4">
              <h3 className="font-semibold">Mini Stress Test</h3>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Scenario Impact</label>
                      <span className={`text-sm font-medium ${stressScenario[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stressScenario[0] >= 0 ? '+' : ''}{stressScenario[0]}%
                      </span>
                    </div>
                    <Slider
                      value={stressScenario}
                      onValueChange={setStressScenario}
                      max={50}
                      min={-50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <Button onClick={runMiniStressSim} className="w-full" size="sm">
                    Run Simulation
                  </Button>
                  
                  {stressResult && (
                    <div className="p-3 bg-background rounded border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">New Value</p>
                          <p className="font-bold">{formatValue(stressResult.newValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impact</p>
                          <p className={`font-bold ${stressResult.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stressResult.impact >= 0 ? '+' : ''}{formatValue(stressResult.impact)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Whale Events */}
            <div className="space-y-4">
              <h3 className="font-semibold">Recent Whale Activity</h3>
              {chainWhaleEvents.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent whale activity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chainWhaleEvents.map(event => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.token}</span>
                          <Badge 
                            variant={event.impact === 'high' ? 'destructive' : event.impact === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.impact}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - event.timestamp.getTime()) / (1000 * 60))}m ago
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{event.type}</span>
                        <span className="font-medium">{formatValue(event.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chain Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="font-bold">{formatValue(chainSlice.value)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tokens</p>
              <p className="font-bold">{chainSlice.tokens.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Real Data</p>
              <p className="font-bold text-green-600">
                {chainSlice.tokens.filter(t => t.source === 'real').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio %</p>
              <p className="font-bold">{chainSlice.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}