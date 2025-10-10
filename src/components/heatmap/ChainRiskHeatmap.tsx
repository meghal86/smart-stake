import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedTooltip } from '@/components/tooltip/EnhancedTooltip';
import { Star, Bell, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChainData {
  chain: string;
  risk: number | null;
  components?: {
    cexInflow: number;
    netOutflow: number;
    dormantWake: number;
  };
  enriched?: boolean;
  reason?: string;
}

interface ChainRiskHeatmapProps {
  data: {
    chains: ChainData[];
    correlationSpikes?: Record<string, boolean>;
  };
  timeWindow: string;
  mobile?: boolean;
}

const CHAINS = ['BTC', 'ETH', 'SOL', 'OTHERS'];

export function ChainRiskHeatmap({ data, timeWindow, mobile }: ChainRiskHeatmapProps) {
  const [chainWatchlist, setChainWatchlist] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { track } = useAnalytics();

  // Load chain watchlist
  useEffect(() => {
    if (!user) return;
    const loadWatchlist = async () => {
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('entity_id')
        .eq('user_id', user.id)
        .eq('entity_type', 'chain');
      if (watchlistData) {
        setChainWatchlist(new Set(watchlistData.map(item => item.entity_id)));
      }
    };
    loadWatchlist();
  }, [user]);

  const toggleChainWatchlist = async (chain: string) => {
    if (!user) return;
    
    const isWatched = chainWatchlist.has(chain);
    if (isWatched) {
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_type', 'chain')
        .eq('entity_id', chain);
      setChainWatchlist(prev => {
        const next = new Set(prev);
        next.delete(chain);
        return next;
      });
    } else {
      await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          entity_type: 'chain',
          entity_id: chain,
          label: `${chain} Chain`
        });
      setChainWatchlist(prev => new Set([...prev, chain]));
    }
  };

  const getRiskData = (chain: string): ChainData => {
    return data?.chains?.find((c: ChainData) => c.chain === chain.toUpperCase()) || { 
      chain: chain.toUpperCase(), 
      risk: null, 
      components: undefined 
    };
  };

  const hasCorrelationSpike = (chain: string) => {
    return data?.correlationSpikes?.[chain] || false;
  };

  const handleBubbleClick = (chain: string, risk: number | null) => {
    track('heatmap_bubble_open', { 
      chain, 
      risk_band: risk === null ? 'no_data' : risk >= 67 ? 'high' : risk >= 34 ? 'medium' : 'low',
      timeWindow 
    });
  };

  const gridClass = "flex gap-4 justify-center";

  return (
    <div className="space-y-4">
      {/* Mini Legend - Desktop only */}
      {!mobile && (
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            0–33 Safe
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            34–66 Watch
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            67–100 High Risk
          </span>
        </div>
      )}

      <div className={gridClass}>
        {CHAINS.map((chain) => {
          const chainInfo = getRiskData(chain);
          const risk = chainInfo.risk;
          const components = chainInfo.components;
          const isCorrelated = hasCorrelationSpike(chain);

          const tooltipContent = (
            <div className="text-xs space-y-2 max-w-[220px]">
              <div className="font-medium flex items-center gap-2">
                {chain} Risk Analysis
                {chainInfo?.enriched && (
                  <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs font-mono">EA</span>
                )}
              </div>
              {risk === null ? (
                <div className="text-muted-foreground space-y-2">
                  {chain === 'OTHERS' ? (
                    <div>
                      <p>Volume-weighted aggregate of non-BTC/ETH/SOL chains</p>
                      <p className="text-xs">💡 Includes: Polygon, Avalanche, Arbitrum, and 15+ other networks</p>
                    </div>
                  ) : (
                    <div>
                      <p>Limited whale coverage in this time window</p>
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Why no data?</p>
                        <p className="text-blue-600 dark:text-blue-400">• Less than 3 whale addresses tracked</p>
                        <p className="text-blue-600 dark:text-blue-400">• No transfers above $1M threshold</p>
                        <p className="text-blue-600 dark:text-blue-400">• Enable Whale Alert for expanded coverage</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {chainInfo?.enriched && (
                    <div className="text-blue-600 text-xs mb-2">
                      Flow enhanced by Whale Alert
                    </div>
                  )}
                  {components && (
                    <div className="space-y-1">
                      {[
                        { name: 'CEX Inflow', value: components.cexInflow },
                        { name: 'Net Outflow', value: components.netOutflow },
                        { name: 'Dormant Wake', value: components.dormantWake }
                      ]
                      .sort((a, b) => b.value - a.value)
                      .map(comp => (
                        <div key={comp.name} className="flex items-center gap-2">
                          <span>{comp.name}: {comp.value}%</span>
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full" 
                              style={{ width: `${comp.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-1 mt-1">
                    <div className="font-medium">Risk Score: {risk}</div>
                    {components && (
                      <div className="text-muted-foreground">
                        {risk >= 67 ? 'High CEX inflows + dormant activity' :
                         risk >= 34 ? 'Moderate whale activity detected' :
                         'Normal whale flow patterns'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );

          return (
            <EnhancedTooltip key={chain} content={tooltipContent} mobile={mobile}>
              <div 
                className={cn(
                  'flex flex-col items-center gap-2 cursor-pointer group p-3 rounded-lg hover:bg-muted/50 transition-all duration-200',
                  isCorrelated && 'ring-2 ring-indigo-400 animate-pulse'
                )}
                onClick={() => handleBubbleClick(chain, risk)}
                role="button"
                tabIndex={0}
                aria-label={`${chain} chain risk: ${risk === null ? 'No data' : risk}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBubbleClick(chain, risk);
                  }
                }}
              >
                {/* Round Risk Bubble */}
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg',
                  risk === null ? 'bg-gray-400' :
                  risk >= 67 ? 'bg-red-500' :
                  risk >= 34 ? 'bg-yellow-500' : 'bg-green-500'
                )}>
                  {risk === null ? '--' : risk}
                </div>
                
                {/* Chain Label */}
                <div className="text-center">
                  <h4 className="font-semibold text-sm">{chain}</h4>
                  <p className="text-xs text-muted-foreground">
                    {risk === null ? 'No data' : 
                     risk >= 67 ? 'High Risk' :
                     risk >= 34 ? 'Watch' : 'Safe'
                    }
                  </p>
                  {isCorrelated && (
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full mt-1 inline-block">
                      Correlated
                    </span>
                  )}
                </div>
              </div>
            </EnhancedTooltip>
          );
        })}
      </div>
    </div>
  );
}