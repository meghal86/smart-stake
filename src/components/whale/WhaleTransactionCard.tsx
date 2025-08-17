import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WhaleTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amountUSD: number;
  token: string;
  chain: string;
  timestamp: Date;
  txHash: string;
  type: "buy" | "sell";
}

interface WhaleTransactionCardProps {
  transaction: WhaleTransaction;
}

export function WhaleTransactionCard({ transaction }: WhaleTransactionCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${
            transaction.type === "buy" 
              ? "bg-success/20 text-success" 
              : "bg-destructive/20 text-destructive"
          }`}>
            {transaction.type === "buy" ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {formatAddress(transaction.fromAddress)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-mono text-sm text-muted-foreground">
            {formatAddress(transaction.toAddress)}
          </span>
        </div>
        <button
          onClick={() => window.open(`https://etherscan.io/tx/${transaction.txHash}`, '_blank')}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-foreground">
          {formatAmount(transaction.amountUSD)}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">{transaction.token}</div>
          <div className="text-xs text-muted-foreground">{transaction.chain}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge 
          variant={transaction.type === "buy" ? "default" : "destructive"}
          className="text-xs"
        >
          {transaction.type.toUpperCase()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatTime(transaction.timestamp)}
        </span>
      </div>
    </Card>
  );
}