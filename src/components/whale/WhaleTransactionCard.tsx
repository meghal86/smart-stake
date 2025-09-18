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
  fromName?: string;
  toName?: string;
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

  const formatEntityName = (name?: string) => {
    if (!name) return '';
    const cleaned = name.replace(/_/g, ' ').trim();
    // Keep it compact
    return cleaned.length > 14 ? cleaned.slice(0, 12) + '…' : cleaned;
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

  const getRiskLevel = (usd: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (usd > 50000000) return 'critical';
    if (usd > 10000000) return 'high';
    if (usd > 1000000) return 'medium';
    return 'low';
  };

  const risk = getRiskLevel(transaction.amountUSD);

  const getFlowLabel = (): { label: string; tooltip: string } => {
    const t = (transaction.txType || '').toLowerCase();
    if (t.includes('deposit')) return { label: 'CEX → Wallet', tooltip: 'Deposit from centralized exchange to wallet' };
    if (t.includes('withdrawal')) return { label: 'Wallet → CEX', tooltip: 'Withdrawal from wallet to centralized exchange' };
    if (t.includes('exchange_transfer')) return { label: 'CEX ↔ CEX', tooltip: 'Transfer between exchange addresses' };
    if (t.includes('wallet_transfer') || t === 'transfer') return { label: 'Wallet ↔ Wallet', tooltip: 'Transfer between wallets' };
    // Fallback using from/to types
    const fromT = (transaction.fromType || '').toLowerCase();
    const toT = (transaction.toType || '').toLowerCase();
    const isFromCEX = fromT.includes('exchange');
    const isToCEX = toT.includes('exchange');
    if (isFromCEX && !isToCEX) return { label: 'CEX → Wallet', tooltip: 'Deposit from exchange' };
    if (!isFromCEX && isToCEX) return { label: 'Wallet → CEX', tooltip: 'Withdrawal to exchange' };
    if (isFromCEX && isToCEX) return { label: 'CEX ↔ CEX', tooltip: 'Transfer between exchanges' };
    return { label: 'Wallet ↔ Wallet', tooltip: 'Transfer between wallets' };
  };

  const getExplorerAddressUrl = (chain: string, address: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum': return `https://etherscan.io/address/${address}`;
      case 'tron': return `https://tronscan.org/#/address/${address}`;
      case 'ripple':
      case 'xrp': return `https://xrpscan.com/account/${address}`;
      case 'bitcoin':
      case 'btc': return `https://blockchair.com/bitcoin/address/${address}`;
      case 'bsc':
      case 'binance': return `https://bscscan.com/address/${address}`;
      case 'polygon': return `https://polygonscan.com/address/${address}`;
      case 'solana': return `https://solscan.io/account/${address}`;
      default: return `https://etherscan.io/address/${address}`;
    }
  };

  // Entity type helpers: label, emoji, and explanation tooltip
  const normalizeType = (t: string) => {
    const s = t.toLowerCase();
    if (['cex', 'exchange', 'centralized_exchange'].includes(s)) return 'exchange';
    if (['dex', 'amm', 'liquidity_pool', 'pool'].includes(s)) return 'dex';
    if (['bridge', 'cross_chain_bridge', 'cross-chain-bridge'].includes(s)) return 'bridge';
    if (['contract', 'smart_contract', 'smart-contract'].includes(s)) return 'contract';
    if (['defi', 'protocol', 'lending', 'staking_protocol', 'yield'].includes(s)) return 'defi';
    if (['miner', 'mining_pool', 'validator', 'staking', 'node', 'infrastructure'].includes(s)) return 'infrastructure';
    if (['institution', 'fund', 'foundation', 'whale'].includes(s)) return 'institution';
    if (['other', 'others', 'service', 'unknown_service'].includes(s)) return 'other';
    if (s === 'wallet') return 'wallet';
    return s;
  };

  const entityInfo = (t?: string) => {
    if (!t) return null;
    const kind = normalizeType(t);
    const info: Record<string, { emoji: string; label: string; desc: string }> = {
      exchange: { emoji: '🏦', label: 'Exchange', desc: 'Centralized exchange (CEX) address. Movements are typically deposits or withdrawals.' },
      dex: { emoji: '🔁', label: 'DEX/Pool', desc: 'Decentralized exchange or liquidity pool smart contract.' },
      bridge: { emoji: '🌉', label: 'Bridge', desc: 'Cross-chain bridge contract or operator address.' },
      contract: { emoji: '📜', label: 'Contract', desc: 'General smart contract address (protocol or utility).' },
      defi: { emoji: '🏗️', label: 'DeFi Protocol', desc: 'DeFi protocol address (lending, staking, yield, etc.).' },
      infrastructure: { emoji: '⚙️', label: 'Infrastructure', desc: 'Validator, miner, staking node, or infrastructure service.' },
      institution: { emoji: '🏛️', label: 'Institution', desc: 'Large holder, fund, or foundation-managed address.' },
      other: { emoji: '❓', label: 'Other', desc: 'Unclassified address (service, contract, or private wallet). Classification is uncertain.' },
      wallet: { emoji: '👛', label: 'Wallet', desc: 'Regular wallet. Often a user or cold wallet.' },
    };
    return info[kind] || { emoji: '🏷️', label: t.replace(/_/g, ' '), desc: 'Address category provided by data source.' };
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
    <TooltipProvider>
      <Card 
        className={`group p-6 mb-6 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border transition-all duration-200 cursor-pointer ${
          transaction.type === "buy" 
            ? "border-l-4 border-l-green-500 hover:border-green-500/30" 
            : transaction.type === "sell"
            ? "border-l-4 border-l-red-500 hover:border-red-500/30"
            : "border-l-4 border-l-blue-500 hover:border-blue-500/30"
        } ${isMegaTransaction ? 'shadow-2xl ring-2 ring-yellow-400/60 border-yellow-400/40 bg-gradient-to-r from-yellow-50/20 to-orange-50/20' : isLargeTransaction ? 'shadow-lg ring-1 ring-blue-400/40 border-blue-400/30 bg-blue-50/10' : ''} hover:shadow-lg hover:scale-[1.02]`}
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
          {/* From address + optional entity name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => copyToClipboard(transaction.fromAddress, e)}
                className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {transaction.fromName && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 mr-1 capitalize">
                    {formatEntityName(transaction.fromName)}
                  </span>
                )}
                {formatAddress(transaction.fromAddress)}
                <Copy size={10} className="opacity-0 group-hover:opacity-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {transaction.fromName && (
                  <p className="text-xs font-medium">{transaction.fromName}</p>
                )}
                <p className="text-xs">Click to copy: {transaction.fromAddress}</p>
              </div>
            </TooltipContent>
          </Tooltip>
          <a
            href={getExplorerAddressUrl(transaction.chain, transaction.fromAddress)}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noreferrer"
            className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
            title="Open address in explorer"
          >
            <ExternalLink size={12} />
          </a>
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
          {/* To address + optional entity name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => copyToClipboard(transaction.toAddress, e)}
                className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {transaction.toName && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 mr-1 capitalize">
                    {formatEntityName(transaction.toName)}
                  </span>
                )}
                {formatAddress(transaction.toAddress)}
                <Copy size={10} className="opacity-0 group-hover:opacity-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {transaction.toName && (
                  <p className="text-xs font-medium">{transaction.toName}</p>
                )}
                <p className="text-xs">Click to copy: {transaction.toAddress}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        <a
          href={getExplorerAddressUrl(transaction.chain, transaction.toAddress)}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noreferrer"
          className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          title="Open address in explorer"
        >
          <ExternalLink size={12} />
        </a>
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
              <span className="text-yellow-400">💥</span>
              <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-0.5 rounded-full font-bold">
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
          {/* Flow direction badge (CEX vs wallet) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs">
                {getFlowLabel().label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">{getFlowLabel().tooltip}</span>
            </TooltipContent>
          </Tooltip>
          {/* Risk level badge */}
          <Badge 
            variant="outline" 
            className={`text-xs ${
              risk === 'critical' ? 'text-red-500 border-red-500/40' :
              risk === 'high' ? 'text-orange-500 border-orange-500/40' :
              risk === 'medium' ? 'text-yellow-500 border-yellow-500/40' :
              'text-green-500 border-green-500/40'
            }`}
            title={`Risk: ${risk}`}
          >
            {risk}
          </Badge>
          {(() => {
            const raw = (transaction.fromType || '').toLowerCase();
            if (!raw || raw === 'unknown' || raw === 'null') return null;
            const info = entityInfo(raw);
            if (!info) return null;
            // We still hide generic 'wallet' badge to reduce noise
            if (normalizeType(raw) === 'wallet') return null;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    <span className="mr-1">{info.emoji}</span> {info.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-xs max-w-xs block">{info.desc}</span>
                </TooltipContent>
              </Tooltip>
            );
          })()}
          {(() => {
            const raw = (transaction.toType || '').toLowerCase();
            if (!raw || raw === 'unknown' || raw === 'null') return null;
            const info = entityInfo(raw);
            if (!info) return null;
            if (normalizeType(raw) === 'wallet') return null;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    <span className="mr-1">{info.emoji}</span> {info.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-xs max-w-xs block">{info.desc}</span>
                </TooltipContent>
              </Tooltip>
            );
          })()}
          <Tooltip>
            <TooltipTrigger>
              <Info size={14} className="text-muted-foreground hover:text-[#14B8A6] transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p className="font-semibold text-sm">
                  {transaction.type === "buy" ? "🟢 Whale Buy Signal" :
                   transaction.type === "sell" ? "🔴 Whale Sell Signal" :
                   "🔵 Whale Transfer"}
                </p>
                <p className="text-xs">
                  {transaction.type === "buy" ? "Large purchase detected - institutional or whale accumulation. This could indicate bullish sentiment." :
                   transaction.type === "sell" ? "Large sale detected - whale distribution or profit-taking. Monitor for potential price impact." :
                   "Large transfer between wallets - whale movement or exchange activity. Could signal upcoming market action."}
                </p>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p>💡 <strong>Tip:</strong> {formatAmount(transaction.amountUSD)} transactions often move markets</p>
                </div>
              </div>
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
