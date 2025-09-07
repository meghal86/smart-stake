import { ExternalLink, TrendingUp, TrendingDown, Info, Waves, Copy, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WhaleProfileModal } from './WhaleProfileModal';
import { useState } from 'react';

interface WhaleTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amountUSD: number;
  token: string;
  chain: string;
  timestamp: Date;
  txHash: string;
  type: "buy" | "sell" | "transfer";
  fromType?: string;
  toType?: string;
  txType?: string;
}

interface WhaleTransactionCardProps {
  transaction: WhaleTransaction;
  onClick?: () => void;
}

export function WhaleTransactionCard({ transaction, onClick }: WhaleTransactionCardProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const getChainIcon = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum': return 'Ξ'
      case 'tron': return '⚡'
      case 'ripple': case 'xrp': return '🌊'
      case 'bitcoin': case 'btc': return '₿'
      case 'bsc': case 'binance': return '🟡'
      case 'polygon': return '🔷'
      default: return '🔗'
    }
  }

  const getTokenIcon = (token: string) => {
    switch (token.toLowerCase()) {
      case 'usdt': return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
      case 'usdc': return <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
      case 'eth': return <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs">Ξ</div>
      case 'btc': return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">₿</div>
      case 'xrp': return <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">X</div>
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">🪙</div>
    }
  }

  const getChainLogo = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum': return <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs">Ξ</div>
      case 'tron': return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">⚡</div>
      case 'ripple': case 'xrp': return <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">🌊</div>
      case 'bitcoin': case 'btc': return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">₿</div>
      case 'bsc': case 'binance': return <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs">B</div>
      case 'polygon': return <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">🔷</div>
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">🔗</div>
    }
  }

  const isLargeTransaction = transaction.amountUSD > 5000000;
  const isMegaTransaction = transaction.amountUSD > 10000000;

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
    <TooltipProvider>
      <Card 
        className={`group p-4 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border transition-all duration-200 cursor-pointer ${
          transaction.type === "buy" 
            ? "border-l-4 border-l-green-500 hover:border-green-500/30" 
            : transaction.type === "sell"
            ? "border-l-4 border-l-red-500 hover:border-red-500/30"
            : "border-l-4 border-l-blue-500 hover:border-blue-500/30"
        } ${isMegaTransaction ? 'animate-bounce shadow-2xl ring-2 ring-yellow-400' : isLargeTransaction ? 'animate-pulse shadow-lg' : ''} hover:shadow-lg hover:scale-[1.02]`}
        onClick={onClick}
      >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${
            transaction.type === "buy" 
              ? "bg-green-500/20 text-green-500" 
              : transaction.type === "sell"
              ? "bg-red-500/20 text-red-500"
              : "bg-blue-500/20 text-blue-500"
          }`}>
            {transaction.type === "buy" ? (
              <TrendingUp size={14} />
            ) : transaction.type === "sell" ? (
              <TrendingDown size={14} />
            ) : (
              <ExternalLink size={14} />
            )}
            {isLargeTransaction && (
              <div className="absolute -top-1 -right-1">
                <Waves size={8} className="text-blue-400 animate-bounce" />
              </div>
            )}
          </div>
          {getChainLogo(transaction.chain)}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => copyToClipboard(transaction.fromAddress, e)}
                  className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  {formatAddress(transaction.fromAddress)}
                  <Copy size={10} className="opacity-0 group-hover:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to copy: {transaction.fromAddress}</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileModal(true);
              }}
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="View whale profile"
            >
              <User size={10} />
            </Button>
          </div>
          <span className="text-muted-foreground">→</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => copyToClipboard(transaction.toAddress, e)}
                className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {formatAddress(transaction.toAddress)}
                <Copy size={10} className="opacity-0 group-hover:opacity-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy: {transaction.toAddress}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <button
          onClick={() => {
            const getExplorerUrl = (chain: string, txHash: string) => {
              switch (chain.toLowerCase()) {
                case 'ethereum':
                  return `https://etherscan.io/tx/${txHash}`
                case 'tron':
                  return `https://tronscan.org/#/transaction/${txHash}`
                case 'ripple':
                case 'xrp':
                  return `https://xrpscan.com/tx/${txHash}`
                case 'bitcoin':
                case 'btc':
                  return `https://blockchair.com/bitcoin/transaction/${txHash}`
                case 'bsc':
                case 'binance':
                  return `https://bscscan.com/tx/${txHash}`
                case 'polygon':
                  return `https://polygonscan.com/tx/${txHash}`
                default:
                  return `https://etherscan.io/tx/${txHash}`
              }
            }
            window.open(getExplorerUrl(transaction.chain, transaction.txHash), '_blank')
          }}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className={`font-bold text-foreground ${
          isLargeTransaction ? 'text-3xl' : 'text-2xl'
        }`}>
          {formatAmount(transaction.amountUSD)}
          {isMegaTransaction && (
            <div className="ml-2 flex items-center gap-1">
              <span className="text-yellow-400 animate-spin">⚡</span>
              <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                MEGA WHALE
              </span>
            </div>
          )}
          {isLargeTransaction && !isMegaTransaction && <span className="ml-2 text-blue-400">🐋</span>}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-foreground flex items-center gap-2 justify-end">
            {getTokenIcon(transaction.token)}
            <span className="font-mono">{transaction.token}</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 justify-end">
            {getChainLogo(transaction.chain)}
            <span className="capitalize">{transaction.chain}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 items-center">
          <Badge 
            variant={transaction.type === "buy" ? "default" : transaction.type === "sell" ? "destructive" : "secondary"}
            className="text-xs"
          >
            {transaction.type === "buy" ? "🟢 BUY" : transaction.type === "sell" ? "🔴 SELL" : "🔵 TRANSFER"}
            {isMegaTransaction && <span className="ml-1">💥</span>}
          </Badge>
          {transaction.fromType && transaction.fromType !== 'wallet' && (
            <Badge variant="outline" className="text-xs">
              🏦 {transaction.fromType}
            </Badge>
          )}
          {transaction.toType && transaction.toType !== 'wallet' && (
            <Badge variant="outline" className="text-xs">
              🏦 {transaction.toType}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger>
              <Info size={12} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                {transaction.type === "buy" ? "Large purchase detected - whale accumulating" :
                 transaction.type === "sell" ? "Large sale detected - whale distributing" :
                 "Large transfer between wallets - whale movement"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTime(transaction.timestamp)}
        </span>
      </div>
      </Card>
      
      {showProfileModal && (
        <WhaleProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          address={transaction.fromAddress}
          chain={transaction.chain}
        />
      )}
    </TooltipProvider>
  );
}