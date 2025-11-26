/**
 * HarvestPro Filter Store
 * Manages filter state with Zustand, URL persistence, and localStorage caching
 */

import { create } from 'zustand';
import type {
  FilterState,
  RiskLevel,
  SortOption,
  HoldingPeriodFilter,
  LiquidityFilter,
  GasEfficiencyGrade,
} from '@/types/harvestpro';

const LS_KEY = 'harvestpro.filters';

// Default filter state
const DEFAULT_FILTERS: FilterState = {
  search: '',
  types: [],
  wallets: [],
  riskLevels: [],
  minBenefit: 0,
  holdingPeriod: 'all',
  gasEfficiency: 'all',
  liquidity: 'all',
  sort: 'net-benefit-desc',
};

interface FilterActions {
  // Basic setters
  setSearch: (search: string) => void;
  setTypes: (types: FilterState['types']) => void;
  setWallets: (wallets: string[]) => void;
  setRiskLevels: (riskLevels: RiskLevel[]) => void;
  setMinBenefit: (minBenefit: number) => void;
  setHoldingPeriod: (holdingPeriod: HoldingPeriodFilter) => void;
  setGasEfficiency: (gasEfficiency: GasEfficiencyGrade | 'all') => void;
  setLiquidity: (liquidity: LiquidityFilter) => void;
  setSort: (sort: SortOption) => void;

  // Bulk operations
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearFilters: () => void;

  // Toggle operations
  toggleRiskLevel: (riskLevel: RiskLevel) => void;
  toggleWallet: (wallet: string) => void;
  toggleType: (type: FilterState['types'][number]) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  loadFromURL: (searchParams: URLSearchParams) => void;
  toURLSearchParams: () => URLSearchParams;
}

export const useHarvestFilterStore = create<FilterState & FilterActions>((set, get) => ({
  // Initial state
  ...DEFAULT_FILTERS,

  // Basic setters
  setSearch: (search) => {
    set({ search });
    get().saveToLocalStorage();
  },

  setTypes: (types) => {
    set({ types });
    get().saveToLocalStorage();
  },

  setWallets: (wallets) => {
    set({ wallets });
    get().saveToLocalStorage();
  },

  setRiskLevels: (riskLevels) => {
    set({ riskLevels });
    get().saveToLocalStorage();
  },

  setMinBenefit: (minBenefit) => {
    set({ minBenefit });
    get().saveToLocalStorage();
  },

  setHoldingPeriod: (holdingPeriod) => {
    set({ holdingPeriod });
    get().saveToLocalStorage();
  },

  setGasEfficiency: (gasEfficiency) => {
    set({ gasEfficiency });
    get().saveToLocalStorage();
  },

  setLiquidity: (liquidity) => {
    set({ liquidity });
    get().saveToLocalStorage();
  },

  setSort: (sort) => {
    set({ sort });
    get().saveToLocalStorage();
  },

  // Bulk operations
  setFilters: (filters) => {
    set((state) => ({ ...state, ...filters }));
    get().saveToLocalStorage();
  },

  resetFilters: () => {
    set(DEFAULT_FILTERS);
    get().saveToLocalStorage();
  },

  clearFilters: () => {
    set(DEFAULT_FILTERS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_KEY);
    }
  },

  // Toggle operations
  toggleRiskLevel: (riskLevel) => {
    set((state) => {
      const riskLevels = state.riskLevels.includes(riskLevel)
        ? state.riskLevels.filter((r) => r !== riskLevel)
        : [...state.riskLevels, riskLevel];
      return { riskLevels };
    });
    get().saveToLocalStorage();
  },

  toggleWallet: (wallet) => {
    set((state) => {
      const wallets = state.wallets.includes(wallet)
        ? state.wallets.filter((w) => w !== wallet)
        : [...state.wallets, wallet];
      return { wallets };
    });
    get().saveToLocalStorage();
  },

  toggleType: (type) => {
    set((state) => {
      const types = state.types.includes(type)
        ? state.types.filter((t) => t !== type)
        : [...state.types, type];
      return { types };
    });
    get().saveToLocalStorage();
  },

  // Persistence
  saveToLocalStorage: () => {
    if (typeof window === 'undefined') return;

    const state = get();
    const filterState: FilterState = {
      search: state.search,
      types: state.types,
      wallets: state.wallets,
      riskLevels: state.riskLevels,
      minBenefit: state.minBenefit,
      holdingPeriod: state.holdingPeriod,
      gasEfficiency: state.gasEfficiency,
      liquidity: state.liquidity,
      sort: state.sort,
    };

    try {
      localStorage.setItem(LS_KEY, JSON.stringify(filterState));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FilterState;
        set(parsed);
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
  },

  loadFromURL: (searchParams) => {
    const filters: Partial<FilterState> = {};

    // Parse search
    const search = searchParams.get('search');
    if (search) filters.search = search;

    // Parse types
    const types = searchParams.get('types');
    if (types) {
      filters.types = types.split(',').filter((t): t is FilterState['types'][number] =>
        ['harvest', 'loss-lot', 'cex-position'].includes(t)
      );
    }

    // Parse wallets
    const wallets = searchParams.get('wallets');
    if (wallets) filters.wallets = wallets.split(',');

    // Parse risk levels
    const riskLevels = searchParams.get('riskLevels');
    if (riskLevels) {
      filters.riskLevels = riskLevels.split(',').filter((r): r is RiskLevel =>
        ['LOW', 'MEDIUM', 'HIGH'].includes(r)
      );
    }

    // Parse minBenefit
    const minBenefit = searchParams.get('minBenefit');
    if (minBenefit) {
      const parsed = parseFloat(minBenefit);
      if (!isNaN(parsed)) filters.minBenefit = parsed;
    }

    // Parse holdingPeriod
    const holdingPeriod = searchParams.get('holdingPeriod');
    if (holdingPeriod && ['short-term', 'long-term', 'all'].includes(holdingPeriod)) {
      filters.holdingPeriod = holdingPeriod as HoldingPeriodFilter;
    }

    // Parse gasEfficiency
    const gasEfficiency = searchParams.get('gasEfficiency');
    if (gasEfficiency && ['A', 'B', 'C', 'all'].includes(gasEfficiency)) {
      filters.gasEfficiency = gasEfficiency as GasEfficiencyGrade | 'all';
    }

    // Parse liquidity
    const liquidity = searchParams.get('liquidity');
    if (liquidity && ['high', 'medium', 'low', 'all'].includes(liquidity)) {
      filters.liquidity = liquidity as LiquidityFilter;
    }

    // Parse sort
    const sort = searchParams.get('sort');
    if (
      sort &&
      [
        'net-benefit-desc',
        'loss-amount-desc',
        'guardian-score-desc',
        'gas-efficiency-asc',
        'newest',
      ].includes(sort)
    ) {
      filters.sort = sort as SortOption;
    }

    if (Object.keys(filters).length > 0) {
      set((state) => ({ ...state, ...filters }));
    }
  },

  toURLSearchParams: () => {
    const state = get();
    const params = new URLSearchParams();

    if (state.search) params.set('search', state.search);
    if (state.types.length > 0) params.set('types', state.types.join(','));
    if (state.wallets.length > 0) params.set('wallets', state.wallets.join(','));
    if (state.riskLevels.length > 0) params.set('riskLevels', state.riskLevels.join(','));
    if (state.minBenefit > 0) params.set('minBenefit', state.minBenefit.toString());
    if (state.holdingPeriod !== 'all') params.set('holdingPeriod', state.holdingPeriod);
    if (state.gasEfficiency !== 'all') params.set('gasEfficiency', state.gasEfficiency);
    if (state.liquidity !== 'all') params.set('liquidity', state.liquidity);
    if (state.sort !== 'net-benefit-desc') params.set('sort', state.sort);

    return params;
  },
}));
