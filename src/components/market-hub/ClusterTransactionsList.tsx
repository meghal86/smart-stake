import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export function ClusterTransactionsList({ clusterId }: { clusterId: string }) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['whale-transactions', clusterId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      if (error) throw error;
      
      // Filter transactions based on cluster type
      const allTxs = data?.transactions || [];
      const clusterType = clusterId.replace('cluster_', '').toUpperCase();
      
      let filteredTxs = [];
      
      switch (clusterType) {
        case 'DORMANT_WAKING':
          // Show largest transactions (dormant whales awakening)
          filteredTxs = allTxs.filter(tx => tx.amount_usd > 2000000).slice(0, 5);
          break;
        case 'CEX_INFLOW':
          // Show transactions to exchanges
          filteredTxs = allTxs.filter(tx => 
            tx.to?.owner && ['Binance', 'Coinbase', 'OKX', 'Kraken', 'BitGet'].includes(tx.to.owner)
          ).slice(0, 5);
          break;
        case 'DEFI_ACTIVITY':
          // Show DeFi-related transactions
          filteredTxs = allTxs.filter(tx => 
            tx.blockchain === 'ethereum' && tx.amount_usd > 1000000
          ).slice(0, 5);
          break;
        case 'DISTRIBUTION':
          // Show transactions to unknown addresses
          filteredTxs = allTxs.filter(tx => 
            tx.to?.owner === 'unknown' && tx.amount_usd > 500000
          ).slice(0, 5);
          break;
        case 'ACCUMULATION':
          // Show remaining transactions
          filteredTxs = allTxs.filter(tx => tx.amount_usd > 500000).slice(5, 10);
          break;
        default:
          filteredTxs = allTxs.slice(0, 5);
      }
      
      return filteredTxs;
    }
  });

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