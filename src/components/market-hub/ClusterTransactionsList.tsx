import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export function ClusterTransactionsList({ clusterId }: { clusterId: string }) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['whale-transactions', clusterId],
    queryFn: async () => {
      const clusterType = clusterId.replace('cluster_', '').toUpperCase();
      
      // Try to get real whale alert data first
      try {
        const { data: whaleAlertData } = await supabase
          .from('whale_alert_events')
          .select('*')
          .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('detected_at', { ascending: false })
          .limit(20);
        
        if (whaleAlertData && whaleAlertData.length > 0) {
          return filterTransactionsByCluster(whaleAlertData, clusterType);
        }
      } catch (error) {
        console.log('No whale alert data available');
      }
      
      // Fallback to alerts table
      try {
        const { data: alertsData } = await supabase
          .from('alerts')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (alertsData && alertsData.length > 0) {
          return convertAlertsToTransactions(alertsData, clusterType);
        }
      } catch (error) {
        console.log('No alerts data available');
      }
      
      return [];
    }
  });
  
  function filterTransactionsByCluster(whaleAlertData: any[], clusterType: string) {
    let filtered = [];
    
    switch (clusterType) {
      case 'DORMANT_WAKING':
        filtered = whaleAlertData.filter(tx => tx.amount_usd > 2000000).slice(0, 5);
        break;
      case 'CEX_INFLOW':
        filtered = whaleAlertData.filter(tx => {
          const toEntity = tx.labels?.to_entity?.toLowerCase() || '';
          return ['binance', 'coinbase', 'okx', 'kraken', 'bitget'].some(ex => toEntity.includes(ex));
        }).slice(0, 5);
        break;
      case 'DEFI_ACTIVITY':
        filtered = whaleAlertData.filter(tx => 
          tx.chain === 'ETH' && tx.amount_usd > 1000000
        ).slice(0, 5);
        break;
      case 'DISTRIBUTION':
        filtered = whaleAlertData.filter(tx => 
          (!tx.labels?.to_entity || tx.labels.to_entity === 'unknown') && tx.amount_usd > 500000
        ).slice(0, 5);
        break;
      case 'ACCUMULATION':
        filtered = whaleAlertData.filter(tx => tx.amount_usd > 500000).slice(0, 5);
        break;
      default:
        filtered = whaleAlertData.slice(0, 5);
    }
    
    return filtered.map(tx => ({
      hash: tx.tx_hash,
      amount_usd: tx.amount_usd,
      symbol: tx.symbol,
      blockchain: tx.chain?.toLowerCase(),
      timestamp: tx.detected_at,
      from: {
        address: tx.from_addr,
        owner: tx.labels?.from_entity || 'unknown'
      },
      to: {
        address: tx.to_addr,
        owner: tx.labels?.to_entity || 'unknown'
      }
    }));
  }
  
  function convertAlertsToTransactions(alertsData: any[], clusterType: string) {
    return alertsData.slice(0, 5).map(alert => ({
      hash: alert.id,
      amount_usd: alert.amount_usd,
      symbol: alert.token || 'UNKNOWN',
      blockchain: alert.chain?.toLowerCase() || 'ethereum',
      timestamp: alert.created_at,
      from: {
        address: alert.from_addr,
        owner: 'unknown'
      },
      to: {
        address: alert.to_addr,
        owner: 'unknown'
      }
    }));
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {transactions.map((tx: any, i: number) => {
        const isOutflow = tx.to?.owner !== 'unknown' && ['Binance', 'Coinbase', 'OKX', 'Kraken', 'BitGet'].includes(tx.to?.owner);
        const direction = isOutflow ? 'OUT' : 'IN';
        const directionColor = isOutflow ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200';
        
        return (
          <div key={i} className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs px-2 py-1 font-medium ${directionColor}`}>
                  {direction}
                </Badge>
                <div className="font-mono text-xs">
                  {tx.from?.address?.slice(0, 6)}...{tx.from?.address?.slice(-4)}
                </div>
              </div>
              <div className="text-xs font-semibold text-green-600">
                ${tx.amount_usd?.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{tx.symbol?.toUpperCase()} on {tx.blockchain}</span>
              <span className="flex items-center gap-1">
                <span className={tx.from?.owner !== 'unknown' ? 'text-blue-600' : ''}>
                  {tx.from?.owner || 'Unlabeled'}
                </span>
                <span className="mx-1">→</span>
                <span className={tx.to?.owner !== 'unknown' ? 'text-blue-600 font-medium' : ''}>
                  {tx.to?.owner || 'Unlabeled'}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Hash: {tx.hash?.slice(0, 16)}...</span>
              <span>{new Date(tx.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}