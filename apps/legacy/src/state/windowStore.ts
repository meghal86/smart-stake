import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimeWindow = '24h' | '7d' | '30d';

interface WindowState {
  window: TimeWindow;
  setWindow: (window: TimeWindow) => void;
  lastUpdated: string | null;
  setLastUpdated: (timestamp: string) => void;
}

export const useWindowStore = create<WindowState>()(
  persist(
    (set) => ({
      window: '24h',
      setWindow: (window) => set({ window }),
      lastUpdated: null,
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
    }),
    {
      name: 'whale-window-store',
      partialize: (state) => ({ window: state.window }),
    }
  )
);

// Hook for components
export const useTimeWindow = () => {
  const { window, setWindow } = useWindowStore();
  return { window, setWindow };
};

// Hook for last updated
export const useLastUpdated = () => {
  const { lastUpdated, setLastUpdated } = useWindowStore();
  return { lastUpdated, setLastUpdated };
};