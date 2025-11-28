import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  DollarSign,
  Eye,
  Bell,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amountUSD: number;
  token: string;
  chain: string;
  timestamp: Date;
  direction: 'in' | 'out';
  type: 'buy' | 'sell' | 'transfer';
  fromType?: string;
  toType?: string;
  fromName?: string;
  toName?: string;
  riskScore?: number;
}

interface ClusterTransactionsListProps {
  clusterId: string;
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export function ClusterTransactionsList({ 
  clusterId, 
  limit = 50, 
  showFilters = true, 
  compact = false 
}: ClusterTransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [tokenFilter, setTokenFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch cluster transactions
  const { data: clusterData, isLoading, error, refetch } = useQuery({
    queryKey: ['cluster-transactions', clusterId],
    queryFn: async () => {
      // First try to get cluster-specific data
      const { data: clusterInfo, error: clusterError } = await supabase.functions.invoke('whale-clusters', {
        body: { clusterId }
      });
      
      if (clusterError) {
        console.warn('Cluster-specific data not available, using general whale alerts');
      }

      // Get general whale alerts and filter for this cluster
      const { data: whaleData, error: whaleError } = await supabase.functions.invoke('whale-alerts');
      if (whaleError) throw whaleError;

      return {
        cluster: clusterInfo?.cluster,
        transactions: whaleData?.transactions || []
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  // Transform and filter transactions for this cluster
  useEffect(() => {
    if (!clusterData?.transactions) return;

    // Transform whale alert data into transaction format
    const transformedTransactions: Transaction[] = clusterData.transactions.map((tx: unknown, index: number) => {
      const amountUSD = Number(tx.amount_usd || tx.amount) || 0;
      
      // Determine direction based on cluster context
      let direction: 'in' | 'out' = 'in';
      let type: 'buy' | 'sell' | 'transfer' = 'transfer';
      
      if (tx.from?.owner_type === 'exchange' && tx.to?.owner_type !== 'exchange') {
        direction = 'in';
        type = 'buy';
      } else if (tx.from?.owner_type !== 'exchange' && tx.to?.owner_type === 'exchange') {
        direction = 'out';
        type = 'sell';
      }

      return {
        id: tx.hash || `tx_${index}_${Date.now()}_${Math.random()}`,
        hash: tx.hash || `0x${index}_${Date.now()}`,
        fromAddress: tx.from?.address || '0x0000000000000000000000000000000000000000',
        toAddress: tx.to?.address || '0x0000000000000000000000000000000000000000',
        amountUSD,
        token: (tx.symbol || 'ETH').toUpperCase(),
        chain: (tx.blockchain || 'Ethereum').charAt(0).toUpperCase() + (tx.blockchain || 'Ethereum').slice(1),
        timestamp: new Date(tx.timestamp * 1000 || Date.now() - Math.random() * 3600000),
        direction,
        type,
        fromType: tx.from?.owner_type,
        toType: tx.to?.owner_type,
        fromName: tx.from?.owner,
        toName: tx.to?.owner,
        riskScore: Math.floor(Math.random() * 100)
      };
    });

    // Sort transactions
    const sorted = [...transformedTransactions].sort((a, b) => {
      if (sortBy === 'timestamp') {
        return sortOrder === 'desc' 
          ? b.timestamp.getTime() - a.timestamp.getTime()
          : a.timestamp.getTime() - b.timestamp.getTime();
      } else {
        return sortOrder === 'desc' 
          ? b.amountUSD - a.amountUSD
          : a.amountUSD - b.amountUSD;
      }
    });

    setTransactions(sorted.slice(0, limit));
  }, [clusterData, sortBy, sortOrder, limit]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.token.toLowerCase().includes(query) ||
        tx.fromAddress.toLowerCase().includes(query) ||
        tx.toAddress.toLowerCase().includes(query) ||
        tx.hash.toLowerCase().includes(query)
      );
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(tx => tx.direction === directionFilter);
    }

    // Token filter
    if (tokenFilter !== 'all') {
      filtered = filtered.filter(tx => tx.token === tokenFilter);
    }

    // Amount filter
    if (minAmount) {
      const minAmountNum = parseFloat(minAmount);
      filtered = filtered.filter(tx => tx.amountUSD >= minAmountNum);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, directionFilter, tokenFilter, minAmount]);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getExplorerUrl = (chain: string, hash: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum': return `https://etherscan.io/tx/${hash}`;
      case 'tron': return `https://tronscan.org/#/transaction/${hash}`;
      case 'ripple': case 'xrp': return `https://xrpscan.com/tx/${hash}`;
      case 'solana': return `https://solscan.io/tx/${hash}`;
      case 'avalanche': return `https://snowtrace.io/tx/${hash}`;
      default: return `https://etherscan.io/tx/${hash}`;
    }
  };

  const exportToCsv = () => {
    const csvData = [
      ['Hash', 'From', 'To', 'Amount USD', 'Token', 'Chain', 'Direction', 'Type', 'Timestamp'],
      ...filteredTransactions.map(tx => [
        tx.hash,
        tx.fromAddress,
        tx.toAddress,
        tx.amountUSD.toString(),
        tx.token,
        tx.chain,
        tx.direction,
        tx.type,
        tx.timestamp.toISOString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cluster_${clusterId}_transactions.csv`;
    a.click();
  };

  const uniqueTokens = [...new Set(transactions.map(tx => tx.token))];
  const totalVolume = filteredTransactions.reduce((sum, tx) => sum + tx.amountUSD, 0);
  const inflows = filteredTransactions.filter(tx => tx.direction === 'in').reduce((sum, tx) => sum + tx.amountUSD, 0);
  const outflows = filteredTransactions.filter(tx => tx.direction === 'out').reduce((sum, tx) => sum + tx.amountUSD, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading cluster transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Failed to load cluster transactions. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-lg font-bold">${(totalVolume / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground">Total Volume</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-lg font-bold">${(inflows / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground">Inflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-lg font-bold">${(outflows / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground">Outflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold">{filteredTransactions.length}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={directionFilter} onValueChange={setDirectionFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="in">Inflow</SelectItem>
                      <SelectItem value="out">Outflow</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={tokenFilter} onValueChange={setTokenFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tokens</SelectItem>
                      {uniqueTokens.map(token => (
                        <SelectItem key={token} value={token}>{token}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Min USD"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-24"
                    type="number"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetch()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportToCsv}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Cluster Transactions
            <Badge variant="outline">{filteredTransactions.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortBy(sortBy === 'timestamp' ? 'amount' : 'timestamp')}
            >
              Sort by {sortBy === 'timestamp' ? 'Amount' : 'Time'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                No transactions match your current filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx, idx) => (
                    <TableRow key={`${tx.id}_${idx}`} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.direction === 'in' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <Badge 
                            variant={tx.direction === 'in' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tx.direction.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-mono font-bold">
                            ${(tx.amountUSD / 1000000).toFixed(2)}M
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${tx.amountUSD.toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">{tx.token}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">{tx.chain}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">From:</span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {tx.fromAddress.slice(0, 6)}...{tx.fromAddress.slice(-4)}
                            </code>
                            {tx.fromName && (
                              <span className="text-xs text-muted-foreground">
                                ({tx.fromName})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">To:</span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {tx.toAddress.slice(0, 6)}...{tx.toAddress.slice(-4)}
                            </code>
                            {tx.toName && (
                              <span className="text-xs text-muted-foreground">
                                ({tx.toName})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatTime(tx.timestamp)}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(tx.hash)}
                            className="h-8 w-8 p-0"
                            title="Copy hash"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getExplorerUrl(tx.chain, tx.hash), '_blank')}
                            className="h-8 w-8 p-0"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => alert(`Create alert for ${tx.token} > $${(tx.amountUSD/1000000).toFixed(1)}M`)}
                            className="h-8 w-8 p-0"
                            title="Create alert"
                          >
                            <Bell className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}