export interface SearchContext {
  address?: string;
  tx?: string;
  asset?: string;
  risk?: 'low' | 'medium' | 'high';
  chain?: string;
  amount?: {
    operator: '>' | '<' | '=' | '>=' | '<=';
    value: number;
  };
  raw?: string;
}

export function parseSearchQuery(query: string): SearchContext {
  const context: SearchContext = { raw: query };
  
  if (!query.trim()) return context;
  
  // Parse prefixed searches
  const prefixMatches = query.match(/(\w+):([^\s]+)/g);
  
  if (prefixMatches) {
    prefixMatches.forEach(match => {
      const [prefix, value] = match.split(':');
      
      switch (prefix.toLowerCase()) {
        case 'addr':
        case 'address':
          if (value.match(/^0x[a-fA-F0-9]{40}$/)) {
            context.address = value;
          }
          break;
          
        case 'tx':
        case 'hash':
          if (value.match(/^0x[a-fA-F0-9]{64}$/)) {
            context.tx = value;
          }
          break;
          
        case 'asset':
        case 'token':
          context.asset = value.toUpperCase();
          break;
          
        case 'risk':
          if (['low', 'medium', 'high'].includes(value.toLowerCase())) {
            context.risk = value.toLowerCase() as 'low' | 'medium' | 'high';
          }
          break;
          
        case 'chain':
          context.chain = value.toLowerCase();
          break;
          
        case 'amount':
          const amountMatch = value.match(/^([><=]+)?(\d+(?:\.\d+)?)(k|m|b)?$/i);
          if (amountMatch) {
            const [, operator = '>=', amount, suffix] = amountMatch;
            let numValue = parseFloat(amount);
            
            // Convert suffixes
            switch (suffix?.toLowerCase()) {
              case 'k': numValue *= 1000; break;
              case 'm': numValue *= 1000000; break;
              case 'b': numValue *= 1000000000; break;
            }
            
            context.amount = {
              operator: operator as any,
              value: numValue
            };
          }
          break;
      }
    });
  } else {
    // Handle plain text searches
    if (query.match(/^0x[a-fA-F0-9]{40}$/)) {
      context.address = query;
    } else if (query.match(/^0x[a-fA-F0-9]{64}$/)) {
      context.tx = query;
    } else if (query.match(/^[A-Z]{2,10}$/)) {
      context.asset = query.toUpperCase();
    }
  }
  
  return context;
}

export function buildSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  
  if (query.includes(':')) return suggestions;
  
  // Suggest prefixes based on input
  if (query.startsWith('0x')) {
    if (query.length <= 42) {
      suggestions.push(`addr:${query}`);
    }
    if (query.length <= 66) {
      suggestions.push(`tx:${query}`);
    }
  } else if (query.match(/^[a-zA-Z]+$/)) {
    suggestions.push(`asset:${query.toUpperCase()}`);
    suggestions.push(`chain:${query.toLowerCase()}`);
  } else if (query.match(/^\d/)) {
    suggestions.push(`amount:>${query}m`);
  }
  
  // Common suggestions
  if (!query) {
    suggestions.push('risk:high', 'chain:ethereum', 'asset:BTC', 'amount:>10m');
  }
  
  return suggestions.slice(0, 4);
}