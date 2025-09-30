import { z } from 'zod';

export const Spotlight = z.object({
  id: z.string(),
  whaleId: z.string(),
  asset: z.string(),
  amount: z.number(),
  narrative: z.string(),
  risk: z.enum(['low','med','high'])
});
export type Spotlight = z.infer<typeof Spotlight>;

export async function getDailySpotlight({ tier }: { tier: string }): Promise<Spotlight> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock realistic data based on current time
  const now = new Date();
  const assets = ['ETH', 'BTC', 'USDC', 'WETH'];
  const asset = assets[now.getHours() % assets.length];
  const amount = Math.floor(Math.random() * 50000000) + 1000000; // 1M-50M
  
  return {
    id: `sp_${now.getTime()}`,
    whaleId: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)}`,
    asset,
    amount,
    narrative: `Large ${asset} movement detected. ${tier === 'lite' ? 'Upgrade for full analysis.' : 'Likely accumulation pattern.'}`,
    risk: ['low', 'med', 'high'][Math.floor(Math.random() * 3)] as 'low'|'med'|'high'
  };
}

export async function getDial() {
  await new Promise(resolve => setTimeout(resolve, 50));
  const score = Math.floor(Math.random() * 100);
  const labels = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];
  const label = labels[Math.floor(score / 20)];
  return { score, label };
}

export async function getDigest() {
  await new Promise(resolve => setTimeout(resolve, 75));
  const items = [
    'Whales bought $200M BTC',
    'ETH CEX inflows up 15%',
    'USDT mints spiked to $500M',
    'Large SOL accumulation detected',
    'Stablecoin reserves hit ATH'
  ];
  
  return items.slice(0, 3).map((text, i) => ({
    id: `d${i + 1}`,
    text,
    direction: Math.random() > 0.5 ? 'buy' as const : 'sell' as const
  }));
}
