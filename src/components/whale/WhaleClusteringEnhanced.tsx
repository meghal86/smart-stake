import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WhaleCluster {
  id: string;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'CEX_INFLOW' | 'DEFI_ACTIVITY' | 'DORMANT_WAKING';
  name: string;
  membersCount: number;
  sumBalanceUsd: number;
  netFlow24h: number;
  riskScore: number;
  transactionCount24h?: number;
  members?: Array<{
    address: string;
    balanceUsd: number;
    riskScore: number;
    reasonCodes: string[];
    lastActivityTs: string;
    direction?: 'IN' | 'OUT';
    amount?: number;
  }>;
}

interface ChainRiskData {
  chain: string;
  riskScore: number;
  cexInflowPercent: number;
  netOutflowPercent: number;
  dormantWakePercent: number;
  hasData: boolean;
}

interface WhaleClusteringEnhancedProps {
  clusters?: WhaleCluster[];
  chainRiskData?: ChainRiskData[];
  onClusterSelect: (cluster: WhaleCluster) => void;
  onWhaleSelect: (whale: unknown) => void;
}

export function WhaleClusteringEnhanced({ 
  clusters = [], 
  chainRiskData = [],
  onClusterSelect, 
  onWhaleSelect 
}: WhaleClusteringEnhancedProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Enhanced cluster data with fallbacks
  const enhancedClusters = useMemo(() => {
    return clusters.map(cluster => ({
      ...cluster,
      // Show transaction count if balance is 0
      displayValue: cluster.sumBalanceUsd > 0 
        ? `$${(cluster.sumBalanceUsd / 1000000000).toFixed(1)}B`
        : `${cluster.transactionCount24h || 0} tx in 24h`,
      // Enhanced naming
      enhancedName: getEnhancedClusterName(cluster.type, cluster.membersCount),
      riskLevel: getRiskLevel(cluster.riskScore)
    }));
  }, [clusters]);

  // Default chain risk data if none provided
  const defaultChainRisk: ChainRiskData[] = [
    { chain: 'BTC', riskScore: 45, cexInflowPercent: 20, netOutflowPercent: 15, dormantWakePercent: 10, hasData: true },
    { chain: 'ETH', riskScore: 62, cexInflowPercent: 25, netOutflowPercent: 20, dormantWakePercent: 17, hasData: true },
    { chain: 'SOL', riskScore: 38, cexInflowPercent: 15, netOutflowPercent: 12, dormantWakePercent: 11, hasData: true },
    { chain: 'Others', riskScore: 0, cexInflowPercent: 0, netOutflowPercent: 0, dormantWakePercent: 0, hasData: false }
  ];

  const displayChainRisk = chainRiskData.length > 0 ? chainRiskData : defaultChainRisk;

  function getEnhancedClusterName(type: string, count: number): string {
    switch (type) {
      case 'DISTRIBUTION': return `Outflow Whales (${count})`;
      case 'ACCUMULATION': return `Accumulation Whales (${count})`;
      case 'CEX_INFLOW': return `CEX Inflow (${count})`;
      case 'DEFI_ACTIVITY': return `DeFi Activity (${count})`;
      case 'DORMANT_WAKING': return `Dormant Waking (${count})`;
      default: return `${type} (${count})`;
    }
  }

  function getRiskLevel(score: number): { label: string; color: string; bgColor: string } {
    if (score >= 70) return { label: 'High Risk', color: 'text-red-700', bgColor: 'bg-red-100' };
    if (score >= 40) return { label: 'Medium Risk', color: 'text-orange-700', bgColor: 'bg-orange-100' };
    return { label: 'Low Risk', color: 'text-green-700', bgColor: 'bg-green-100' };
  }

  function getClusterColor(type: string): string {
    switch (type) {
      case 'ACCUMULATION': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'DISTRIBUTION': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'CEX_INFLOW': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'DEFI_ACTIVITY': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'DORMANT_WAKING': return 'bg-red-500/10 text-red-700 border-red-200'; // High risk color
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  }

  function getClusterIcon(type: string): string {
    switch (type) {
      case 'ACCUMULATION': return '📈';
      case 'DISTRIBUTION': return '📤';
      case 'CEX_INFLOW': return '🏦';
      case 'DEFI_ACTIVITY': return '🔄';
      case 'DORMANT_WAKING': return '😴';
      default: return '❓';
    }
  }

  function getRiskHeatmapColor(score: number): string {
    if (score === 0) return 'bg-gray-400';
    if (score >= 70) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function exportClusterTransactions(cluster: WhaleCluster) {
    if (!cluster.members) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Address,Balance USD,Risk Score,Direction,Amount,Reason Codes,Last Activity\n" +
      cluster.members.map(member => 
        `${member.address},${member.balanceUsd},${member.riskScore},${member.direction || 'N/A'},${member.amount || 0},"${member.reasonCodes.join('; ')}",${member.lastActivityTs}`
      ).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${cluster.name.replace(/\s+/g, '_')}_transactions.csv`);
    link.click();
  }

  const handleClusterClick = (cluster: WhaleCluster) => {
    setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id);
    onClusterSelect(cluster);
  };

  const selectedClusterData = enhancedClusters.find(c => c.id === selectedCluster);

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-8">
        {/* Cluster Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Whale Behavior Clusters</h3>
          {enhancedClusters.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading whale behavior clusters...</p>
                <p className="text-sm mt-2">Analyzing transaction patterns and behavioral signals</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {enhancedClusters.map((cluster) => (
                <Card 
                  key={cluster.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedCluster === cluster.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleClusterClick(cluster)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getClusterIcon(cluster.type)}</span>
                        <Badge className={getClusterColor(cluster.type)}>
                          {cluster.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge className={`${cluster.riskLevel.color} ${cluster.riskLevel.bgColor} border-0`}>
                        {cluster.riskLevel.label}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">{cluster.enhancedName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {cluster.membersCount} addresses
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {cluster.displayValue}
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

        {/* Enhanced Risk Heatmap by Chain */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Risk Heatmap by Chain</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {displayChainRisk.map((chainData) => (
              <Card key={chainData.chain} className="p-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">{chainData.chain}</h4>
                  {chainData.hasData ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getRiskHeatmapColor(chainData.riskScore)}`}>
                          {chainData.riskScore}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium mb-1">{chainData.chain} Risk Breakdown:</p>
                          <p>CEX Inflow: {chainData.cexInflowPercent}%</p>
                          <p>Net Outflow: {chainData.netOutflowPercent}%</p>
                          <p>Dormant Wake: {chainData.dormantWakePercent}%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold bg-gray-400">
                      --
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {chainData.hasData ? `Risk Score: ${chainData.riskScore}` : 'Insufficient data'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Drill-down Table */}
        {selectedClusterData && (
          <div className="mt-8 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedClusterData.name} Details
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cluster 24h Value: {selectedClusterData.displayValue} • Sample Transactions
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportClusterTransactions(selectedClusterData)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => setSelectedCluster(null)}>
                  Close
                </Button>
              </div>
            </div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Amount</TableHead>
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
                          <Badge className={`${selectedClusterData.riskLevel.color} ${selectedClusterData.riskLevel.bgColor} border-0`}>
                            {whale.riskScore}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {whale.direction && (
                            <Badge 
                              variant={whale.direction === 'IN' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {whale.direction === 'IN' ? (
                                <><ArrowDownLeft className="h-3 w-3 mr-1" />IN</>
                              ) : (
                                <><ArrowUpRight className="h-3 w-3 mr-1" />OUT</>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {whale.amount ? `$${(whale.amount / 1000000).toFixed(1)}M` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
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
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
    </TooltipProvider>
  );
}