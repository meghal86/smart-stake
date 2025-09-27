import { EntitySummary, SignalEvent, PulseData, ExploreData, EntityDetail, AlertRule } from "@/types/hub2";

// Mock data generators
export const generateMockKPIs = () => ({
  marketSentiment: Math.floor(Math.random() * 100),
  whalePressure: Math.floor(Math.random() * 200) - 100,
  risk: Math.floor(Math.random() * 10),
  deltas: {
    sentiment: Math.floor(Math.random() * 20) - 10,
    pressure: Math.floor(Math.random() * 40) - 20,
    risk: Math.floor(Math.random() * 4) - 2,
  }
});

export const generateMockEntity = (id: string, name: string, symbol?: string): EntitySummary => ({
  id,
  kind: 'asset',
  symbol,
  name,
  badges: Math.random() > 0.5 ? ['real'] : ['sim'],
  gauges: {
    sentiment: Math.floor(Math.random() * 100),
    whalePressure: Math.floor(Math.random() * 200) - 100,
    risk: Math.floor(Math.random() * 10),
  },
  priceUsd: Math.random() * 100000,
  change24h: (Math.random() - 0.5) * 20,
  lastEvents: generateMockEvents(3),
  provenance: {
    source: Math.random() > 0.5 ? 'etherscan' : 'coingecko',
    updatedAt: new Date().toISOString()
  }
});

export const generateMockEvents = (count: number): SignalEvent[] => {
  const eventTypes = ['dormant_awake', 'cex_outflow', 'defi_leverage', 'risk_change', 'sentiment_change'] as const;
  const confidences = ['low', 'med', 'high'] as const;
  const sources = ['etherscan', 'coingecko', 'defillama', 'simulated', 'internal'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `event-${i}`,
    ts: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    entity: {
      kind: 'asset' as const,
      id: `entity-${i}`,
      symbol: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'][Math.floor(Math.random() * 5)],
      name: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polkadot'][Math.floor(Math.random() * 5)]
    },
    impactUsd: Math.random() * 10000000,
    delta: Math.floor(Math.random() * 20) - 10,
    confidence: confidences[Math.floor(Math.random() * confidences.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    reasonCodes: ['price_momentum', 'volume_spike', 'whale_activity', 'market_sentiment'].slice(0, Math.floor(Math.random() * 3) + 1)
  }));
};

export const generateMockPulseData = (window: string): PulseData => ({
  kpis: generateMockKPIs(),
  topSignals: [
    generateMockEntity('btc', 'Bitcoin', 'BTC'),
    generateMockEntity('eth', 'Ethereum', 'ETH'),
    generateMockEntity('sol', 'Solana', 'SOL'),
    generateMockEntity('ada', 'Cardano', 'ADA'),
    generateMockEntity('dot', 'Polkadot', 'DOT'),
    generateMockEntity('avax', 'Avalanche', 'AVAX'),
  ],
  ts: new Date().toISOString()
});

export const generateMockExploreData = (queryString: string): ExploreData => {
  const entities = [
    generateMockEntity('btc', 'Bitcoin', 'BTC'),
    generateMockEntity('eth', 'Ethereum', 'ETH'),
    generateMockEntity('sol', 'Solana', 'SOL'),
    generateMockEntity('ada', 'Cardano', 'ADA'),
    generateMockEntity('dot', 'Polkadot', 'DOT'),
    generateMockEntity('avax', 'Avalanche', 'AVAX'),
    generateMockEntity('matic', 'Polygon', 'MATIC'),
    generateMockEntity('link', 'Chainlink', 'LINK'),
    generateMockEntity('uni', 'Uniswap', 'UNI'),
    generateMockEntity('aave', 'Aave', 'AAVE'),
  ];
  
  return {
    items: entities,
    total: entities.length,
    hasMore: false
  };
};

export const generateMockEntityDetail = (id: string): EntityDetail => {
  const entity = generateMockEntity(id, 'Bitcoin', 'BTC');
  return {
    summary: entity,
    timeline: generateMockEvents(10),
    ai: {
      soWhat: "Bitcoin is showing strong bullish momentum with increased whale accumulation and positive sentiment indicators. The risk level remains moderate with potential for continued upward movement.",
      next: [
        "Monitor for breakout above $50,000 resistance",
        "Watch for increased institutional buying",
        "Consider setting stop-loss at $45,000 support"
      ]
    }
  };
};

export const generateMockAlerts = (): AlertRule[] => [
  {
    id: 'alert-1',
    name: 'Bitcoin Price Alert',
    predicate: { type: 'price_change', threshold: 5 },
    scope: { kind: 'asset', ids: ['btc'] },
    threshold: { percentage: 5 },
    window: '24h',
    channels: ['inapp', 'push'],
    enabled: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'alert-2',
    name: 'Whale Activity Alert',
    predicate: { type: 'whale_transaction', threshold: 1000000 },
    scope: { kind: 'asset', ids: ['eth', 'btc'] },
    threshold: { usd: 1000000 },
    window: '1h',
    channels: ['inapp', 'email'],
    enabled: true,
    lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },
  {
    id: 'alert-3',
    name: 'Risk Level Alert',
    predicate: { type: 'risk_increase', threshold: 7 },
    scope: { kind: 'asset', ids: ['sol'] },
    threshold: { risk: 7 },
    window: '4h',
    channels: ['inapp'],
    enabled: false
  }
];

// Mock API responses
export const mockAPIResponses = {
  pulse: (window: string) => generateMockPulseData(window),
  explore: (queryString: string) => generateMockExploreData(queryString),
  entity: (id: string) => generateMockEntityDetail(id),
  alerts: () => generateMockAlerts(),
  backtest: () => ({
    winRate: 0.75,
    avgReturnPct: 12.5,
    sample: 100
  })
};
