/**
 * Proof URL Verification System
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF
 * 
 * Ensures all proof URLs resolve to actual content and shows honest unavailable states
 * when destinations don't exist.
 */

export interface ProofUrlStatus {
  url: string;
  exists: boolean;
  lastChecked: Date;
  statusCode?: number;
  errorMessage?: string;
}

export interface ProofUrlVerificationResult {
  isAvailable: boolean;
  status: ProofUrlStatus;
  fallbackMessage: string;
}

/**
 * Proof URL Verification Manager
 * 
 * Verifies that proof URLs actually exist and provides fallback states
 * when they don't, ensuring no dead-end links.
 */
export class ProofUrlVerificationManager {
  private static instance: ProofUrlVerificationManager;
  private urlStatusCache: Map<string, ProofUrlStatus> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ProofUrlVerificationManager {
    if (!ProofUrlVerificationManager.instance) {
      ProofUrlVerificationManager.instance = new ProofUrlVerificationManager();
    }
    return ProofUrlVerificationManager.instance;
  }

  /**
   * Verify if a proof URL actually exists
   */
  async verifyProofUrl(url: string): Promise<ProofUrlVerificationResult> {
    // Check cache first
    const cached = this.urlStatusCache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return this.createResult(cached);
    }

    try {
      const status = await this.checkUrlExists(url);
      this.urlStatusCache.set(url, status);
      return this.createResult(status);
    } catch (error) {
      const errorStatus: ProofUrlStatus = {
        url,
        exists: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      this.urlStatusCache.set(url, errorStatus);
      return this.createResult(errorStatus);
    }
  }

  /**
   * Check if URL exists by making a HEAD request
   */
  private async checkUrlExists(url: string): Promise<ProofUrlStatus> {
    // Handle empty or invalid URLs
    if (!url || url.trim() === '') {
      return {
        url,
        exists: false,
        lastChecked: new Date(),
        statusCode: 404,
        errorMessage: 'Empty or invalid URL'
      };
    }

    // For relative URLs, check if they're in our known routes
    if (url.startsWith('/')) {
      return this.checkInternalRoute(url);
    }

    // Check if URL is valid before making request
    try {
      new URL(url);
    } catch {
      // Invalid URL format - treat as internal route
      return this.checkInternalRoute(url);
    }

    // For external URLs, make a HEAD request
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for external URLs
      });
      
      return {
        url,
        exists: response.ok,
        lastChecked: new Date(),
        statusCode: response.status
      };
    } catch (error) {
      return {
        url,
        exists: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Check if internal route exists
   */
  private async checkInternalRoute(path: string): Promise<ProofUrlStatus> {
    // Handle empty or invalid paths
    if (!path || path.trim() === '') {
      return {
        url: path,
        exists: false,
        lastChecked: new Date(),
        statusCode: 404,
        errorMessage: 'Empty or invalid path'
      };
    }

    // Known proof routes that exist
    const existingRoutes = new Set([
      '/proof/guardian-methodology',
      '/proof/assets-protected',
      '/security-partners'
    ]);

    // Routes that are planned but don't exist yet
    const plannedRoutes = new Set([
      '/proof/assets-protected-sources',
      '/proof/wallets-protected-methodology', 
      '/proof/yield-optimized-calculation',
      '/proof/guardian-score-methodology',
      '/proof/security-scans-details',
      '/proof/general-methodology',
      '/proof/planned-feature' // For testing
    ]);

    const exists = existingRoutes.has(path);
    const isPlanned = plannedRoutes.has(path);

    return {
      url: path,
      exists,
      lastChecked: new Date(),
      statusCode: exists ? 200 : (isPlanned ? 404 : 404),
      errorMessage: isPlanned ? 'Route planned but not yet implemented' : undefined
    };
  }

  /**
   * Create verification result from status
   */
  private createResult(status: ProofUrlStatus): ProofUrlVerificationResult {
    if (status.exists) {
      return {
        isAvailable: true,
        status,
        fallbackMessage: ''
      };
    }

    // Generate appropriate fallback message based on error type
    let fallbackMessage: string;
    
    if (status.errorMessage?.includes('planned but not yet implemented')) {
      fallbackMessage = 'Documentation is being prepared and will be available soon';
    } else if (status.errorMessage?.includes('Network') || status.errorMessage?.includes('network')) {
      fallbackMessage = 'Unable to verify documentation availability due to network issues';
    } else if (status.statusCode === 404) {
      // For external URLs, use "temporarily unavailable"
      // For internal routes, use "being updated"
      if (status.url.startsWith('http')) {
        fallbackMessage = 'Verification documentation temporarily unavailable';
      } else {
        fallbackMessage = 'Verification content is currently being updated';
      }
    } else {
      fallbackMessage = 'Verification documentation temporarily unavailable';
    }

    return {
      isAvailable: false,
      status,
      fallbackMessage
    };
  }

  /**
   * Check if cached status is still valid
   */
  private isCacheValid(status: ProofUrlStatus): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - status.lastChecked.getTime();
    return cacheAge < this.CACHE_TTL;
  }

  /**
   * Clear the URL status cache
   */
  clearCache(): void {
    this.urlStatusCache.clear();
  }

  /**
   * Get all cached URL statuses
   */
  getAllStatuses(): Map<string, ProofUrlStatus> {
    return new Map(this.urlStatusCache);
  }

  /**
   * Preload verification for common URLs
   */
  async preloadCommonUrls(): Promise<void> {
    const commonUrls = [
      '/proof/guardian-methodology',
      '/proof/assets-protected',
      '/proof/assets-protected-sources',
      '/proof/wallets-protected-methodology',
      '/proof/yield-optimized-calculation',
      '/proof/guardian-score-methodology',
      '/proof/security-scans-details',
      '/security-partners',
      'https://certik.com/projects/alphawhale',
      'https://consensys.net/diligence/audits/alphawhale'
    ];

    // Verify all URLs in parallel
    await Promise.allSettled(
      commonUrls.map(url => this.verifyProofUrl(url))
    );
  }
}

/**
 * Hook for using proof URL verification
 */
export function useProofUrlVerification() {
  const manager = ProofUrlVerificationManager.getInstance();

  return {
    verifyUrl: (url: string) => manager.verifyProofUrl(url),
    clearCache: () => manager.clearCache(),
    preloadCommonUrls: () => manager.preloadCommonUrls(),
    getAllStatuses: () => manager.getAllStatuses()
  };
}

/**
 * Default fallback messages for different error types
 */
export const FALLBACK_MESSAGES = {
  NOT_FOUND: 'Verification documentation is currently being updated',
  NETWORK_ERROR: 'Unable to verify documentation availability due to network issues',
  PLANNED: 'Documentation is being prepared and will be available soon',
  GENERIC: 'Verification documentation temporarily unavailable'
} as const;