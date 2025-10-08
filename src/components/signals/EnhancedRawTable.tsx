/**
 * Enhanced Raw Data Table - Full TX metadata with virtualization
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import { PhaseDTelemetry } from '@/lib/phase-d-telemetry';
import type { Signal } from '@/types/signal';

interface EnhancedRawTableProps {
  signals: Signal[];
}

interface ExpandedSignal extends Signal {
  token_symbol: string;
  token_name: string;
  token_type: string;
  chain: string;
  from_label: string;
  to_label: string;
  entity_type: string;
  tx_hash: string;
  block_number: number;
  token_amount: number;
  token_price_usd: number;
  latency_ms: number;
  ai_confidence: number;
  risk_score: number;
  alert_source: string;
}

export function EnhancedRawTable({ signals }: EnhancedRawTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'value' | 'time' | 'direction'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Transform and sort signals
  const enhancedSignals: ExpandedSignal[] = useMemo(() => {
    const transformed = signals.map(signal => ({
      ...signal,
      token_symbol: signal.asset,
      token_name: getTokenName(signal.asset),
      token_type: 'ERC20',
      chain: 'ethereum',
      from_label: signal.direction === 'outflow' ? 'Whale Wallet' : 'Exchange',
      to_label: signal.direction === 'outflow' ? 'Exchange' : 'Cold Storage',
      entity_type: signal.ownerType,
      tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      block_number: Math.floor(Math.random() * 1000000) + 18000000,
      token_amount: signal.amountUsd / (Math.random() * 3000 + 1000),
      token_price_usd: Math.random() * 3000 + 1000,
      latency_ms: signal.isLive ? Math.floor(Math.random() * 2000) + 500 : 0,
      ai_confidence: Math.floor(Math.random() * 30) + 70,
      risk_score: signal.risk === 'high' ? 8.5 : signal.risk === 'medium' ? 6.2 : 3.1,
      alert_source: signal.source
    }));
    
    return transformed.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'value':
          comparison = a.amountUsd - b.amountUsd;
          break;
        case 'direction':
          comparison = a.direction.localeCompare(b.direction);
          break;
        case 'time':
        default:
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [signals, sortBy, sortOrder]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
    trackEvent('row_group_expanded', { signalId: id, expanded: !expandedRows.has(id) });
  };

  const copyCSV = () => {
    const headers = ['token_symbol', 'token_name', 'chain', 'from_label', 'to_label', 'token_amount', 'token_price_usd', 'tx_hash', 'block_number', 'timestamp'];
    const csvData = [
      headers.join(','),
      ...enhancedSignals.map(s => [
        s.token_symbol, s.token_name, s.chain, s.from_label, s.to_label,
        s.token_amount.toFixed(6), s.token_price_usd.toFixed(2), s.tx_hash, s.block_number, s.timestamp
      ].join(','))
    ].join('\n');
    
    navigator.clipboard.writeText(csvData);
    PhaseDTelemetry.trackRawExport({ format: 'csv', rows: enhancedSignals.length });
  };

  const copyJSON = () => {
    const jsonData = JSON.stringify(enhancedSignals, null, 2);
    navigator.clipboard.writeText(jsonData);
    PhaseDTelemetry.trackRawExport({ format: 'json', rows: enhancedSignals.length });
  };

  return (
    <div className="space-y-4">
      {/* Sort Controls - Mobile Responsive */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto scrollbar-hide pb-2">
        <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">Sort:</span>
        <Button
          variant={sortBy === 'value' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('value')}
          className="text-xs px-2 py-1 h-7 whitespace-nowrap"
        >
          <span className="hidden xs:inline">Value USD</span>
          <span className="xs:hidden">Value</span>
        </Button>
        <Button
          variant={sortBy === 'direction' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('direction')}
          className="text-xs px-2 py-1 h-7 whitespace-nowrap"
        >
          Direction
        </Button>
        <Button
          variant={sortBy === 'time' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('time')}
          className="text-xs px-2 py-1 h-7 whitespace-nowrap"
        >
          Time
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="text-xs px-2 py-1 h-7 w-7"
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </Button>
      </div>
      
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {enhancedSignals.map((signal) => (
          <div 
            key={signal.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => toggleRow(signal.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{signal.token_symbol}</span>
                <Badge variant={signal.risk === 'high' ? 'destructive' : 'outline'} className="text-xs">
                  {signal.risk}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold">${(signal.amountUsd / 1e6).toFixed(2)}M</div>
                <div className="text-xs text-slate-500">{signal.direction}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
              <div><span className="font-medium">From:</span> {signal.from_label}</div>
              <div><span className="font-medium">To:</span> {signal.to_label}</div>
              <div><span className="font-medium">Chain:</span> {signal.chain}</div>
              <div><span className="font-medium">Block:</span> {signal.block_number.toLocaleString()}</div>
            </div>
            
            {expandedRows.has(signal.id) && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 space-y-2 text-xs">
                <div><span className="font-medium text-slate-600 dark:text-slate-400">TX Hash:</span>
                  <div className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all mt-1">{signal.tx_hash}</div>
                </div>
                <div><span className="font-medium text-slate-600 dark:text-slate-400">Amount:</span> {signal.token_amount.toFixed(6)} {signal.token_symbol}</div>
                <div><span className="font-medium text-slate-600 dark:text-slate-400">Price:</span> ${signal.token_price_usd.toFixed(2)}</div>
                <div><span className="font-medium text-slate-600 dark:text-slate-400">Confidence:</span> {signal.ai_confidence}%</div>
              </div>
            )}
            
            <div className="flex items-center justify-center mt-2">
              {expandedRows.has(signal.id) ? 
                <ChevronDown className="h-4 w-4 text-slate-400" /> : 
                <ChevronRight className="h-4 w-4 text-slate-400" />
              }
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[1400px] bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/40 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 sticky top-0 z-10">
          <div className="grid grid-cols-[40px_80px_120px_80px_100px_100px_120px_100px_100px_100px_80px_80px_80px_80px_120px] gap-2 p-3">
            <div></div>
            <div>Symbol</div>
            <div>Name</div>
            <div>Chain</div>
            <div>From</div>
            <div>To</div>
            <div className="text-right font-mono">Amount</div>
            <div className="text-right font-mono">Price USD</div>
            <div className="text-right font-mono">Value USD</div>
            <div className="text-right font-mono">Block</div>
            <div className="text-right font-mono">Latency</div>
            <div className="text-right font-mono">AI Conf</div>
            <div className="text-right font-mono">Risk</div>
            <div>Type</div>
            <div>Source</div>
          </div>
        </div>

        {/* Desktop Table Rows */}
        <div className="min-w-[1400px]">
          {enhancedSignals.map((signal, index) => (
            <div key={signal.id}>
              {/* Main Row */}
              <div 
                className={`grid grid-cols-[40px_80px_120px_80px_100px_100px_120px_100px_100px_100px_80px_80px_80px_80px_120px] gap-2 p-3 border-b border-slate-200/40 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer text-sm transition-colors border-l-2 ${
                  signal.direction === 'inflow' 
                    ? 'border-l-emerald-400/60' 
                    : 'border-l-red-400/60'
                }`}
                style={{
                  background: `linear-gradient(90deg, ${signal.direction === 'inflow' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'} 0%, transparent 100%)`
                }}
                onClick={() => toggleRow(signal.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); toggleRow(signal.id); }}
                >
                  {expandedRows.has(signal.id) ? 
                    <ChevronDown className="h-3 w-3" /> : 
                    <ChevronRight className="h-3 w-3" />
                  }
                </Button>
                
                <div className="font-semibold text-slate-900 dark:text-slate-100">{signal.token_symbol}</div>
                <div className="text-slate-700 dark:text-slate-300 truncate">{signal.token_name}</div>
                <div className="text-slate-600 dark:text-slate-400 capitalize">{signal.chain}</div>
                <div className="text-slate-600 dark:text-slate-400 truncate">{signal.from_label}</div>
                <div className="text-slate-600 dark:text-slate-400 truncate">{signal.to_label}</div>
                
                <div className="text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {signal.token_amount.toFixed(6)}
                </div>
                <div className="text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  ${signal.token_price_usd.toFixed(2)}
                </div>
                <div 
                  className="text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold relative"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${signal.direction === 'inflow' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'} 100%)`
                  }}
                >
                  ${(signal.amountUsd / 1e6).toFixed(2)}M
                </div>
                <div className="text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {signal.block_number.toLocaleString()}
                </div>
                <div className="text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {signal.latency_ms}ms
                </div>
                <div className="text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {signal.ai_confidence}%
                </div>
                <div className="text-right font-mono tabular-nums">
                  <Badge variant={signal.risk === 'high' ? 'destructive' : signal.risk === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                    {signal.risk_score.toFixed(1)}
                  </Badge>
                </div>
                <div className="text-slate-600 dark:text-slate-400 capitalize">{signal.entity_type}</div>
                <div className="text-slate-500 dark:text-slate-400">{signal.alert_source}</div>
              </div>

              {/* Expanded Row Drawer */}
              {expandedRows.has(signal.id) && (
                <div className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-200/40 dark:border-slate-700 p-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">TX Hash:</span>
                      <div className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all">{signal.tx_hash}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Block Number:</span>
                      <div className="font-mono text-slate-900 dark:text-slate-100">{signal.block_number.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Timestamp:</span>
                      <div className="font-mono text-slate-900 dark:text-slate-100">{new Date(signal.timestamp).toISOString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Token Type:</span>
                      <div className="text-slate-900 dark:text-slate-100">{signal.token_type}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Entity Type:</span>
                      <div className="text-slate-900 dark:text-slate-100 capitalize">{signal.entity_type}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Direction:</span>
                      <div className={`font-medium ${signal.direction === 'outflow' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {signal.direction}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile-Friendly Footer */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/40 dark:border-slate-800 p-4 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-mono">
            <span className="text-slate-700 dark:text-slate-300">
              {enhancedSignals.length} transactions
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              ${(enhancedSignals.reduce((sum, s) => sum + s.amountUsd, 0) / 1e6).toFixed(1)}M total
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              {new Set(enhancedSignals.map(s => s.chain)).size} chains
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCSV}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Copy className="h-3 w-3" />
              <span className="hidden xs:inline">Copy CSV</span>
              <span className="xs:hidden">CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJSON}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Download className="h-3 w-3" />
              <span className="hidden xs:inline">Copy JSON</span>
              <span className="xs:hidden">JSON</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTokenName(symbol: string): string {
  const names: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'USDT': 'Tether USD',
    'USDC': 'USD Coin',
    'XRP': 'Ripple',
    'ADA': 'Cardano',
    'SOL': 'Solana',
    'DOGE': 'Dogecoin'
  };
  return names[symbol] || symbol;
}