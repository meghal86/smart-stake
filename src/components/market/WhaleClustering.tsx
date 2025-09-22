import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, ArrowUpDown, Zap, Users } from 'lucide-react';

interface WhaleTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amountUSD: number;
  token: string;
  chain: string;
  timestamp: Date;
  fromType?: string;
  toType?: string;
  fromName?: string;
  toName?: string;
}

interface WhaleCluster {
  id: string;
  type: 'cex_outflow' | 'otc_desk' | 'mev_bot' | 'defi_whale' | 'unknown';
  addresses: string[];
  totalVolume: number;
  transactionCount: number;
  riskScore: number;
  label: string;
  color: string;
}

interface WhaleClusteringProps {
  transactions: WhaleTransaction[];
  enabled: boolean;
  onToggle: () => void;
  onClusterSelect: (cluster: WhaleCluster) => void;
}

export function WhaleClustering({ transactions, enabled, onToggle, onClusterSelect }: WhaleClusteringProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const clusters = useMemo(() => {
    if (!enabled || transactions.length === 0) return [];

    // Simple clustering algorithm based on transaction patterns
    const addressGroups = new Map<string, {
      addresses: Set<string>;
      volume: number;
      count: number;
      exchanges: Set<string>;
      patterns: string[];
    }>();

    transactions.forEach(tx => {
      const key = `${tx.fromType || 'unknown'}_${tx.toType || 'unknown'}`;
      
      if (!addressGroups.has(key)) {
        addressGroups.set(key, {
          addresses: new Set(),
          volume: 0,
          count: 0,
          exchanges: new Set(),
          patterns: []
        });
      }

      const group = addressGroups.get(key)!;
      group.addresses.add(tx.fromAddress);
      group.addresses.add(tx.toAddress);
      group.volume += tx.amountUSD;
      group.count += 1;

      if (tx.fromName) group.exchanges.add(tx.fromName);
      if (tx.toName) group.exchanges.add(tx.toName);
    });

    const clusters: WhaleCluster[] = [];
    let clusterId = 0;

    addressGroups.forEach((group, pattern) => {
      if (group.count < 2) return; // Skip single transactions

      let type: WhaleCluster['type'] = 'unknown';
      let label = 'Unknown Pattern';
      let color = 'bg-gray-500';

      // Classify cluster type
      if (pattern.includes('exchange') && !pattern.includes('unknown')) {
        if (pattern === 'exchange_unknown' || pattern === 'unknown_exchange') {
          type = 'cex_outflow';
          label = 'CEX Flow';
          color = 'bg-blue-500';
        } else {
          type = 'otc_desk';
          label = 'OTC Desk';
          color = 'bg-purple-500';
        }
      } else if (group.volume / group.count > 50000000) {
        type = 'defi_whale';
        label = 'DeFi Whale';
        color = 'bg-green-500';
      } else if (group.count > 10) {
        type = 'mev_bot';
        label = 'MEV/Bot';
        color = 'bg-orange-500';
      }

      clusters.push({
        id: `cluster_${clusterId++}`,
        type,
        addresses: Array.from(group.addresses),
        totalVolume: group.volume,
        transactionCount: group.count,
        riskScore: Math.min(100, (group.volume / 1000000) * 0.1),
        label,
        color
      });
    });

    return clusters.sort((a, b) => b.totalVolume - a.totalVolume);
  }, [transactions, enabled]);

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    return `$${(volume / 1e3).toFixed(0)}K`;
  };

  const getClusterIcon = (type: WhaleCluster['type']) => {
    switch (type) {
      case 'cex_outflow': return <Building2 className="h-3 w-3" />;
      case 'otc_desk': return <ArrowUpDown className="h-3 w-3" />;
      case 'mev_bot': return <Zap className="h-3 w-3" />;
      case 'defi_whale': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Whale Clustering</h3>
          <Badge variant="secondary" className="text-xs">
            {clusters.length} clusters
          </Badge>
        </div>
        
        <Button
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="text-xs"
        >
          {enabled ? 'Disable' : 'Enable'} Clustering
        </Button>
      </div>

      {enabled && clusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map(cluster => (
            <Card
              key={cluster.id}
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                selectedCluster === cluster.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setSelectedCluster(cluster.id === selectedCluster ? null : cluster.id);
                onClusterSelect(cluster);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${cluster.color} text-white`}>
                    {getClusterIcon(cluster.type)}
                  </div>
                  <span className="font-medium text-sm">{cluster.label}</span>
                </div>
                
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      {cluster.addresses.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{cluster.addresses.length} unique addresses</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="font-medium">{formatVolume(cluster.totalVolume)}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Transactions:</span>
                  <span className="font-medium">{cluster.transactionCount}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span className={`font-medium ${
                    cluster.riskScore > 70 ? 'text-red-500' :
                    cluster.riskScore > 40 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {cluster.riskScore.toFixed(0)}/100
                  </span>
                </div>
              </div>

              {selectedCluster === cluster.id && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">Sample addresses:</p>
                    {cluster.addresses.slice(0, 2).map(addr => (
                      <p key={addr} className="font-mono">
                        {addr.slice(0, 8)}...{addr.slice(-6)}
                      </p>
                    ))}
                    {cluster.addresses.length > 2 && (
                      <p>+{cluster.addresses.length - 2} more</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {enabled && clusters.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No clusters detected. Need more transaction data for clustering analysis.
          </p>
        </Card>
      )}
    </div>
  );
}