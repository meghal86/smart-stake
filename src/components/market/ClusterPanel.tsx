// Enhanced Cluster Panel with Data Coherence
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { ClusterBundle, TxSample, TopMover, Window } from '@/types/cluster';
import { formatUSD, getRiskThreshold, getConfidenceLabel, CLUSTER_THRESHOLDS } from '@/lib/market/compute';
import { useClusterStore } from '@/stores/clusterStore';
import { supabase } from '@/integrations/supabase/client';
import { buildClusterBundle } from '@/lib/market/cluster-utils';

interface ClusterPanelProps {
  clusterId: string;
  onClose: () => void;
  clusterData?: unknown;
}

const WHALE_ALERT_QUERY_STALE_TIME = 2 * 60 * 1000;

export function ClusterPanel({ clusterId, onClose, clusterData }: ClusterPanelProps) {
  const { timeWindow } = useClusterStore();

  const { data: whaleAlerts, isLoading, error } = useQuery({
    queryKey: ['whale-alerts', timeWindow],
    queryFn: async () => {
      const { data, error: fnError } = await supabase.functions.invoke('whale-alerts');
      if (fnError) {
        throw new Error(fnError.message || 'Unable to load whale-alerts function');
      }
      if (data?.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
      return Array.isArray(data?.transactions) ? data.transactions : [];
    },
    staleTime: WHALE_ALERT_QUERY_STALE_TIME,
    retry: 1,
  });

  const bundle: ClusterBundle | undefined = useMemo(() => {
    if (!clusterId) {
      return undefined;
    }

    const options = {
      clusterId,
      clusterType: clusterData?.type,
      clusterName: clusterData?.name,
      clusterKind: clusterData?.kind,
      clusterRiskScore: clusterData?.riskScore,
      clusterConfidence: clusterData?.confidence,
      addressesCount: clusterData?.addressesCount ?? clusterData?.membersCount,
      netFlow24h: clusterData?.netFlow24h,
      sumBalanceUsd: clusterData?.sumBalanceUsd,
      shareOfTotalPct: clusterData?.shareOfTotalPct,
      alerts: clusterData?.alerts,
      fallbackTransactions: whaleAlerts,
      timeWindow: timeWindow as Window,
    };

    try {
      return buildClusterBundle(options);
    } catch (err) {
      console.error('Failed to build cluster bundle from alerts', err);
      return undefined;
    }
  }, [clusterId, clusterData, whaleAlerts, timeWindow]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading cluster data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !bundle) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load cluster data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { metrics, tx, topMovers = [], relatedAlerts } = bundle;
  const riskLevel = getRiskThreshold(metrics.riskScore);
  const confidenceLabel = getConfidenceLabel(metrics.confidencePct);
  const isUncertain = metrics.confidencePct < CLUSTER_THRESHOLDS.minConfidenceForClassification;

  return (
    <Card className="w-full" data-cluster-id={clusterId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              {metrics.name}
              {relatedAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {relatedAlerts.length} Alert{relatedAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isUncertain ? "secondary" : "default"}>
                {isUncertain ? "Uncertain" : metrics.kind}
              </Badge>
              {!isUncertain && (
                <Badge 
                  variant={riskLevel === "High" ? "destructive" : riskLevel === "Watch" ? "secondary" : "default"}
                >
                  {riskLevel} Risk
                </Badge>
              )}
              <Badge variant="outline">
                {confidenceLabel} Confidence ({metrics.confidencePct}%)
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{formatUSD(metrics.valueAbsUSD)}</p>
            <p className="text-xs text-muted-foreground">Cluster 24h Value</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              {metrics.netFlowUSD > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className="text-2xl font-bold">{formatUSD(metrics.netFlowUSD)}</p>
            </div>
            <p className="text-xs text-muted-foreground">24h Net Flow</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{metrics.shareOfTotalPct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">% of Total Net Flow</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{metrics.activeAddresses}</p>
            <p className="text-xs text-muted-foreground">Active Addresses</p>
          </div>
        </div>

        {/* Data Source Notice */}
        {metrics.note && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {metrics.note === "balance_delta_source" && 
                "Aggregated from balance deltas; provider may not expose all internal/DEX txs."
              }
              {metrics.note === "insufficient_data" && 
                `No activity in the last ${timeWindow}. Low coverage or inactive cluster.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Samples or Top Movers */}
        <div>
          <h4 className="font-semibold mb-3">
            {tx.length > 0 ? 'Sample Transactions' : topMovers && topMovers.length > 0 ? 'Top Movements' : 'Activity'}
          </h4>

          {tx.length > 0 ? (
            <TransactionTable transactions={tx} />
          ) : topMovers && topMovers.length > 0 ? (
            <TopMoversTable movers={topMovers} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No whale activity detected in the last {timeWindow}.</p>
              <p className="text-sm mt-1">This cluster type has no matching transactions in your alerts data.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionTable({ transactions }: { transactions: TxSample[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Direction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge variant={tx.direction === 'in' ? 'default' : 'secondary'}>
                  {tx.direction.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">
                {formatUSD(tx.amountUSD)}
              </TableCell>
              <TableCell>{tx.token || 'Unknown'}</TableCell>
              <TableCell>{tx.chain}</TableCell>
              <TableCell>{tx.venue}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(tx.ts).toLocaleTimeString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TopMoversTable({ movers }: { movers: TopMover[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Delta USD</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movers.map((mover, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-sm">
                {mover.address.slice(0, 6)}...{mover.address.slice(-4)}
              </TableCell>
              <TableCell className="font-mono">
                {formatUSD(mover.deltaUSD)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {mover.lastSeen ? new Date(mover.lastSeen).toLocaleString() : 'Unknown'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
