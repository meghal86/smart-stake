/**
 * Portfolio Security and Privacy Controls
 * 
 * Implements wallet-user linkage encryption, structured logging with PII minimization,
 * and safety mode warnings for risky operations.
 * 
 * Requirements: 12.5, 14.1, 14.2, 14.4, 14.5
 * 
 * REUSE AUDIT:
 * - Extends existing encryption pattern from src/lib/harvestpro/cex-integration.ts
 * - Extends existing hashing pattern from src/lib/analytics/hash.ts
 * - New: Portfolio-specific safety mode and simulation requirements
 */

import crypto from 'crypto';

// ============================================================================
// WALLET-USER LINKAGE ENCRYPTION (Requirement 12.5, 14.4)
// ============================================================================

const PORTFOLIO_ENCRYPTION_KEY = process.env.PORTFOLIO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'default-key-for-dev';

/**
 * Encrypt wallet address for storage
 * Uses AES-256-GCM for authenticated encryption
 * 
 * @param address - Plain wallet address
 * @returns Encrypted address in format: iv:authTag:encrypted
 */
export function encryptWalletAddress(address: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.createHash('sha256').update(PORTFOLIO_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(address.toLowerCase(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt wallet address from storage
 * 
 * @param ciphertext - Encrypted address in format: iv:authTag:encrypted
 * @returns Plain wallet address (lowercase)
 */
export function decryptWalletAddress(ciphertext: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.createHash('sha256').update(PORTFOLIO_ENCRYPTION_KEY).digest();
  
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate deterministic hash of wallet address for indexing
 * Uses SHA-256 for consistent lookups without exposing plain address
 * 
 * @param address - Plain wallet address
 * @returns SHA-256 hash of lowercase address
 */
export function hashWalletAddressForIndex(address: string): string {
  return crypto
    .createHash('sha256')
    .update(address.toLowerCase())
    .digest('hex');
}

// ============================================================================
// STRUCTURED LOGGING WITH PII MINIMIZATION (Requirement 14.5)
// ============================================================================

/**
 * Sanitize log data to remove or hash sensitive information
 * 
 * @param data - Log data object
 * @param debugMode - If true, includes plain addresses (use only in development)
 * @returns Sanitized log data
 */
export function sanitizeLogData(
  data: Record<string, unknown>,
  debugMode: boolean = false
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Handle wallet addresses
    if (key.toLowerCase().includes('address') || key.toLowerCase().includes('wallet')) {
      if (typeof value === 'string' && isWalletAddress(value)) {
        if (debugMode) {
          sanitized[key] = value;
        } else {
          sanitized[`${key}_hash`] = hashWalletAddressForIndex(value);
          sanitized[key] = '[REDACTED]';
        }
        continue;
      }
    }

    // Handle private keys (should never be logged)
    if (key.toLowerCase().includes('private') || key.toLowerCase().includes('secret')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>, debugMode);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? sanitizeLogData(item as Record<string, unknown>, debugMode)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if a string looks like a wallet address
 */
function isWalletAddress(value: string): boolean {
  if (!value) return false;
  
  // Ethereum address pattern (0x followed by 40 hex chars)
  const ethPattern = /^0x[a-fA-F0-9]{40}$/;
  if (ethPattern.test(value)) return true;
  
  // Solana address pattern (base58, 32-44 chars)
  const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (solanaPattern.test(value)) return true;
  
  return false;
}

/**
 * Safe logger that automatically sanitizes sensitive data
 */
export const portfolioLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const debugMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_LOGGING === 'true';
    console.log(message, data ? sanitizeLogData(data, debugMode) : '');
  },
  
  warn: (message: string, data?: Record<string, unknown>) => {
    const debugMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_LOGGING === 'true';
    console.warn(message, data ? sanitizeLogData(data, debugMode) : '');
  },
  
  error: (message: string, error?: Error, data?: Record<string, unknown>) => {
    const debugMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_LOGGING === 'true';
    console.error(message, error, data ? sanitizeLogData(data, debugMode) : '');
  },
};

// ============================================================================
// SAFETY MODE WARNINGS (Requirement 14.1)
// ============================================================================

export interface SafetyWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  code: string;
  message: string;
  reason: string;
  recommendation: string;
}

/**
 * Check if a contract is new/unverified and should trigger safety warnings
 * 
 * @param contractAddress - Contract address to check
 * @param deployedAt - Contract deployment timestamp
 * @param isVerified - Whether contract is verified on block explorer
 * @param blockNewContractsDays - Policy setting for how many days to block new contracts
 * @returns Safety warning if contract is risky, null otherwise
 */
export function checkContractSafety(
  contractAddress: string,
  deployedAt: Date | null,
  isVerified: boolean,
  blockNewContractsDays: number = 7
): SafetyWarning | null {
  // Unverified contracts are always high risk
  if (!isVerified) {
    return {
      severity: 'high',
      code: 'UNVERIFIED_CONTRACT',
      message: 'Unverified Contract',
      reason: 'This contract has not been verified on the block explorer',
      recommendation: 'Avoid interacting with unverified contracts unless you trust the source',
    };
  }

  // Check if contract is too new
  if (deployedAt) {
    const daysSinceDeployment = (Date.now() - deployedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDeployment < blockNewContractsDays) {
      return {
        severity: 'medium',
        code: 'NEW_CONTRACT',
        message: 'Recently Deployed Contract',
        reason: `Contract was deployed ${Math.floor(daysSinceDeployment)} days ago`,
        recommendation: `Wait until contract is at least ${blockNewContractsDays} days old before interacting`,
      };
    }
  }

  return null;
}

/**
 * Check if an approval is risky (unlimited approval to unknown spender)
 * 
 * @param amount - Approval amount ("unlimited" or specific amount)
 * @param spenderTrust - Trust score of spender (0-1)
 * @param spenderVerified - Whether spender is verified
 * @returns Safety warning if approval is risky, null otherwise
 */
export function checkApprovalSafety(
  amount: string,
  spenderTrust: number,
  spenderVerified: boolean
): SafetyWarning | null {
  const isUnlimited = amount === 'unlimited' || amount === 'max' || amount.includes('115792089237316195423570985008687907853269984665640564039457584007913129639935');

  // Unlimited approval to unknown/unverified spender is critical
  if (isUnlimited && (!spenderVerified || spenderTrust < 0.5)) {
    return {
      severity: 'critical',
      code: 'UNLIMITED_APPROVAL_UNKNOWN_SPENDER',
      message: 'Dangerous Unlimited Approval',
      reason: 'Granting unlimited token access to an unknown or unverified contract',
      recommendation: 'Revoke this approval immediately or limit the approval amount',
    };
  }

  // Unlimited approval to low-trust spender is high risk
  if (isUnlimited && spenderTrust < 0.7) {
    return {
      severity: 'high',
      code: 'UNLIMITED_APPROVAL_LOW_TRUST',
      message: 'Risky Unlimited Approval',
      reason: `Spender has low trust score (${(spenderTrust * 100).toFixed(0)}%)`,
      recommendation: 'Consider limiting the approval amount or revoking',
    };
  }

  return null;
}

// ============================================================================
// MANDATORY SIMULATION REQUIREMENTS (Requirement 14.2)
// ============================================================================

/**
 * Check if an operation requires simulation before execution
 * 
 * @param operationType - Type of operation (spend, approve, revoke, etc.)
 * @param valueUsd - USD value of operation
 * @param requireSimulationForValueOverUsd - Policy threshold for requiring simulation
 * @returns True if simulation is required
 */
export function requiresSimulation(
  operationType: 'spend' | 'approve' | 'revoke' | 'swap' | 'transfer',
  valueUsd: number,
  requireSimulationForValueOverUsd: number = 250
): boolean {
  // Always require simulation for spend, approve, and revoke operations
  if (operationType === 'spend' || operationType === 'approve' || operationType === 'revoke') {
    return true;
  }

  // Require simulation for high-value operations
  if (valueUsd >= requireSimulationForValueOverUsd) {
    return true;
  }

  return false;
}

/**
 * Generate safety warning for operations that require simulation
 * 
 * @param operationType - Type of operation
 * @param simulationAvailable - Whether simulation service is available
 * @returns Safety warning if simulation is required but unavailable
 */
export function checkSimulationRequirement(
  operationType: 'spend' | 'approve' | 'revoke' | 'swap' | 'transfer',
  simulationAvailable: boolean
): SafetyWarning | null {
  if (!requiresSimulation(operationType, 0)) {
    return null;
  }

  if (!simulationAvailable) {
    return {
      severity: 'critical',
      code: 'SIMULATION_UNAVAILABLE',
      message: 'Simulation Required But Unavailable',
      reason: `${operationType} operations require simulation for safety`,
      recommendation: 'Wait for simulation service to be available before proceeding',
    };
  }

  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { SafetyWarning };
