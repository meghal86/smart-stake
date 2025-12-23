/**
 * Network Status Manager
 * 
 * Handles network connectivity issues, offline mode, and cached data display.
 * Provides graceful degradation when external services are unavailable.
 * 
 * Requirements: R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES
 */

import { errorHandler } from './ErrorHandlingSystem';
import { ERROR_MESSAGES, INFO_MESSAGES } from '@/lib/constants/errorMessages';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  lastOnlineTime: Date | null;
  connectionType: string;
  effectiveType: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  stale: boolean;
}

export interface NetworkStatusManagerConfig {
  enableOfflineMode: boolean;
  slowConnectionThreshold: number; // in ms
  cacheDefaultTTL: number; // in ms
  maxCacheSize: number;
  enableTelemetry: boolean;
}

/**
 * Network Status Manager
 * 
 * Monitors network connectivity and manages cached data for offline access.
 */
export class NetworkStatusManager {
  private config: NetworkStatusManagerConfig;
  private status: NetworkStatus;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private slowConnectionTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<NetworkStatusManagerConfig> = {}) {
    this.config = {
      enableOfflineMode: true,
      slowConnectionThreshold: 5000,
      cacheDefaultTTL: 300000, // 5 minutes
      maxCacheSize: 100,
      enableTelemetry: true,
      ...config
    };

    this.status = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSlowConnection: false,
      lastOnlineTime: new Date(),
      connectionType: 'unknown',
      effectiveType: 'unknown'
    };

    this.initializeNetworkMonitoring();
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cache data with TTL
   */
  cacheData<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.config.cacheDefaultTTL,
      stale: false
    };

    this.cache.set(key, entry);
  }

  /**
   * Get cached data if available
   */
  getCachedData<T>(key: string): {
    data: T | null;
    isStale: boolean;
    age: number;
  } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { data: null, isStale: false, age: 0 };
    }

    const age = Date.now() - entry.timestamp.getTime();
    const isExpired = age > entry.ttl;
    const isStale = age > entry.ttl * 0.8; // Consider stale at 80% of TTL

    if (isExpired) {
      this.cache.delete(key);
      return { data: null, isStale: false, age };
    }

    return {
      data: entry.data,
      isStale,
      age
    };
  }

  /**
   * Check if we have cached data for a key
   */
  hasCachedData(key: string): boolean {
    const cached = this.getCachedData(key);
    return cached.data !== null;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp.getTime();
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Make a network request with automatic caching and fallback
   */
  async fetchWithFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      allowStale?: boolean;
      timeout?: number;
    } = {}
  ): Promise<{
    data: T;
    fromCache: boolean;
    isStale: boolean;
    networkError?: Error;
  }> {
    const { ttl, allowStale = true, timeout = this.config.slowConnectionThreshold } = options;

    // If offline, return cached data immediately
    if (!this.status.isOnline) {
      const cached = this.getCachedData<T>(key);
      if (cached.data) {
        return {
          data: cached.data,
          fromCache: true,
          isStale: cached.isStale
        };
      }
      throw new Error(ERROR_MESSAGES.NETWORK_OFFLINE);
    }

    try {
      // Set up timeout for slow connection detection
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.slowConnectionTimeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeout);
      });

      // Race between fetch and timeout
      const data = await Promise.race([fetchFn(), timeoutPromise]);
      
      // Clear timeout if request completed
      if (this.slowConnectionTimeout) {
        clearTimeout(this.slowConnectionTimeout);
        this.slowConnectionTimeout = null;
      }

      // Cache successful response
      this.cacheData(key, data, ttl);

      return {
        data,
        fromCache: false,
        isStale: false
      };

    } catch (error) {
      // Clear timeout
      if (this.slowConnectionTimeout) {
        clearTimeout(this.slowConnectionTimeout);
        this.slowConnectionTimeout = null;
      }

      // Handle network error - try to return cached data
      const cached = this.getCachedData<T>(key);
      
      if (cached.data && (allowStale || !cached.isStale)) {
        // Log that we're using cached data due to network error
        this.logNetworkEvent('fallback_to_cache', {
          key,
          error: (error as Error).message,
          cacheAge: cached.age
        });

        return {
          data: cached.data,
          fromCache: true,
          isStale: cached.isStale,
          networkError: error as Error
        };
      }

      // No cached data available, throw the network error
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      isStale: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = now - entry.timestamp.getTime();
      return {
        key,
        age,
        ttl: entry.ttl,
        isStale: age > entry.ttl * 0.8
      };
    });

    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      entries
    };
  }

  /**
   * Test network connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    if (this.slowConnectionTimeout) {
      clearTimeout(this.slowConnectionTimeout);
    }

    this.listeners.clear();
    this.cache.clear();
  }

  // Private methods

  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Get connection information if available
    this.updateConnectionInfo();

    // Periodically check connection quality
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, 30000); // Check every 30 seconds

    // Clean up cache periodically
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Clean every minute
  }

  private handleOnline = (): void => {
    const wasOffline = !this.status.isOnline;
    
    this.status.isOnline = true;
    this.status.lastOnlineTime = new Date();
    
    if (wasOffline) {
      this.logNetworkEvent('connection_restored');
      this.notifyListeners();
    }
  };

  private handleOffline = (): void => {
    this.status.isOnline = false;
    this.logNetworkEvent('connection_lost');
    this.notifyListeners();
  };

  private updateConnectionInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.status.connectionType = connection.type || 'unknown';
      this.status.effectiveType = connection.effectiveType || 'unknown';
    }
  }

  private async checkConnectionQuality(): void {
    if (!this.status.isOnline) return;

    const startTime = Date.now();
    const isConnected = await this.testConnectivity();
    const duration = Date.now() - startTime;

    const wasSlowConnection = this.status.isSlowConnection;
    this.status.isSlowConnection = duration > this.config.slowConnectionThreshold;

    if (!isConnected) {
      this.status.isOnline = false;
      this.logNetworkEvent('connection_lost');
      this.notifyListeners();
    } else if (this.status.isSlowConnection !== wasSlowConnection) {
      this.logNetworkEvent(
        this.status.isSlowConnection ? 'slow_connection_detected' : 'connection_improved',
        { duration }
      );
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getStatus());
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  private logNetworkEvent(event: string, data?: Record<string, any>): void {
    if (!this.config.enableTelemetry) return;

    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      status: this.status,
      ...data
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Network event:', eventData);
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'network_status', {
        event_category: 'network',
        event_label: event,
        custom_map: eventData
      });
    }
  }
}

// Global network status manager instance
export const networkManager = new NetworkStatusManager();

// Helper hook for React components
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState<NetworkStatus>(networkManager.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkManager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

// Helper function for making network requests with automatic fallback
export const fetchWithCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    ttl?: number;
    allowStale?: boolean;
    timeout?: number;
  }
) => {
  return networkManager.fetchWithFallback(key, fetchFn, options);
};

// React import for the hook
import React from 'react';