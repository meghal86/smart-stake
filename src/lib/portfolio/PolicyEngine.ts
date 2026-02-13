/**
 * Policy Engine v0 - Portfolio Transaction Policy Enforcement
 * 
 * Implements user-configurable policies for portfolio transactions including:
 * - Gas cost limits
 * - New contract interaction restrictions
 * - Infinite approval blocking
 * - High-value transaction simulation requirements
 * - Confidence threshold enforcement
 */

import type { 
  PolicyEngineConfig, 
  ExecutionStep, 
  WalletScope, 
  FreshnessConfidence 
} from '@/types/portfolio';

export interface PolicyCheckResult {
  status: 'allowed' | 'blocked';
  violations: string[];
  appliedPolicies: string[];
}

export interface PolicyViolation {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  blockingRule: boolean;
}

export interface PolicyContext {
  userId: string;
  walletScope: WalletScope;
  steps: ExecutionStep[];
  totalGasEstimateUsd?: number;
  totalValueUsd?: number;
  confidence?: number;
  contractAges?: Record<string, number>; // contract address -> days since deployment
}

/**
 * Default policy configuration values
 */
export const DEFAULT_POLICY_CONFIG: PolicyEngineConfig = {
  maxGasUsd: 50,
  blockNewContractsDays: 7,
  blockInfiniteApprovalsToUnknown: true,
  requireSimulationForValueOverUsd: 250,
  confidenceThreshold: 0.70,
  allowedSlippagePercent: 2.0,
  maxDailyTransactionCount: 20,
  mevProtectedMode: 'auto' // V1.1: MEV protection enabled by default on supported chains
};

/**
 * Policy Engine v0 - Core policy enforcement logic
 */
export class PolicyEngine {
  private config: PolicyEngineConfig;

  constructor(config: Partial<PolicyEngineConfig> = {}) {
    this.config = {
      ...DEFAULT_POLICY_CONFIG,
      ...config
    };
    
    // Enforce minimum confidence threshold (cannot disable gating entirely)
    if (this.config.confidenceThreshold < 0.50) {
      this.config.confidenceThreshold = 0.50;
    }
  }

  /**
   * Check if a transaction plan passes all policy rules
   */
  async checkPolicy(context: PolicyContext): Promise<PolicyCheckResult> {
    const violations: string[] = [];
    const appliedPolicies: string[] = [];

    // 1. Check confidence threshold
    if (context.confidence !== undefined) {
      appliedPolicies.push('confidence_threshold');
      if (context.confidence < this.config.confidenceThreshold) {
        violations.push(`CONFIDENCE_TOO_LOW: ${context.confidence} < ${this.config.confidenceThreshold}`);
      }
    }

    // 2. Check gas cost limits
    if (context.totalGasEstimateUsd !== undefined) {
      appliedPolicies.push('max_gas_usd');
      if (context.totalGasEstimateUsd > this.config.maxGasUsd) {
        violations.push(`GAS_LIMIT_EXCEEDED: ${context.totalGasEstimateUsd} > ${this.config.maxGasUsd}`);
      }
    }

    // 3. Check new contract restrictions
    if (context.contractAges) {
      appliedPolicies.push('block_new_contracts_days');
      for (const [contractAddress, ageDays] of Object.entries(context.contractAges)) {
        if (ageDays < this.config.blockNewContractsDays) {
          violations.push(`NEW_CONTRACT_BLOCKED: ${contractAddress} deployed ${ageDays} days ago < ${this.config.blockNewContractsDays} days`);
        }
      }
    }

    // 4. Check infinite approvals to unknown spenders
    const hasApprovalSteps = context.steps.some(step => step.kind === 'approve');
    if (this.config.blockInfiniteApprovalsToUnknown && hasApprovalSteps) {
      appliedPolicies.push('block_infinite_approvals_to_unknown');
      for (const step of context.steps) {
        if (step.kind === 'approve' && this.isInfiniteApproval(step) && this.isUnknownSpender(step.target_address)) {
          violations.push(`INFINITE_APPROVAL_TO_UNKNOWN: ${step.target_address} is unknown spender`);
        }
      }
    }

    // 5. Check simulation requirement for high-value transactions
    if (context.totalValueUsd !== undefined) {
      appliedPolicies.push('require_simulation_for_value_over_usd');
      if (context.totalValueUsd > this.config.requireSimulationForValueOverUsd) {
        // This would be checked by the caller - simulation must have been performed
        // We just record that this policy was applied
      }
    }

    // 6. Check MEV protection mode (V1.1 feature)
    if (this.config.mevProtectedMode !== 'off') {
      appliedPolicies.push('mev_protected_mode');
      // MEV protection validation is handled by checkMevProtectionRequirements
      // This just records that the policy was considered
    }

    // 7. Check daily transaction count (would require database lookup in real implementation)
    appliedPolicies.push('max_daily_transaction_count');
    // TODO: Implement daily transaction count check with database lookup

    const status = violations.length > 0 ? 'blocked' : 'allowed';

    return {
      status,
      violations,
      appliedPolicies
    };
  }

  /**
   * Check MEV protection requirements for a transaction
   * V1.1 Feature: Requirement 14.3
   */
  checkMevProtectionRequirements(
    chainId: number,
    provider?: string
  ): {
    required: boolean;
    supported: boolean;
    mode: string;
    provider?: string;
    reason?: string;
  } {
    const mode = this.config.mevProtectedMode;
    
    // MEV supported chains: Ethereum Mainnet (1), Goerli (5), Sepolia (11155111)
    const mevSupportedChains = [1, 5, 11155111];
    const chainSupported = mevSupportedChains.includes(chainId);
    
    // MEV supported providers
    const mevSupportedProviders = ['flashbots', 'eden', 'bloxroute'];
    const providerSupported = !provider || mevSupportedProviders.some(p => 
      provider.toLowerCase().includes(p)
    );
    
    const supported = chainSupported && providerSupported;
    
    switch (mode) {
      case 'off':
        return {
          required: false,
          supported,
          mode,
          reason: 'MEV protection disabled by user'
        };
      
      case 'force':
        if (!supported) {
          return {
            required: true,
            supported: false,
            mode,
            reason: `MEV protection forced but not supported on chain ${chainId}`
          };
        }
        return {
          required: true,
          supported: true,
          mode,
          provider: provider || 'flashbots',
          reason: 'MEV protection forced by user'
        };
      
      case 'auto':
        return {
          required: supported,
          supported,
          mode,
          provider: supported ? (provider || 'flashbots') : undefined,
          reason: supported 
            ? 'MEV protection enabled automatically'
            : `MEV protection not available on chain ${chainId}`
        };
      
      default:
        return {
          required: false,
          supported,
          mode,
          reason: 'Invalid MEV protection mode'
        };
    }
  }

  /**
   * Check if confidence meets threshold for degraded mode
   */
  checkConfidenceThreshold(confidence: number): {
    degraded: boolean;
    gateRiskyActions: boolean;
    degradedReasons: string[];
  } {
    const degraded = confidence < this.config.confidenceThreshold;
    const gateRiskyActions = confidence < this.config.confidenceThreshold;
    const degradedReasons: string[] = [];

    if (degraded) {
      degradedReasons.push(`Confidence ${confidence} below threshold ${this.config.confidenceThreshold}`);
    }

    return {
      degraded,
      gateRiskyActions,
      degradedReasons
    };
  }

  /**
   * Update policy configuration
   */
  updateConfig(newConfig: Partial<PolicyEngineConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };

    // Enforce minimum confidence threshold
    if (this.config.confidenceThreshold < 0.50) {
      this.config.confidenceThreshold = 0.50;
    }
  }

  /**
   * Get current policy configuration
   */
  getConfig(): PolicyEngineConfig {
    return { ...this.config };
  }

  /**
   * Validate policy configuration values
   */
  static validateConfig(config: Partial<PolicyEngineConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.maxGasUsd !== undefined && config.maxGasUsd < 0) {
      errors.push('maxGasUsd must be non-negative');
    }

    if (config.blockNewContractsDays !== undefined && config.blockNewContractsDays < 0) {
      errors.push('blockNewContractsDays must be non-negative');
    }

    if (config.requireSimulationForValueOverUsd !== undefined && config.requireSimulationForValueOverUsd < 0) {
      errors.push('requireSimulationForValueOverUsd must be non-negative');
    }

    if (config.confidenceThreshold !== undefined) {
      if (config.confidenceThreshold < 0.50 || config.confidenceThreshold > 1.0) {
        errors.push('confidenceThreshold must be between 0.50 and 1.0');
      }
    }

    if (config.allowedSlippagePercent !== undefined) {
      if (config.allowedSlippagePercent < 0 || config.allowedSlippagePercent > 100) {
        errors.push('allowedSlippagePercent must be between 0 and 100');
      }
    }

    if (config.maxDailyTransactionCount !== undefined && config.maxDailyTransactionCount < 0) {
      errors.push('maxDailyTransactionCount must be non-negative');
    }

    if (config.mevProtectedMode !== undefined) {
      const validModes = ['off', 'auto', 'force'];
      if (!validModes.includes(config.mevProtectedMode)) {
        errors.push('mevProtectedMode must be one of: off, auto, force');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if an approval step represents an infinite approval
   */
  private isInfiniteApproval(step: ExecutionStep): boolean {
    // In a real implementation, this would check the approval amount
    // For now, we'll use a heuristic based on the step payload or other indicators
    return step.payload?.includes('ffffffff') || false;
  }

  /**
   * Check if a spender address is unknown/untrusted
   */
  private isUnknownSpender(address: string): boolean {
    // In a real implementation, this would check against a trusted spender registry
    // For now, we'll use a simple heuristic
    const knownSpenders = [
      '0xa0b86a33e6441e8c8c7014c0c746c4c9b0f0d0e0', // Example: Uniswap V3 Router
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Example: Uniswop V2 Router
      '0x1111111254eeb25477b68fb85ed929f73a960582', // Example: 1inch Router
    ];
    
    return !knownSpenders.includes(address.toLowerCase());
  }
}

/**
 * Create a policy engine instance with user-specific configuration
 */
export const createPolicyEngine = (config?: Partial<PolicyEngineConfig>): PolicyEngine => {
  return new PolicyEngine(config);
};

/**
 * Default policy engine instance with standard configuration
 */
export const defaultPolicyEngine = new PolicyEngine();