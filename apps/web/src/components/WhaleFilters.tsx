import { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FilterState {
  search: string;
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  sortBy: 'risk' | 'balance' | 'activity';
  sortOrder: 'asc' | 'desc';
  minBalance: string;
  chain: 'all' | 'ethereum' | 'polygon' | 'bsc';
}

interface WhaleFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export const WhaleFilters = ({ filters, onFiltersChange, totalCount, filteredCount }: WhaleFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      riskLevel: 'all',
      sortBy: 'risk',
      sortOrder: 'desc',
      minBalance: '',
      chain: 'all'
    });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Filters & Sorting</span>
        <span className="text-sm text-muted-foreground">
          ({filteredCount} of {totalCount} whales)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search address..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Risk Level */}
        <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="high">High Risk (70+)</SelectItem>
            <SelectItem value="medium">Medium Risk (40-69)</SelectItem>
            <SelectItem value="low">Low Risk (&lt;40)</SelectItem>
          </SelectContent>
        </Select>

        {/* Chain */}
        <Select value={filters.chain} onValueChange={(value) => updateFilter('chain', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chains</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="bsc">BSC</SelectItem>
          </SelectContent>
        </Select>

        {/* Min Balance */}
        <Input
          placeholder="Min Balance (ETH)"
          type="number"
          value={filters.minBalance}
          onChange={(e) => updateFilter('minBalance', e.target.value)}
        />

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="risk">Risk Score</SelectItem>
            <SelectItem value="balance">Balance</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order & Clear */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex-1"
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};