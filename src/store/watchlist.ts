import { create } from 'zustand';
import { WatchItem, WatchEntityType } from '@/types/hub2';

interface WatchlistState {
  items: WatchItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setItems: (items: WatchItem[]) => void;
  addItem: (item: WatchItem) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Helpers
  isWatched: (entityType: WatchEntityType, entityId: string) => boolean;
  getWatchItem: (entityType: WatchEntityType, entityId: string) => WatchItem | null;
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(item => item.id !== id) 
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  isWatched: (entityType, entityId) => {
    const { items } = get();
    return items.some(item => 
      item.entityType === entityType && item.entityId === entityId
    );
  },
  
  getWatchItem: (entityType, entityId) => {
    const { items } = get();
    return items.find(item => 
      item.entityType === entityType && item.entityId === entityId
    ) || null;
  }
}));
