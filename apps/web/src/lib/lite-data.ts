export interface Spotlight {
  id: string;
  whaleId: string;
  asset: string;
  amount: number;
  narrative: string;
  risk: 'low' | 'med' | 'high';
}

export async function getDailySpotlight({ tier }: { tier: string }): Promise<Spotlight> {
  // TODO wire real data; mock for now
  return {
    id: 'sp1',
    whaleId: 'Whale #1234',
    asset: 'ETH',
    amount: 10000,
    narrative: 'Likely accumulation; aligns with stablecoin inflows.',
    risk: 'med'
  };
}

export async function getDial() { 
  return { score: 62, label: 'Accumulation bias' }; 
}

export async function getDigest() {
  return [
    { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy' as const },
    { id: 'd2', text: 'ETH CEX inflows up', direction: 'sell' as const },
    { id: 'd3', text: 'USDT mints spiked', direction: 'buy' as const }
  ];
}
