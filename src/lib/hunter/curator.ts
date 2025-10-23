import type { Opportunity } from './types';

export interface CurateFilters {
  showExpired?: boolean;
  types?: string[];
  chains?: string[];
  difficulty?: string[];
  onlyVerified?: boolean;
  search?: string;
  sort?: 'best'|'ending'|'highest'|'newest';
  page?: number;
  pageSize?: number;
}

export interface UserContext {
  completedIds?: Set<string>;
  favoriteChains?: Set<string>;
  tier?: 'free'|'pro'|'premium';
}

export function curateOpportunities(
  all: Opportunity[],
  filters: CurateFilters = {},
  userCtx: UserContext = {}
) {
  let list = [...all];

  // Filter
  if (!filters.showExpired) list = list.filter(o => !o.end_date || new Date(o.end_date) > new Date());
  if (filters.types?.length) list = list.filter(o => filters.types!.includes(o.type));
  if (filters.chains?.length) list = list.filter(o => o.chains.some(c => filters.chains!.includes(c)));
  if (filters.difficulty?.length) list = list.filter(o => filters.difficulty!.includes(o.difficulty));
  if (filters.onlyVerified) list = list.filter(o => o.is_verified);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(o => o.title.toLowerCase().includes(q) || o.protocol.toLowerCase().includes(q) || (o.tags||[]).some(t=>t.toLowerCase().includes(q)));
  }

  // Personalize: hide completed
  if (userCtx.completedIds?.size) list = list.filter(o => !userCtx.completedIds!.has(o.id));

  // Sort
  list.sort((a, b) => {
    const valueA = score(a);
    const valueB = score(b);
    const endA = a.end_date ? new Date(a.end_date).getTime() : Number.MAX_SAFE_INTEGER;
    const endB = b.end_date ? new Date(b.end_date).getTime() : Number.MAX_SAFE_INTEGER;
    const createdA = new Date(a.created_at).getTime();
    const createdB = new Date(b.created_at).getTime();

    switch (filters.sort) {
      case 'ending':
        return endA - endB;
      case 'highest':
        return (b.reward_max ?? 0) - (a.reward_max ?? 0);
      case 'newest':
        return createdB - createdA;
      case 'best':
      default:
        return valueB - valueA;
    }
  });

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? (userCtx.tier === 'free' ? 5 : 20)));
  const total = list.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = list.slice(start, end);

  return { items: pageItems, total, page, hasMore: end < total };
}

function score(o: Opportunity) {
  const reward = (o.reward_min ?? 0) + (o.reward_max ?? 0);
  const urgencyBoost = o.urgency === 'high' ? 10 : o.urgency === 'medium' ? 5 : 0;
  const trust = o.trust_score || 0;
  const freshness = (Date.now() - new Date(o.created_at).getTime()) < 3*24*60*60*1000 ? 5 : 0;
  return reward + urgencyBoost + trust/5 + freshness;
}
