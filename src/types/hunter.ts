export interface Quest {
  id: string;
  protocol: string;
  network: string;
  rewardUSD: number;
  confidence: number;
  guardianScore: number;
  steps: number;
  estimatedTime: string;
  imageUrl?: string;
  category: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  isNew?: boolean;
  completionPercent?: number;
}

export interface HunterFilters {
  network: string;
  category: string;
  safety: string;
}

export interface ActionSummary {
  questId: string;
  steps: string[];
  fees: number;
  guardianVerified: boolean;
  estimatedTime: string;
}