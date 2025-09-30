import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhaleClusters } from '@/hooks/useMarketIntelligence';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export function WhaleClusteringDebug() {
  const [chain, setChain] = useState<string>('ETH');
  const { data: clusters, isLoading, error, refetch } = useWhaleClusters(chain);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (clusters && clusters.length > 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Loading clusters...';
    if (error) return `Error: ${error.message}`;
    if (clusters && clusters.length > 0) return `${clusters.length} clusters found`;
    return 'No clusters detected';
  };

  return (
    <Card className="p-4 mb-4 border-dashed">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Whale Clustering Debug</h3>
          {getStatusIcon()}
          <span className="text-sm text-muted-foreground">{getStatusText()}</span>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={chain} 
            onChange={(e) => setChain(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="ETH">Ethereum</option>
            <option value="SOL">Solana</option>
            <option value="BTC">Bitcoin</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error.message}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Check that the whale-clusters Edge Function is deployed and the database tables exist.
          </p>
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detected Clusters:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {clusters.map((cluster) => (
              <div key={cluster.id} className="border rounded p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {cluster.type}
                  </Badge>
                  <span className="text-muted-foreground">
                    Risk: {cluster.riskScore}
                  </span>
                </div>
                <p className="font-medium">{cluster.name}</p>
                <p className="text-muted-foreground">
                  {cluster.membersCount} members • ${(cluster.sumBalanceUsd / 1000000).toFixed(1)}M
                </p>
                {cluster.confidence && (
                  <p className="text-muted-foreground">
                    Confidence: {(cluster.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {clusters && clusters.length === 0 && !isLoading && !error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-700">
            <strong>No clusters found.</strong> This could mean:
          </p>
          <ul className="text-xs text-yellow-600 mt-1 ml-4 list-disc">
            <li>No whale transaction data in the database</li>
            <li>Transactions don't meet the classification thresholds</li>
            <li>Database tables need sample data</li>
          </ul>
        </div>
      )}
    </Card>
  );
}