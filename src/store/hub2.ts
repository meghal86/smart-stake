import { create } from "zustand";

type Filters = {
  chains: string[];
  assets: string[];
  sentimentMin?: number;
  riskMax?: number;
  window: '24h'|'7d'|'30d';
  realOnly: boolean | null; // null = both
  sort?: 'sentiment'|'risk'|'pressure'|'price';
};

type Hub2State = {
  filters: Filters;
  setFilters: (p: Partial<Filters>) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  watchlist: string[];
  addWatch: (id: string) => void;
  removeWatch: (id: string) => void;
};

export const useHub2 = create<Hub2State>((set,get)=>({
  filters: { chains:[], assets:[], window:'24h', realOnly: null },
  setFilters: (p)=>set({ filters: { ...get().filters, ...p }}),
  compare: [],
  toggleCompare: (id)=>set(s=>({ compare: s.compare.includes(id) ? s.compare.filter(x=>x!==id) : [...s.compare,id] })),
  watchlist: [],
  addWatch: (id)=>set(s=>({ watchlist: Array.from(new Set([...s.watchlist,id])) })),
  removeWatch: (id)=>set(s=>({ watchlist: s.watchlist.filter(x=>x!==id) })),
}));
