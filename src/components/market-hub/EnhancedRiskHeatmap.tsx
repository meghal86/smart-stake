import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { Sparkline } from '@/components/ui/sparkline';
import { cn } from '@/lib/utils';

interface EnhancedRiskHeatmapProps {
  timeWindow: string;
  className?: string;
}

export function EnhancedRiskHeatmap({ timeWindow, className }: EnhancedRiskHeatmapProps) {
  // Get correlation data for highlighting
  const { data: correlations } = useQuery({
    queryKey: ['correlations-enhanced', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('correlation-enhanced', {
        body: { window: timeWindow }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Get chain risk with historical data
  const { data: chainData } = useQuery({
    queryKey: ['chain-risk-history', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-chain-risk-quant', {
        body: { window: timeWindow, include_history: true }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  const chains = chainData?.chains || [];
  const correlatedChains = new Set(correlations?.correlatedChains || []);

  const getRiskColor = (risk: number | null) => {
    if (risk === null) return 'bg-gray-100 dark:bg-gray-800';
    if (risk <= 33) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (risk <= 66) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  };

  const getSparklineColor = (risk: number | null) => {
    if (risk === null) return '#6b7280';
    if (risk <= 33) return '#10b981';
    if (risk <= 66) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Chain Risk Heatmap
          <EnhancedTooltip
            content={
              <div className="space-y-2 max-w-xs">
                <div className="font-medium">Risk Components:</div>
                <div className="text-xs space-y-1">
                  <div>• Concentration: Whale count distribution</div>
                  <div>• Flow: Net inflow/outflow patterns</div>
                  <div>• Activity: Transaction frequency</div>
                </div>
                <div className="text-xs text-meta mt-2">
                  Glowing borders indicate correlated spike activity
                </div>
              </div>
            }
          >
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs cursor-help">
              ?
            </div>
          </EnhancedTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {chains.map((chain: any) => (
            <EnhancedTooltip
              key={chain.chain}
              content={
                <div className="space-y-2 min-w-[200px]">
                  <div className="font-medium">{chain.chain} Risk Breakdown</div>
                  {chain.components ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Concentration:</span>
                        <span>{chain.components.cexInflow}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flow Risk:</span>
                        <span>{chain.components.netOutflow}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Activity:</span>
                        <span>{chain.components.dormantWake}%</span>
                      </div>
                      <div className="border-t pt-1 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total Risk:</span>
                          <span>{chain.risk}/100</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-meta">
                      {chain.reason === 'insufficient_data' ? 'Insufficient whale data' : 'Low activity'}
                    </div>
                  )}
                </div>
              }
              position="bottom-full"
            >
              <div
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-300 cursor-help',
                  getRiskColor(chain.risk),
                  correlatedChains.has(chain.chain) && 'ring-2 ring-blue-400 ring-opacity-60 shadow-lg shadow-blue-400/25'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{chain.chain}</span>
                  {correlatedChains.has(chain.chain) && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="text-2xl font-bold mb-2">
                  {chain.risk !== null ? chain.risk : '--'}
                </div>
                
                {chain.risk !== null && (
                  <Badge variant="outline" className="text-xs mb-2">
                    {chain.risk <= 33 ? 'Safe' : chain.risk <= 66 ? 'Watch' : 'High Risk'}
                  </Badge>
                )}
                
                {/* 7-day Sparkline */}
                <div className="mt-2">
                  <Sparkline
                    data={chain.history || []}
                    width={60}
                    height={16}
                    color={getSparklineColor(chain.risk)}
                    className="opacity-70"
                  />
                  <div className="text-xs text-label mt-1">7d trend</div>
                </div>
              </div>
            </EnhancedTooltip>
          ))}
        </div>
        
        {correlations?.spikeCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              🔗 {correlations.spikeCount} correlated spike{correlations.spikeCount > 1 ? 's' : ''} detected in the last 24h
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}