/**
 * Wallet Timeline
 * Comprehensive transaction history with filters, search, and AI insights
 */
import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Filter,
  Search,
  Download,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIExplainerTooltip } from './AIExplainerTooltip';
import { cn } from '@/lib/utils';

export type TransactionType = 'sent' | 'received' | 'swap' | 'approval' | 'contract' | 'mint' | 'burn';
export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  from: string;
  to: string;
  amount?: string;
  token?: string;
  tokenLogo?: string;
  usdValue?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  confirmations?: number;
  description: string;
  network: string;
  explorerUrl?: string;
}

interface WalletTimelineProps {
  transactions: Transaction[];
  walletAddress: string;
  onExport?: () => void;
  showAIInsights?: boolean;
}

export function WalletTimeline({
  transactions,
  walletAddress,
  onExport,
  showAIInsights = true,
}: WalletTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Status filter
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          tx.hash.toLowerCase().includes(query) ||
          tx.description.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to.toLowerCase().includes(query) ||
          tx.token?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [transactions, searchQuery, filterType, filterStatus]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = tx.timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  // Calculate AI insights
  const aiInsights = useMemo(() => {
    if (!showAIInsights || transactions.length === 0) return null;

    const totalValue = transactions.reduce((sum, tx) => {
      const value = parseFloat(tx.usdValue || '0');
      return sum + value;
    }, 0);

    const swapCount = transactions.filter((tx) => tx.type === 'swap').length;
    const approvalCount = transactions.filter((tx) => tx.type === 'approval').length;

    return {
      totalValue: totalValue.toFixed(2),
      swapCount,
      approvalCount,
      message: `You've made ${swapCount} swaps worth $${totalValue.toFixed(2)} this month.${
        approvalCount > 3 ? ' Consider revoking unused approvals.' : ''
      }`,
    };
  }, [transactions, showAIInsights]);

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search transactions, addresses, tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="swap">Swaps</SelectItem>
            <SelectItem value="approval">Approvals</SelectItem>
            <SelectItem value="contract">Contracts</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        {onExport && (
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            className="border-slate-700 hover:bg-slate-800/50"
            aria-label="Export transactions"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* AI Insights Banner */}
      {aiInsights && (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-100 mb-1">
              AI Insights
            </p>
            <p className="text-sm text-slate-300">{aiInsights.message}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="h-[600px] pr-4">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm py-2 mb-3 z-10">
                  <h3 className="text-sm font-semibold text-slate-400">{date}</h3>
                </div>

                {/* Transactions for this date */}
                <div className="space-y-2 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
                  {txs.map((tx) => (
                    <TimelineItem key={tx.id} transaction={tx} walletAddress={walletAddress} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TimelineItem({
  transaction,
  walletAddress,
}: {
  transaction: Transaction;
  walletAddress: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const typeIcon = getTypeIcon(transaction.type);
  const typeColor = getTypeColor(transaction.type);
  const statusIcon = getStatusIcon(transaction.status);
  const statusColor = getStatusColor(transaction.status);

  return (
    <div
      className={cn(
        'relative pl-12 pb-3 cursor-pointer transition-all',
        expanded && 'bg-slate-800/30 -ml-2 pl-14 pr-4 py-3 rounded-lg'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Timeline Dot */}
      <div
        className={cn(
          'absolute left-4 top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center',
          typeColor,
          'bg-slate-900'
        )}
      >
        {React.cloneElement(typeIcon as React.ReactElement, {
          className: 'h-2.5 w-2.5',
        })}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Main Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-slate-100">
                {transaction.description}
              </p>
              {statusIcon}
            </div>
            <p className="text-xs text-slate-400">
              {transaction.timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Amount */}
          {transaction.amount && (
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-slate-100">
                {transaction.type === 'sent' ? '-' : '+'}
                {transaction.amount} {transaction.token}
              </p>
              {transaction.usdValue && (
                <p className="text-xs text-slate-400">${transaction.usdValue}</p>
              )}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Transaction Hash */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-slate-300">
                  {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                </code>
                {transaction.explorerUrl && (
                  <a
                    href={transaction.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* From/To */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">From</span>
                <code className="text-slate-300 font-mono text-xs">
                  {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
                </code>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">To</span>
                <code className="text-slate-300 font-mono text-xs">
                  {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                </code>
              </div>
            </div>

            {/* Gas & Confirmations */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {transaction.gasUsed && (
                <div>
                  <span className="text-slate-500 block mb-1">Gas Used</span>
                  <span className="text-slate-300">{transaction.gasUsed}</span>
                </div>
              )}
              {transaction.confirmations !== undefined && (
                <div>
                  <span className="text-slate-500 block mb-1">Confirmations</span>
                  <span className="text-slate-300">{transaction.confirmations}</span>
                </div>
              )}
            </div>

            {/* AI Explainer */}
            <div className="flex items-center gap-2">
              <AIExplainerTooltip
                concept="What is this transaction?"
                simpleExplanation={getTransactionExplanation(transaction)}
                technicalExplanation={`Transaction ${transaction.hash} on ${transaction.network}`}
                side="bottom"
              />
              <span className="text-xs text-slate-500">Explain this transaction</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeIcon(type: TransactionType) {
  switch (type) {
    case 'sent':
      return <ArrowUpRight />;
    case 'received':
      return <ArrowDownLeft />;
    case 'swap':
      return <RefreshCw />;
    case 'approval':
      return <CheckCircle />;
    default:
      return <CheckCircle />;
  }
}

function getTypeColor(type: TransactionType) {
  switch (type) {
    case 'sent':
      return 'border-red-500/50 text-red-400';
    case 'received':
      return 'border-green-500/50 text-green-400';
    case 'swap':
      return 'border-blue-500/50 text-blue-400';
    case 'approval':
      return 'border-amber-500/50 text-amber-400';
    default:
      return 'border-slate-500/50 text-slate-400';
  }
}

function getStatusIcon(status: TransactionStatus) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusColor(status: TransactionStatus) {
  switch (status) {
    case 'success':
      return 'text-green-500';
    case 'pending':
      return 'text-amber-500';
    case 'failed':
      return 'text-red-500';
  }
}

function getTransactionExplanation(transaction: Transaction): string {
  switch (transaction.type) {
    case 'sent':
      return `You sent ${transaction.amount} ${transaction.token} to another wallet. This reduces your balance.`;
    case 'received':
      return `You received ${transaction.amount} ${transaction.token} from another wallet. This increases your balance.`;
    case 'swap':
      return `You exchanged one token for another, likely on a decentralized exchange like Uniswap.`;
    case 'approval':
      return `You gave permission for a smart contract to access your tokens. Be careful with unlimited approvals!`;
    default:
      return `This is a blockchain transaction recorded on ${transaction.network}.`;
  }
}

