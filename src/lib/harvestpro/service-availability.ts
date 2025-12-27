/**
 * HarvestPro Service Availability Checker
 * 
 * Monitors external service availability and provides graceful degradation
 * when services are unavailable.
 * 
 * Requirements: Enhanced Req 15 AC2 (graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import { errorHandler } from '@/lib/ux/ErrorHandlingSystem';

export interface ServiceStatus {
  available: boolean;
  lastChecked: number;
  error?: string;
  fallbackData?: unknown;
}

export interface ServiceAvailabilityConfig {
  checkInterval: number; // milliseconds
  timeout: number; // milliseconds
  retryAttempts: number;
  enableFallback: boolean;
}

export enum HarvestProService {
  PRICE_ORACLE = 'price-oracle',
  GUARDIAN_API = 'guardian-api',
  GAS_ESTIMATION = 'gas-estimation',
  SLIPPAGE_ESTIMATION = 'slippage-estimation',
  WALLET_CONNECTION = 'wallet-connection',
  ACTION_ENGINE = 'action-engine',
  CEX_APIS = 'cex-apis'
}

/**
 * Service Availability Manager for HarvestPro
 * 
 * Monitors external services and provides fallback mechanisms
 * when services are unavailable.
 */
export class ServiceAvailabilityManager {
  private services: Map<HarvestProService, ServiceStatus> = new Map();
  private config: ServiceAvailabilityConfig;
  private checkIntervals: Map<HarvestProService, NodeJS.Timeout> = new Map();

  constructor(config: Partial<ServiceAvailabilityConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retryAttempts: 3,
      enableFallback: true,
      ...config
    };

    // Initialize all services as available
    Object.values(HarvestProService).forEach(service => {
      this.services.set(service, {
        available: true,
        lastChecked: Date.now()
      });
    });
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(service: HarvestProService): boolean {
    const status = this.services.get(service);
    return status?.available ?? false;
  }

  /**
   * Get service status
   */
  getServiceStatus(service: HarvestProService): ServiceStatus | null {
    return this.services.get(service) || null;
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses(): Record<HarvestProService, ServiceStatus> {
    const statuses: Record<string, ServiceStatus> = {};
    this.services.forEach((status, service) => {
      statuses[service] = status;
    });
    return statuses as Record<HarvestProService, ServiceStatus>;
  }

  /**
   * Manually check service availability
   */
  async checkServiceAvailability(service: HarvestProService): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const isAvailable = await this.performServiceCheck(service);
      const status: ServiceStatus = {
        available: isAvailable,
        lastChecked: Date.now(),
        error: isAvailable ? undefined : 'Service check failed'
      };
      
      this.services.set(service, status);
      return status;
    } catch (error) {
      const status: ServiceStatus = {
        available: false,
        lastChecked: Date.now(),
        error: (error as Error).message
      };
      
      this.services.set(service, status);
      
      // Log service unavailability
      errorHandler.handleApiError(error as Error, {
        component: 'service-availability',
        action: 'check-service',
        severity: this.getServiceCriticality(service)
      });
      
      return status;
    }
  }

  /**
   * Start monitoring a service
   */
  startMonitoring(service: HarvestProService): void {
    // Clear existing interval if any
    this.stopMonitoring(service);
    
    // Set up periodic checking
    const interval = setInterval(async () => {
      await this.checkServiceAvailability(service);
    }, this.config.checkInterval);
    
    this.checkIntervals.set(service, interval);
    
    // Perform initial check
    this.checkServiceAvailability(service);
  }

  /**
   * Stop monitoring a service
   */
  stopMonitoring(service: HarvestProService): void {
    const interval = this.checkIntervals.get(service);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(service);
    }
  }

  /**
   * Start monitoring all services
   */
  startMonitoringAll(): void {
    Object.values(HarvestProService).forEach(service => {
      this.startMonitoring(service);
    });
  }

  /**
   * Stop monitoring all services
   */
  stopMonitoringAll(): void {
    Object.values(HarvestProService).forEach(service => {
      this.stopMonitoring(service);
    });
  }

  /**
   * Get fallback data for a service
   */
  getFallbackData(service: HarvestProService): unknown {
    const status = this.services.get(service);
    if (status?.fallbackData) {
      return status.fallbackData;
    }
    
    return this.getDefaultFallbackData(service);
  }

  /**
   * Set fallback data for a service
   */
  setFallbackData(service: HarvestProService, data: unknown): void {
    const status = this.services.get(service);
    if (status) {
      this.services.set(service, {
        ...status,
        fallbackData: data
      });
    }
  }

  /**
   * Get service health summary
   */
  getHealthSummary(): {
    totalServices: number;
    availableServices: number;
    unavailableServices: number;
    criticalServicesDown: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  } {
    const statuses = Array.from(this.services.values());
    const totalServices = statuses.length;
    const availableServices = statuses.filter(s => s.available).length;
    const unavailableServices = totalServices - availableServices;
    
    // Count critical services that are down
    const criticalServicesDown = Array.from(this.services.entries())
      .filter(([service, status]) => 
        !status.available && this.isCriticalService(service)
      ).length;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (criticalServicesDown > 0) {
      overallHealth = 'critical';
    } else if (unavailableServices > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'healthy';
    }
    
    return {
      totalServices,
      availableServices,
      unavailableServices,
      criticalServicesDown,
      overallHealth
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoringAll();
    this.services.clear();
  }

  // Private methods

  private async performServiceCheck(service: HarvestProService): Promise<boolean> {
    switch (service) {
      case HarvestProService.PRICE_ORACLE:
        return this.checkPriceOracle();
      
      case HarvestProService.GUARDIAN_API:
        return this.checkGuardianAPI();
      
      case HarvestProService.GAS_ESTIMATION:
        return this.checkGasEstimation();
      
      case HarvestProService.SLIPPAGE_ESTIMATION:
        return this.checkSlippageEstimation();
      
      case HarvestProService.WALLET_CONNECTION:
        return this.checkWalletConnection();
      
      case HarvestProService.ACTION_ENGINE:
        return this.checkActionEngine();
      
      case HarvestProService.CEX_APIS:
        return this.checkCEXAPIs();
      
      default:
        return false;
    }
  }

  private async checkPriceOracle(): Promise<boolean> {
    try {
      // Simple health check - try to fetch ETH price
      const response = await fetch('/api/prices/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkGuardianAPI(): Promise<boolean> {
    try {
      const response = await fetch('/api/guardian/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkGasEstimation(): Promise<boolean> {
    try {
      const response = await fetch('/api/gas/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkSlippageEstimation(): Promise<boolean> {
    try {
      const response = await fetch('/api/slippage/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkWalletConnection(): Promise<boolean> {
    // Check if Web3 is available
    return typeof window !== 'undefined' && 
           (window.ethereum !== undefined || window.web3 !== undefined);
  }

  private async checkActionEngine(): Promise<boolean> {
    try {
      const response = await fetch('/api/action-engine/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkCEXAPIs(): Promise<boolean> {
    try {
      const response = await fetch('/api/cex/health', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private isCriticalService(service: HarvestProService): boolean {
    // Define which services are critical for core functionality
    const criticalServices = [
      HarvestProService.PRICE_ORACLE,
      HarvestProService.GUARDIAN_API,
      HarvestProService.WALLET_CONNECTION
    ];
    
    return criticalServices.includes(service);
  }

  private getServiceCriticality(service: HarvestProService) {
    return this.isCriticalService(service) ? 'high' : 'medium';
  }

  private getDefaultFallbackData(service: HarvestProService): unknown {
    switch (service) {
      case HarvestProService.PRICE_ORACLE:
        return {
          ETH: 2000,
          BTC: 40000,
          USDC: 1,
          timestamp: Date.now(),
          source: 'fallback'
        };
      
      case HarvestProService.GUARDIAN_API:
        return {
          score: 5.0,
          riskLevel: 'MEDIUM',
          timestamp: Date.now(),
          source: 'fallback'
        };
      
      case HarvestProService.GAS_ESTIMATION:
        return {
          gasPrice: 20, // gwei
          gasLimit: 21000,
          estimatedCost: 0.42, // USD
          timestamp: Date.now(),
          source: 'fallback'
        };
      
      case HarvestProService.SLIPPAGE_ESTIMATION:
        return {
          slippage: 0.5, // 0.5%
          priceImpact: 0.3,
          timestamp: Date.now(),
          source: 'fallback'
        };
      
      default:
        return null;
    }
  }
}

// Global service availability manager instance
export const serviceAvailability = new ServiceAvailabilityManager();

// Helper functions for common service checks

export const withServiceFallback = async <T>(
  service: HarvestProService,
  serviceCall: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    const result = await serviceCall();
    
    // Mark service as available on success
    serviceAvailability.services.set(service, {
      available: true,
      lastChecked: Date.now()
    });
    
    return result;
  } catch (error) {
    // Mark service as unavailable
    serviceAvailability.services.set(service, {
      available: false,
      lastChecked: Date.now(),
      error: (error as Error).message
    });
    
    // Try to get fallback data
    const fallback = fallbackData || serviceAvailability.getFallbackData(service);
    if (fallback) {
      return fallback as T;
    }
    
    throw error;
  }
};

export const isServiceHealthy = (service: HarvestProService): boolean => {
  return serviceAvailability.isServiceAvailable(service);
};

export const getServiceHealth = () => {
  return serviceAvailability.getHealthSummary();
};

// Type augmentation for Web3
declare global {
  interface Window {
    ethereum?: unknown;
    web3?: unknown;
  }
}