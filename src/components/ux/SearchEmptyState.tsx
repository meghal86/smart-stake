import React from 'react';
import { ActionableEmptyState, type EmptyStateAction } from './ActionableEmptyState';
import { Search, RefreshCw, TrendingUp, Filter } from 'lucide-react';

interface SearchEmptyStateProps {
  searchQuery: string;
  searchCategory?: string;
  onClearSearch?: () => void;
  onBrowseAll?: () => void;
  onAdjustFilters?: () => void;
  suggestedTerms?: string[];
  totalItemsAvailable?: number;
  className?: string;
}

export function SearchEmptyState({
  searchQuery,
  searchCategory,
  onClearSearch,
  onBrowseAll,
  onAdjustFilters,
  suggestedTerms = [],
  totalItemsAvailable,
  className
}: SearchEmptyStateProps) {
  const getTitle = () => {
    if (searchCategory) {
      return `No ${searchCategory} found for "${searchQuery}"`;
    }
    return `No results found for "${searchQuery}"`;
  };

  const getDescription = () => {
    let baseDescription = 'Try adjusting your search terms or removing filters to find more results.';
    
    if (suggestedTerms.length > 0) {
      baseDescription += ` You might try searching for: ${suggestedTerms.slice(0, 3).join(', ')}.`;
    }
    
    if (totalItemsAvailable) {
      baseDescription += ` There are ${totalItemsAvailable.toLocaleString()} total items available.`;
    }
    
    return baseDescription;
  };

  const actions: EmptyStateAction[] = [];

  if (onClearSearch) {
    actions.push({
      label: 'Clear search',
      onClick: onClearSearch,
      variant: 'default',
      icon: RefreshCw
    });
  }

  if (onAdjustFilters) {
    actions.push({
      label: 'Adjust filters',
      onClick: onAdjustFilters,
      variant: 'outline',
      icon: Filter
    });
  }

  if (onBrowseAll) {
    actions.push({
      label: searchCategory ? `Browse all ${searchCategory}` : 'Browse all',
      onClick: onBrowseAll,
      variant: 'outline',
      icon: TrendingUp
    });
  }

  return (
    <ActionableEmptyState
      type="no-search-results"
      title={getTitle()}
      description={getDescription()}
      actions={actions}
      className={className}
    />
  );
}