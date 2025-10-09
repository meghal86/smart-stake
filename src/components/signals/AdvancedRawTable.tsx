/**
 * AdvancedRawTable - P1 Implementation
 * Advanced grouping, outlier detection, and virtualization
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, ChevronUp, Filter, AlertTriangle } from 'lucide-react';
import { formatAmount } from '@/lib/format-helpers';
import type { Signal } from '@/types/signal';

interface AdvancedRawTableProps {
  signals: Signal[];
  onExport?: (filteredSignals: Signal[]) => void;
}

type GroupBy = 'none' | 'asset' | 'time' | 'exchange' | 'risk';
type FilterType = 'all' | 'outliers';

interface GroupedData {
  key: string;
  signals: Signal[];
  totalVolume: number;
  expanded: boolean;
}

export function AdvancedRawTable({ signals, onExport }: AdvancedRawTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // P1: Outlier detection
  const outlierThreshold = useMemo(() => {
    if (signals.length === 0) return 0;
    const amounts = signals.map(s => s.amountUsd).sort((a, b) => b - a);
    const q3Index = Math.floor(amounts.length * 0.25);
    const q1Index = Math.floor(amounts.length * 0.75);
    const iqr = amounts[q3Index] - amounts[q1Index];
    return amounts[q3Index] + (iqr * 1.5);
  }, [signals]);

  // P1: Filter signals
  const filteredSignals = useMemo(() => {
    if (filterType === 'outliers') {
      return signals.filter(s => 
        s.amountUsd > outlierThreshold || 
        s.risk === 'high'
      );
    }
    return signals;
  }, [signals, filterType, outlierThreshold]);

  // P1: Group signals
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return [{
        key: 'all',
        signals: filteredSignals,
        totalVolume: filteredSignals.reduce((sum, s) => sum + s.amountUsd, 0),
        expanded: true
      }];
    }

    const groups = filteredSignals.reduce((acc, signal) => {
      let key: string;
      switch (groupBy) {
        case 'asset':
          key = signal.asset;
          break;
        case 'time':
          key = new Date(signal.timestamp).toDateString();
          break;
        case 'exchange':
          key = signal.direction === 'outflow' ? 'Exchange Outflow' : 'Wallet Inflow';
          break;
        case 'risk':
          key = signal.risk.charAt(0).toUpperCase() + signal.risk.slice(1);
          break;
        default:
          key = 'Unknown';
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(signal);
      return acc;
    }, {} as Record<string, Signal[]>);

    return Object.entries(groups)
      .map(([key, signals]) => ({
        key,
        signals,
        totalVolume: signals.reduce((sum, s) => sum + s.amountUsd, 0),
        expanded: expandedGroups.has(key)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [filteredSignals, groupBy, expandedGroups]);

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groupedData.map(g => g.key)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  return (
    <div className="space-y-4">
      {/* P1: Controls */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group By:</label>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-32 px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800"
          >
            <option value="none">None</option>
            <option value="asset">Asset</option>
            <option value="time">Time</option>
            <option value="exchange">Exchange</option>
            <option value="risk">Risk</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filterType === 'outliers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(filterType === 'outliers' ? 'all' : 'outliers')}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-3 w-3" />
                  Outliers Only
                  {filterType === 'outliers' && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      {filteredSignals.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show only unusually large transactions (&gt;{formatAmount(outlierThreshold)}) or high-risk signals</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {groupBy !== 'none' && (
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport?.(filteredSignals)}
        >
          Export Filtered
        </Button>
      </div>

      {/* P1: Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-4 p-2 bg-slate-100 dark:bg-slate-800 border-b font-medium text-sm">
          <div className="w-20">Time</div>
          <div className="w-16">Asset</div>
          <div className="w-24 text-right">Amount</div>
          <div className="w-20">Risk</div>
          <div className="flex-1">Event</div>
          <div className="w-8"></div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {groupedData.map((group) => (
            <div key={group.key}>
              {groupBy !== 'none' && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.key)}
                    className="p-1"
                  >
                    {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <span className="font-medium">{group.key}</span>
                  <Badge variant="outline">{group.signals.length} signals</Badge>
                  <span className="text-sm text-slate-500 ml-auto">{formatAmount(group.totalVolume)}</span>
                </div>
              )}
              {group.expanded && group.signals.map((signal) => (
                <div key={signal.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-4 p-2">
                    <div className="w-20 text-xs text-slate-500">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="w-16 font-medium">{signal.asset}</div>
                    <div className="w-24 text-right font-mono">{formatAmount(signal.amountUsd)}</div>
                    <div className="w-20">
                      <Badge className={`text-xs ${
                        signal.risk === 'high' ? 'bg-red-100 text-red-700' :
                        signal.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {signal.risk}
                      </Badge>
                    </div>
                    <div className="flex-1 text-sm text-slate-600 truncate">{signal.reason}</div>
                    {signal.amountUsd > outlierThreshold && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const expandedKey = `${signal.id}-expanded`;
                        const newExpanded = new Set(expandedGroups);
                        if (newExpanded.has(expandedKey)) {
                          newExpanded.delete(expandedKey);
                        } else {
                          newExpanded.add(expandedKey);
                        }
                        setExpandedGroups(newExpanded);
                      }}
                      className="p-1 w-8"
                    >
                      {expandedGroups.has(`${signal.id}-expanded`) ? 
                        <ChevronUp className="h-3 w-3" /> : 
                        <ChevronDown className="h-3 w-3" />
                      }
                    </Button>
                  </div>
                  {expandedGroups.has(`${signal.id}-expanded`) && (
                    <div className="px-4 pb-3 bg-slate-50/50 dark:bg-slate-800/50 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="font-medium">ID:</span> {signal.id}</div>
                        <div><span className="font-medium">Direction:</span> {signal.direction}</div>
                        <div><span className="font-medium">Owner Type:</span> {signal.ownerType}</div>
                        <div><span className="font-medium">Source:</span> {signal.source}</div>
                        <div><span className="font-medium">Timestamp:</span> {new Date(signal.timestamp).toLocaleString()}</div>
                        <div><span className="font-medium">Impact Score:</span> {signal.impactScore?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div><span className="font-medium">Full Reason:</span> {signal.reason}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* P1: Summary Footer */}
      <div className="bg-white dark:bg-slate-900 border-t p-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>Showing {filteredSignals.length} of {signals.length} signals</span>
            {filterType === 'outliers' && (
              <Badge className="bg-amber-100 text-amber-700">
                Outliers: &gt;{formatAmount(outlierThreshold)}
              </Badge>
            )}
          </div>
          <div className="font-medium">
            Total Volume: {formatAmount(filteredSignals.reduce((sum, s) => sum + s.amountUsd, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}