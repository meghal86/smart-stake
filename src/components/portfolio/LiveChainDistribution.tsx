import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo, useState } from 'react';
import { PieDrilldownModal, type DrilldownWhaleEvent } from './PieDrilldownModal';
import { metricsService } from '@/services/MetricsService';
import { whaleSimulator } from '@/services/whaleSimulator';

interface ChainData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  tokens: Array<{
    symbol: string;
    value: number;
    source: 'real' | 'simulated';
  }>;
}

interface LiveChainDistributionProps {
  holdings?: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  totalValue: number;
}

export function LiveChainDistribution({ holdings = [], totalValue }: LiveChainDistributionProps) {
  const [selectedChain, setSelectedChain] = useState<unknown>(null);
  const [showDrilldown, setShowDrilldown] = useState(false);
  // Map tokens to their chains
  const getTokenChain = (token: string): { name: string; color: string } => {
    const chainMap: Record<string, { name: string; color: string }> = {
      'ETH': { name: 'Ethereum', color: '#627EEA' },
      'BITCOIN': { name: 'Bitcoin', color: '#F7931A' },
      'BTC': { name: 'Bitcoin', color: '#F7931A' },
      'SOLANA': { name: 'Solana', color: '#9945FF' },
      'SOL': { name: 'Solana', color: '#9945FF' },
      'CHAINLINK': { name: 'Ethereum', color: '#627EEA' },
      'POLYGON': { name: 'Polygon', color: '#8247E5' },
      'USD-COIN': { name: 'Ethereum', color: '#627EEA' },
      'USDC': { name: 'Ethereum', color: '#627EEA' }
    };
    
    return chainMap[token.toUpperCase()] || { name: 'Ethereum', color: '#627EEA' };
  };

  // Calculate chain distribution from actual holdings
  const calculateChainDistribution = (): ChainData[] => {
    const chainMap = new Map<string, ChainData>();

    holdings.forEach(holding => {
      const chain = getTokenChain(holding.token);
      
      if (!chainMap.has(chain.name)) {
        chainMap.set(chain.name, {
          name: chain.name,
          value: 0,
          percentage: 0,
          color: chain.color,
          tokens: []
        });
      }

      const chainData = chainMap.get(chain.name)!;
      chainData.value += holding.value;
      chainData.tokens.push({
        symbol: holding.token,
        value: holding.value,
        source: holding.source
      });
    });

    // Calculate percentages
    const chains = Array.from(chainMap.values());
    chains.forEach(chain => {
      chain.percentage = totalValue > 0 ? (chain.value / totalValue) * 100 : 0;
    });

    return chains.sort((a, b) => b.value - a.value);
  };

  const chainDistribution = calculateChainDistribution();

  const whaleEventsForModal = useMemo<DrilldownWhaleEvent[]>(() => {
    const events = whaleSimulator.generateWhaleEvents({
      addresses: ['0x742d35Cc6634C0532925a3b8D4C9db4C532925a3'],
      portfolioValue: totalValue,
      holdings: holdings.map(h => ({ token: h.token, value: h.value }))
    });

    return events.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      token: event.asset,
      amount: event.amountUsd,
      value: event.amountUsd,
      impact: event.impactScore >= 7 ? 'high' : event.impactScore >= 4 ? 'medium' : 'low'
    }));
  }, [holdings, totalValue]);

  const CustomTooltip = ({ active, payload }: unknown) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">${data.value.toFixed(0)} ({data.percentage.toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chain Distribution</h3>
        <Badge variant="outline" className="text-xs">
          Live Data
        </Badge>
      </div>

      {/* Pie Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chainDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={(data) => {
                setSelectedChain({
                  ...data,
                  tokens: holdings.filter(h => getTokenChain(h.token).name === data.name)
                    .map(h => ({
                      symbol: h.token,
                      qty: h.qty,
                      value: h.value,
                      source: h.source,
                      change24h: Math.random() * 10 - 5 // Mock 24h change
                    }))
                });
                setShowDrilldown(true);
                metricsService.trackDrilldownClick(data.name, 'pie_chart');
              }}
              style={{ cursor: 'pointer' }}
            >
              {chainDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value, entry: unknown) => (
                <span style={{ color: entry.color }}>
                  {value} (${entry.payload.value.toFixed(0)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        {chainDistribution.map((chain, index) => (
          <div key={chain.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: chain.color }}
                />
                <span className="font-medium">{chain.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold">${chain.value.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">
                  {chain.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <Progress 
              value={chain.percentage} 
              className="h-2"
              style={{ 
                '--progress-background': chain.color 
              } as React.CSSProperties}
            />

            {/* Token breakdown for this chain */}
            <div className="ml-5 space-y-1">
              {chain.tokens.map((token, tokenIndex) => (
                <div key={tokenIndex} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{token.symbol}</span>
                    <Badge 
                      variant={token.source === 'real' ? 'default' : 'secondary'} 
                      className="text-xs px-1 py-0"
                    >
                      {token.source === 'real' ? (
                        <><CheckCircle className="h-2 w-2 mr-1" />Real</>
                      ) : (
                        <><Zap className="h-2 w-2 mr-1" />Sim</>
                      )}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    ${token.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-center text-muted-foreground">
          Total Portfolio: ${totalValue.toFixed(0)} across {chainDistribution.length} chains
          <br />
          <span className="text-xs text-primary">Click pie slices for detailed analysis</span>
        </div>
      </div>
      
      {/* Drill-down Modal */}
      <PieDrilldownModal
        isOpen={showDrilldown}
        onClose={() => {
          setShowDrilldown(false);
          metricsService.trackFeatureUsage('modal_close', 1);
        }}
        chainSlice={selectedChain}
        whaleEvents={whaleEventsForModal}
      />
    </Card>
  );
}
