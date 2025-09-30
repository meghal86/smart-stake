// Shared Cluster Store for Filter Coherence
import { createContext, useContext, useState, ReactNode } from 'react';
import { Window } from '@/types/cluster';

interface ClusterStore {
  timeWindow: Window;
  chain: string;
  minValueUSD: number;
  selectedCluster: string | null;
  selectedAlert: string | null;
  
  setTimeWindow: (window: Window) => void;
  setChain: (chain: string) => void;
  setMinValueUSD: (value: number) => void;
  setSelectedCluster: (clusterId: string | null) => void;
  setSelectedAlert: (alertId: string | null) => void;
  
  // Deep link support
  applyDeepLink: (clusterId?: string, alertId?: string) => void;
}

const ClusterContext = createContext<ClusterStore | null>(null);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [timeWindow, setTimeWindow] = useState<Window>('24h');
  const [chain, setChain] = useState('All');
  const [minValueUSD, setMinValueUSD] = useState(1000000);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  
  const applyDeepLink = (clusterId?: string, alertId?: string) => {
    setSelectedCluster(clusterId || null);
    setSelectedAlert(alertId || null);
    
    // Highlight elements for 2 seconds
    if (clusterId || alertId) {
      setTimeout(() => {
        const clusterEl = document.querySelector(`[data-cluster-id="${clusterId}"]`);
        const alertEl = document.querySelector(`[data-alert-id="${alertId}"]`);
        
        [clusterEl, alertEl].forEach(el => {
          if (el) {
            el.classList.add('ring-2', 'ring-primary', 'animate-pulse');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-primary', 'animate-pulse');
            }, 2000);
          }
        });
      }, 100);
    }
  };
  
  return (
    <ClusterContext.Provider value={{
      timeWindow,
      chain,
      minValueUSD,
      selectedCluster,
      selectedAlert,
      setTimeWindow,
      setChain,
      setMinValueUSD,
      setSelectedCluster,
      setSelectedAlert,
      applyDeepLink
    }}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusterStore() {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useClusterStore must be used within ClusterProvider');
  }
  return context;
}