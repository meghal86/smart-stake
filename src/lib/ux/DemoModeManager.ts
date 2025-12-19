/**
 * Demo Mode Manager
 * 
 * Manages automatic switching between demo and live modes based on wallet connection
 * and data source availability. Provides centralized demo mode state management.
 * 
 * Requirements: R3.DEMO.BANNER_PERSISTENT, R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.AUTO_SWITCHING
 */

import React from 'react';
import { useHomeAuth } from '@/lib/context/HomeAuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface DataSourceStatus {
  gasOracle: boolean;
  coreAPI: boolean;
  moduleAPIs: {
    guardian: boolean;
    hunter: boolean;
    harvestpro: boolean;
  };
  overall: boolean;
}

export interface DemoModeState {
  isDemo: boolean;
  reason: 'wallet_not_connected' | 'data_sources_unavailable' | 'user_preference' | 'live_mode';
  bannerVisible: boolean;
  dataSourceStatus: DataSourceStatus;
}

/**
 * Demo Mode Manager Class
 * 
 * Provides centralized demo mode management with automatic switching
 * based on wallet connection and data source availability.
 */
export class DemoModeManager {
  private static instance: DemoModeManager | null = null;
  private listeners: Set<(state: DemoModeState) => void> = new Set();
  private currentState: DemoModeState = {
    isDemo: true,
    reason: 'wallet_not_connected',
    bannerVisible: true,
    dataSourceStatus: {
      gasOracle: false,
      coreAPI: false,
      moduleAPIs: {
        guardian: false,
        hunter: false,
        harvestpro: false
      },
      overall: false
    }
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of DemoModeManager
   */
  public static getInstance(): DemoModeManager {
    if (!DemoModeManager.instance) {
      DemoModeManager.instance = new DemoModeManager();
    }
    return DemoModeManager.instance;
  }

  /**
   * Subscribe to demo mode state changes
   */
  public subscribe(listener: (state: DemoModeState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call listener with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current demo mode state
   */
  public getCurrentState(): DemoModeState {
    return { ...this.currentState };
  }

  /**
   * Check if currently in demo mode
   */
  public isDemo(): boolean {
    return this.currentState.isDemo;
  }

  /**
   * Check if demo banner should be visible
   */
  public shouldShowBanner(): boolean {
    return this.currentState.bannerVisible;
  }

  /**
   * Validate data source availability
   */
  public async validateDataSources(): Promise<DataSourceStatus> {
    const status: DataSourceStatus = {
      gasOracle: false,
      coreAPI: false,
      moduleAPIs: {
        guardian: false,
        hunter: false,
        harvestpro: false
      },
      overall: false
    };

    try {
      // Test gas oracle (using same endpoint as useNetworkStatus)
      const gasResponse = await fetch('https://eth.llamarpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      
      if (gasResponse.ok) {
        const gasData = await gasResponse.json();
        status.gasOracle = !!gasData.result;
      }
    } catch (error) {
      console.warn('Gas oracle validation failed:', error);
      status.gasOracle = false;
    }

    try {
      // Test core API
      const coreResponse = await fetch('/api/home-metrics', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      
      status.coreAPI = coreResponse.ok;
    } catch (error) {
      console.warn('Core API validation failed:', error);
      status.coreAPI = false;
    }

    try {
      // Test Guardian API (check if endpoint exists)
      const guardianResponse = await fetch('/api/guardian/status', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      
      status.moduleAPIs.guardian = guardianResponse.ok || guardianResponse.status === 401; // 401 means API exists but needs auth
    } catch (error) {
      status.moduleAPIs.guardian = false;
    }

    try {
      // Test Hunter API (check if endpoint exists)
      const hunterResponse = await fetch('/api/hunter/opportunities', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      
      status.moduleAPIs.hunter = hunterResponse.ok || hunterResponse.status === 401; // 401 means API exists but needs auth
    } catch (error) {
      status.moduleAPIs.hunter = false;
    }

    try {
      // Test HarvestPro API (check if endpoint exists)
      const harvestResponse = await fetch('/api/harvest/opportunities', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // 3s timeout
      });
      
      status.moduleAPIs.harvestpro = harvestResponse.ok || harvestResponse.status === 401; // 401 means API exists but needs auth
    } catch (error) {
      status.moduleAPIs.harvestpro = false;
    }

    // Overall status: gas oracle + core API + at least one module API
    status.overall = (
      status.gasOracle &&
      status.coreAPI &&
      (status.moduleAPIs.guardian || status.moduleAPIs.hunter || status.moduleAPIs.harvestpro)
    );

    return status;
  }

  /**
   * Update demo mode state based on wallet connection and data sources
   */
  public async updateDemoMode(isWalletConnected: boolean, forceDemo?: boolean): Promise<void> {
    let newState: DemoModeState;

    if (forceDemo === true) {
      // User explicitly requested demo mode
      newState = {
        isDemo: true,
        reason: 'user_preference',
        bannerVisible: true,
        dataSourceStatus: this.currentState.dataSourceStatus
      };
    } else if (!isWalletConnected) {
      // Wallet not connected - always demo mode
      newState = {
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: this.currentState.dataSourceStatus
      };
    } else {
      // Wallet connected - check data sources
      const dataSourceStatus = await this.validateDataSources();
      
      if (dataSourceStatus.overall) {
        // All prerequisites met - live mode
        newState = {
          isDemo: false,
          reason: 'live_mode',
          bannerVisible: false,
          dataSourceStatus
        };
      } else {
        // Data sources not ready - demo mode
        newState = {
          isDemo: true,
          reason: 'data_sources_unavailable',
          bannerVisible: true,
          dataSourceStatus
        };
      }
    }

    // Update state if changed
    if (JSON.stringify(newState) !== JSON.stringify(this.currentState)) {
      this.currentState = newState;
      this.notifyListeners();
    }
  }

  /**
   * Force demo mode (for testing or user preference)
   */
  public setDemoMode(isDemo: boolean): void {
    const newState: DemoModeState = {
      ...this.currentState,
      isDemo,
      reason: isDemo ? 'user_preference' : 'live_mode',
      bannerVisible: isDemo
    };

    this.currentState = newState;
    this.notifyListeners();
  }

  /**
   * Get demo banner message based on current state
   */
  public getBannerMessage(): string {
    switch (this.currentState.reason) {
      case 'wallet_not_connected':
        return 'Demo Mode — Data is simulated';
      case 'data_sources_unavailable':
        return 'Demo Mode — Live data temporarily unavailable';
      case 'user_preference':
        return 'Demo Mode — Data is simulated';
      default:
        return '';
    }
  }

  /**
   * Get demo banner CTA text
   */
  public getBannerCTA(): string {
    switch (this.currentState.reason) {
      case 'wallet_not_connected':
        return 'Connect Wallet for Live Data';
      case 'data_sources_unavailable':
        return 'Retry Live Data';
      case 'user_preference':
        return 'Switch to Live Data';
      default:
        return '';
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in demo mode listener:', error);
      }
    });
  }

  /**
   * Reset to initial state (for testing)
   */
  public reset(): void {
    this.currentState = {
      isDemo: true,
      reason: 'wallet_not_connected',
      bannerVisible: true,
      dataSourceStatus: {
        gasOracle: false,
        coreAPI: false,
        moduleAPIs: {
          guardian: false,
          hunter: false,
          harvestpro: false
        },
        overall: false
      }
    };
    this.notifyListeners();
  }
}

/**
 * React hook for demo mode management
 */
export function useDemoMode() {
  const { isAuthenticated } = useHomeAuth();
  const { data: networkStatus } = useNetworkStatus();
  const [demoState, setDemoState] = React.useState<DemoModeState>(() => 
    DemoModeManager.getInstance().getCurrentState()
  );

  React.useEffect(() => {
    const manager = DemoModeManager.getInstance();
    
    // Subscribe to demo mode changes
    const unsubscribe = manager.subscribe(setDemoState);
    
    // Update demo mode based on wallet connection
    manager.updateDemoMode(isAuthenticated);
    
    return unsubscribe;
  }, [isAuthenticated]);

  const manager = DemoModeManager.getInstance();

  return {
    isDemo: demoState.isDemo,
    reason: demoState.reason,
    bannerVisible: demoState.bannerVisible,
    dataSourceStatus: demoState.dataSourceStatus,
    bannerMessage: manager.getBannerMessage(),
    bannerCTA: manager.getBannerCTA(),
    setDemoMode: manager.setDemoMode.bind(manager),
    refreshDataSources: () => manager.updateDemoMode(isAuthenticated),
  };
}

// Export singleton instance for direct access
export const demoModeManager = DemoModeManager.getInstance();