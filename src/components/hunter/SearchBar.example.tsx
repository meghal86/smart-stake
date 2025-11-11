/**
 * SearchBar Component Examples
 * 
 * This file contains usage examples for the SearchBar component.
 * These examples can be used in Storybook or for documentation.
 */

import React, { useState } from 'react';
import { SearchBar } from './SearchBar';

/**
 * Example 1: Basic Usage
 */
export function BasicSearchBarExample() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search opportunities..."
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Current search: {search || '(empty)'}
      </div>
    </div>
  );
}

/**
 * Example 2: With Suggestions
 */
export function SearchBarWithSuggestionsExample() {
  const [search, setSearch] = useState('');
  
  const suggestions = [
    'Ethereum Staking',
    'LayerZero Airdrop',
    'Uniswap Quest',
    'Solana Yield',
    'Arbitrum Points',
  ];

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={setSearch}
        suggestions={suggestions}
        placeholder="Search opportunities..."
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Current search: {search || '(empty)'}
      </div>
    </div>
  );
}

/**
 * Example 3: With Dynamic Suggestions
 */
export function SearchBarWithDynamicSuggestionsExample() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const allSuggestions = [
    'Ethereum Staking',
    'Ethereum Yield',
    'LayerZero Airdrop',
    'Uniswap Quest',
    'Solana Yield',
    'Solana Staking',
    'Arbitrum Points',
    'Arbitrum Airdrop',
  ];

  // Filter suggestions based on search input
  React.useEffect(() => {
    if (search.length > 1) {
      const filtered = allSuggestions.filter(s =>
        s.toLowerCase().includes(search.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [search]);

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={setSearch}
        suggestions={suggestions}
        placeholder="Search opportunities..."
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Current search: {search || '(empty)'}
        <br />
        Suggestions: {suggestions.length}
      </div>
    </div>
  );
}

/**
 * Example 4: With Analytics Tracking
 */
export function SearchBarWithAnalyticsExample() {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  const suggestions = ['Ethereum Staking', 'LayerZero Airdrop', 'Uniswap Quest'];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setEvents(prev => [...prev, `Search changed: "${value}"`]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEvents(prev => [...prev, `Suggestion clicked: "${suggestion}"`]);
  };

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        placeholder="Search opportunities..."
      />
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Events:</div>
        <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto">
          {events.length === 0 ? (
            <div>No events yet</div>
          ) : (
            events.map((event, i) => (
              <div key={i}>{event}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Example 5: Custom Debounce Time
 */
export function SearchBarWithCustomDebounceExample() {
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLastUpdate(new Date());
  };

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        debounceMs={1000} // 1 second debounce
        placeholder="Search with 1s debounce..."
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Current search: {search || '(empty)'}
        <br />
        Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
      </div>
    </div>
  );
}

/**
 * Example 6: Disabled State
 */
export function SearchBarDisabledExample() {
  const [search, setSearch] = useState('Some search text');

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        value={search}
        onChange={setSearch}
        disabled
        placeholder="Search opportunities..."
      />
      <div className="mt-4 text-sm text-muted-foreground">
        This search bar is disabled
      </div>
    </div>
  );
}

/**
 * Example 7: Integration with useHunterFeed Pattern
 */
export function SearchBarIntegrationExample() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Simulate useHunterFeed hook
  const mockOpportunities = [
    { id: '1', title: 'Ethereum Staking', type: 'Staking' },
    { id: '2', title: 'LayerZero Airdrop', type: 'Airdrop' },
    { id: '3', title: 'Uniswap Quest', type: 'Quest' },
  ];

  const filteredOpportunities = mockOpportunities.filter(opp =>
    opp.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-md">
      <div className="space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search opportunities..."
        />
        
        <div className="flex gap-2">
          {['All', 'Staking', 'Airdrop', 'Quest'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            Results ({filteredOpportunities.length}):
          </div>
          {filteredOpportunities.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No opportunities found
            </div>
          ) : (
            filteredOpportunities.map(opp => (
              <div
                key={opp.id}
                className="p-3 border rounded-lg text-sm"
              >
                <div className="font-medium">{opp.title}</div>
                <div className="text-muted-foreground">{opp.type}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
