export type OppType = 'airdrop'|'quest'|'staking'|'yield';

export interface Opportunity {
  id: string; slug: string; title: string; protocol: string; type: OppType;
  chains: string[];
  reward_min?: number; reward_max?: number; reward_currency: 'USD'|'ETH'|'POINTS'; reward_confidence: 'confirmed'|'estimated'|'speculative';
  difficulty: 'easy'|'medium'|'hard'; time_required?: string;
  trust_score: number; is_verified: boolean; audited: boolean;
  start_date: string; end_date?: string|null; urgency: 'high'|'medium'|'low';
  requirements: {
    chains: string[];
    minBalance?: { amount: number; token: string };
    walletAge?: number; previousTxCount?: number;
  };
  steps: {
    order: number; title: string; description: string; action: 'visit'|'connect'|'transaction'|'social'|'verify'; actionUrl?: string; estimatedTime?: string;
  }[];
  category: string[]; tags: string[]; featured: boolean;
  participants?: number; apr?: number; apy?: number; tvl_usd?: number;
  thumbnail?: string; banner?: string; protocol_logo?: string;
  source: string; source_ref?: string; protocol_address?: string;
  created_at: string; updated_at: string;
}

export function isExpired(o: Opportunity) { return !!o.end_date && new Date(o.end_date) < new Date(); }
export function calculateValue(o: Opportunity) {
  const reward = (o.reward_min ?? 0) + (o.reward_max ?? 0);
  const time = o.time_required?.includes('hour') ? 60 : (o.time_required?.includes('min') ? parseInt(o.time_required,10) || 15 : 60);
  return time > 0 ? reward / time : reward;
}

