import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export type BiFilters = {
  range: '7d' | '30d' | '90d';
  tier: 'all' | 'free' | 'pro' | 'premium' | 'enterprise';
  preset: 'all' | 'cex_inflows' | 'accumulation_cluster' | 'eth_btc_spillover';
  asset: 'all' | 'ETH' | 'BTC' | 'SOL';
};

interface FiltersBarProps {
  value: BiFilters;
  onChange: (filters: BiFilters) => void;
  lastRefreshed?: string;
}

export function FiltersBar({ value, onChange, lastRefreshed }: FiltersBarProps) {
  const [local, setLocal] = useState<BiFilters>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (key: keyof BiFilters, newValue: string) => {
    const updated = { ...local, [key]: newValue };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg mb-6">
      {/* Time Range */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time:</span>
        <Select value={local.range} onValueChange={(v) => handleChange('range', v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tier */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Tier:</span>
        <Select value={local.tier} onValueChange={(v) => handleChange('tier', v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preset */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Preset:</span>
        <Select value={local.preset} onValueChange={(v) => handleChange('preset', v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All presets</SelectItem>
            <SelectItem value="cex_inflows">CEX Inflows Spike</SelectItem>
            <SelectItem value="accumulation_cluster">Accumulation Cluster</SelectItem>
            <SelectItem value="eth_btc_spillover">ETH→BTC Spillover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Asset */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Asset:</span>
        <Select value={local.asset} onValueChange={(v) => handleChange('asset', v)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
            <SelectItem value="BTC">BTC</SelectItem>
            <SelectItem value="SOL">SOL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Last Refreshed */}
      <div className="ml-auto flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {lastRefreshed ? (
            <>Last refreshed {new Date(lastRefreshed).toLocaleTimeString()}</>
          ) : (
            'Not refreshed'
          )}
        </span>
      </div>
    </div>
  );
}