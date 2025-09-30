import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIMode } from '@/types/hub2';

interface UIModeState {
  mode: UIMode['mode'];
  density: UIMode['density'];
  setMode: (mode: UIMode['mode']) => void;
  setDensity: (density: UIMode['density']) => void;
  toggleMode: () => void;
}

export const useUIMode = create<UIModeState>()(
  persist(
    (set, get) => ({
      mode: 'novice',
      density: 'simplified',
      
      setMode: (mode) => {
        set({ 
          mode,
          density: mode === 'novice' ? 'simplified' : 'full'
        });
      },
      
      setDensity: (density) => set({ density }),
      
      toggleMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'novice' ? 'pro' : 'novice';
        set({ 
          mode: newMode,
          density: newMode === 'novice' ? 'simplified' : 'full'
        });
      }
    }),
    {
      name: 'hub2-ui-mode-storage',
      getStorage: () => localStorage,
    }
  )
);
