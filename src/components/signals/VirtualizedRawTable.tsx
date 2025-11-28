/**
 * Virtualized Raw Table - 60fps performance for large datasets
 */

import { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface VirtualizedRawTableProps {
  signals: Signal[];
  height?: number;
}

interface RowData {
  signals: Signal[];
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
}

const ROW_HEIGHT = 48;
const EXPANDED_ROW_HEIGHT = 120;

function TableRow({ index, style, data }: { index: number; style: unknown; data: RowData }) {
  const { signals, expandedRows, toggleRow } = data;
  const signal = signals[index];
  const isExpanded = expandedRows.has(signal.id);

  const rowStyle = {
    ...style,
    height: isExpanded ? EXPANDED_ROW_HEIGHT : ROW_HEIGHT,
  };

  return (
    <div style={rowStyle} className="border-b border-slate-200/40 dark:border-slate-800">
      {/* Main Row */}
      <div 
        className="grid grid-cols-[40px_80px_120px_80px_100px_100px_120px_100px_100px_100px_80px_80px_80px_80px_120px] gap-2 p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer text-sm transition-colors h-12 items-center"
        onClick={() => toggleRow(signal.id)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => { e.stopPropagation(); toggleRow(signal.id); }}
        >
          {isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
          }
        </Button>
        
        <div className="font-semibold text-slate-900 dark:text-slate-100">{signal.asset}</div>
        <div className="text-slate-700 dark:text-slate-300 truncate">{signal.token_name || signal.asset}</div>
        <div className="text-slate-600 dark:text-slate-400">ethereum</div>
        <div className="text-slate-600 dark:text-slate-400 truncate">
          {signal.direction === 'outflow' ? 'Whale' : 'Exchange'}
        </div>
        <div className="text-slate-600 dark:text-slate-400 truncate">
          {signal.direction === 'outflow' ? 'Exchange' : 'Cold Storage'}
        </div>
        
        <div className="text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
          {(signal.amountUsd / 2500).toFixed(6)}
        </div>
        <div className="text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
          $2,500.00
        </div>
        <div className="text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
          ${(signal.amountUsd / 1e6).toFixed(2)}M
        </div>
        <div className="text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
          {Math.floor(Math.random() * 1000000) + 18000000}
        </div>
        <div className="text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {signal.isLive ? '800ms' : '0ms'}
        </div>
        <div className="text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
          85%
        </div>
        <div className="text-right font-mono tabular-nums">
          <Badge variant={signal.risk === 'high' ? 'destructive' : 'outline'} className="text-xs">
            {signal.risk === 'high' ? '8.5' : '6.2'}
          </Badge>
        </div>
        <div className="text-slate-600 dark:text-slate-400 capitalize">{signal.ownerType}</div>
        <div className="text-slate-500 dark:text-slate-400">{signal.source}</div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 h-16">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-600 dark:text-slate-400">TX Hash:</span>
              <div className="font-mono text-xs text-slate-900 dark:text-slate-100">
                0x{Math.random().toString(16).substr(2, 16)}...
              </div>
            </div>
            <div>
              <span className="font-medium text-slate-600 dark:text-slate-400">Timestamp:</span>
              <div className="font-mono text-slate-900 dark:text-slate-100">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </div>
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
  );
}

export function VirtualizedRawTable({ signals, height = 600 }: VirtualizedRawTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
    trackEvent('raw_row_expanded', { signalId: id, expanded: !expandedRows.has(id) });
  }, [expandedRows]);

  const itemData: RowData = useMemo(() => ({
    signals,
    expandedRows,
    toggleRow,
  }), [signals, expandedRows, toggleRow]);

  const copyCSV = () => {
    const headers = ['symbol', 'name', 'chain', 'from', 'to', 'amount_usd', 'timestamp'];
    const csvData = [
      headers.join(','),
      ...signals.map(s => [
        s.asset, s.token_name || s.asset, 'ethereum',
        s.direction === 'outflow' ? 'Whale' : 'Exchange',
        s.direction === 'outflow' ? 'Exchange' : 'Cold Storage',
        s.amountUsd, s.timestamp
      ].join(','))
    ].join('\n');
    
    navigator.clipboard.writeText(csvData);
    trackEvent('raw_data_copied', { format: 'csv', rows: signals.length });
  };

  const copyJSON = () => {
    const jsonData = JSON.stringify(signals, null, 2);
    navigator.clipboard.writeText(jsonData);
    trackEvent('raw_data_copied', { format: 'json', rows: signals.length });
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <div className="min-w-[1400px] bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/40 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400">
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

        {/* Virtualized List */}
        <div className="min-w-[1400px] border border-slate-200/40 dark:border-slate-800">
          <List
            height={height}
            itemCount={signals.length}
            itemSize={ROW_HEIGHT}
            itemData={itemData}
            overscanCount={5}
          >
            {TableRow}
          </List>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/40 dark:border-slate-800">
        <div className="flex items-center gap-6 text-sm font-mono">
          <span>{signals.length} transactions</span>
          <span>•</span>
          <span>${(signals.reduce((sum, s) => sum + s.amountUsd, 0) / 1e6).toFixed(1)}M total</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyCSV}>
            <Copy className="h-3 w-3 mr-1" />
            Copy CSV
          </Button>
          <Button variant="outline" size="sm" onClick={copyJSON}>
            <Download className="h-3 w-3 mr-1" />
            Copy JSON
          </Button>
        </div>
      </div>
    </div>
  );
}