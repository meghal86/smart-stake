import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Plus, TrendingUp, TrendingDown } from 'lucide-react';

interface WhaleCluster {
  id: string;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'CEX_INFLOW' | 'DEFI_ACTIVITY' | 'DORMANT_WAKING';
  name: string;
  membersCount: number;
  sumBalanceUsd: number;
  netFlow24h: number;
  riskScore: number;
  members?: Array<{
    address: string;
    balanceUsd: number;
    riskScore: number;
    reasonCodes: string[];
    lastActivityTs: string;
  }>;
}

interface WhaleClustersProps {
  clusters?: WhaleCluster[];
  onClusterSelect: (cluster: WhaleCluster) => void;
  onWhaleSelect: (whale: any) => void;
}

export function WhaleClusters({ clusters = [], onClusterSelect, onWhaleSelect }: WhaleClustersProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const getClusterColor = (type: string) => {
    switch (type) {
      case 'ACCUMULATION': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'DISTRIBUTION': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'CEX_INFLOW': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'DEFI_ACTIVITY': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'DORMANT_WAKING': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const handleClusterClick = (cluster: WhaleCluster) => {
    setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id);
    onClusterSelect(cluster);
  };

  const displayClusters = clusters || [];
  const selectedClusterData = displayClusters.find(c => c.id === selectedCluster);

  return (
    <div className="space-y-6 pb-8">
      {/* Cluster Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Whale Behavior Clusters</h3>
        {displayClusters.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No whale cluster data available</p>
            <p className="text-sm mt-2">Clusters will appear when whale data is loaded</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayClusters.map((cluster) => (
            <Card 
              key={cluster.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCluster === cluster.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleClusterClick(cluster)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getClusterColor(cluster.type)}>
                    {cluster.type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getRiskColor(cluster.riskScore)}>
                    {cluster.riskScore}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">{cluster.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {cluster.membersCount} addresses
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    ${(cluster.sumBalanceUsd / 1000000000).toFixed(1)}B
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {cluster.netFlow24h > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={cluster.netFlow24h > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${Math.abs(cluster.netFlow24h / 1000000).toFixed(0)}M 24h
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* Risk Heatmap by Chain */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Risk Heatmap by Chain</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {displayClusters.length === 0 ? (
            <div className="col-span-4 text-center text-muted-foreground py-8">
              No risk heatmap data available
            </div>
          ) : (
            ['BTC', 'ETH', 'SOL', 'Others'].map((chain) => (
              <Card key={chain} className="p-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">{chain}</h4>
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold bg-gray-400">
                    --
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    No data
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Drill-down Table */}
      {selectedClusterData && (
        <div className="mt-8 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedClusterData.name} Details
            </h3>
            <Button variant="outline" onClick={() => setSelectedCluster(null)}>
              Close
            </Button>
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Reason Codes</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClusterData.members?.length ? (
                  selectedClusterData.members.map((whale, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">
                        {whale.address}
                      </TableCell>
                      <TableCell>
                        ${(whale.balanceUsd / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(whale.riskScore)}>
                          {whale.riskScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {whale.reasonCodes.join(', ')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(whale.lastActivityTs).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onWhaleSelect(whale)}
                          >
                            Analyze
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No whale data available for this cluster
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}