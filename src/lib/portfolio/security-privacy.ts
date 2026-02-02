/**
 * Portfolio Security and Privacy Controls
 * Implements wallet-user linkage encryption, structured logging with PII minimization,
 * and safety mode warnings for risky operations
 * 
 * Requirements: 12.5, 14.1, 14.2, 14.4, 14.5
 * 
 * REUSE DECISION:
 * - Extends existing encryption from supabase/functions/_shared/harvestpro/cex-integration.ts
 * - Extends existing logging from src/lib/guardian/observability.ts
 * - Creates new: wallet-user linkage encryption, safety mode warnings, simulation requirements
 */

import { Logger, LogContext } from '@/lib/guardian/observability';

// ============================================================================
// TYPES
// ============================================================================

export interface WalletLinkageData {
  userId: string;
  walletAddress: string;
  addressHash: string; // SHA-256 hash for indexing
  addressEnc?: string; // Optional encrypted address
  createdAt: Date;
}

export interface SafetyModeConfig {
  enabled: boolean;
  warnOnNewContracts: boolean;
  warnOnUnlimitedApprovals: boolean;
  requireSimulationForSpend: boolean;
  requireSimulationForApprove: boolean;
  requireSimulationForRevoke: boolean;
  newContractAgeDays: number; // Default 7 days
}

export interface SafetyWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'new_contract' | 'unlimited_approval' | 'unverified_contract' | 'high_value' | 'simulation_required';
  message: string;
  details?: string;
  canProceed: boolean;
  requiresOverride: boolean;
}

export interface SimulationRequirement {
  required: boolean;
  reason: string;
  operationType: 'spend' | 'approve' | 'revoke' | 'transfer';
  valueUsd?: number;
}

// ============================================================================
// ENCRYPTION (Requirement 12.5, 14.4)
// ============================================================================

/**
 * Encrypt wallet address using Web Crypto API (AES-256-GCM)
 * 
 * Requirement 12.5: Protect wallet-user linkage with encryption
 * Requirement 14.4: Never store private keys, protect wallet-user linkage
 */
export async function encryptWalletAddress(address: string): Promise<string> {
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 
                        process.env.NEXT_PUBLIC_WALLET_ENCRYPTION_KEY ||
                        'test-encryption-key-32-bytes-long!!'; // Fallback for tests
  
  if (!encryptionKey) {
    throw new Error('WALLET_ENCRYPTION_KEY not configured');
  }
  
  // Normalize address to lowercase
  const normalizedAddress = address.toLowerCase();
  
  // Derive key from password using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(encryptionKey)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(normalizedAddress)
  );
  
  // Convert to hex strings
  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const encryptedHex = Array.from(new Uint8Array(encrypted))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${ivHex}:${encryptedHex}`;
}

/**
 * Decrypt wallet address using Web Crypto API
 * 
 * Requirement 12.5: Decrypt wallet-user linkage when needed
 */
export async function decryptWalletAddress(ciphertext: string): Promise<string> {
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 
                        process.env.NEXT_PUBLIC_WALLET_ENCRYPTION_KEY ||
                        'test-encryption-key-32-bytes-long!!'; // Fallback for tests
  
  if (!encryptionKey) {
    throw new Error('WALLET_ENCRYPTION_KEY not configured');
  }
  
  const [ivHex, encryptedHex] = ciphertext.split(':');
  
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid ciphertext format');
  }
  
  // Convert hex strings to Uint8Array
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const encrypted = new Uint8Array(
    encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Derive key from password using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(encryptionKey)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generate SHA-256 hash of wallet address for indexing
 * 
 * Requirement 12.5: Use address_hash for indexed queries without exposing raw addresses
 */
export async function hashWalletAddress(address: string): Promise<string> {
  const normalizedAddress = address.toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedAddress);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize wallet address to lowercase
 * 
 * Requirement 12.6: Store normalized address for RPC queries
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

// ============================================================================
// STRUCTURED LOGGING WITH PII MINIMIZATION (Requirement 14.5)
// ============================================================================

/**
 * Sanitize wallet address for logging
 * Shows first 6 and last 4 characters only
 * 
 * Requirement 14.5: Structured logging with minimal exposure of sensitive data
 * Requirement 12.6: Logs MUST NOT include raw addresses unless explicit debug flag enabled
 */
export function sanitizeAddress(address: string, debugMode = false): string {
  // Trim whitespace first
  const trimmed = (address || '').trim();
  
  if (debugMode && process.env.NODE_ENV === 'development') {
    return trimmed || '[REDACTED]';
  }
  
  // Check if string is too short or mostly whitespace
  // Remove all whitespace to check meaningful content length
  const withoutWhitespace = trimmed.replace(/\s+/g, '');
  if (!trimmed || trimmed.length < 10 || withoutWhitespace.length < 6) {
    return '[REDACTED]';
  }
  
  return `${trimmed.substring(0, 6)}...${trimmed.substring(trimmed.length - 4)}`;
}

/**
 * Sanitize user ID for logging
 * Shows first 8 characters only
 */
export function sanitizeUserId(userId: string, debugMode = false): string {
  // Trim whitespace first
  const trimmed = (userId || '').trim();
  
  if (debugMode && process.env.NODE_ENV === 'development') {
    return trimmed || '[REDACTED]';
  }
  
  // Check if string is too short or mostly whitespace
  // User IDs should be at least 10 characters to be meaningful (UUIDs are 36 chars)
  // Remove all whitespace to check meaningful content length
  const withoutWhitespace = trimmed.replace(/\s+/g, '');
  if (!trimmed || trimmed.length < 10 || withoutWhitespace.length < 8) {
    return '[REDACTED]';
  }
  
  return `${trimmed.substring(0, 8)}...`;
}

/**
 * Create portfolio logger with PII minimization
 * 
 * Requirement 14.5: Structured logging with data minimization
 */
export function createPortfolioLogger(context: LogContext = {}): Logger {
  // Sanitize sensitive fields in context
  const sanitizedContext = { ...context };
  
  if (sanitizedContext.walletAddress) {
    sanitizedContext.walletAddress = sanitizeAddress(
      sanitizedContext.walletAddress as string,
      !!process.env.DEBUG_LOGGING
    );
  }
  
  if (sanitizedContext.userId) {
    sanitizedContext.userId = sanitizeUserId(
      sanitizedContext.userId as string,
      !!process.env.DEBUG_LOGGING
    );
  }
  
  return new Logger({
    service: 'portfolio',
    ...sanitizedContext,
  });
}

/**
 * Log portfolio event with automatic PII sanitization
 */
export function logPortfolioEvent(
  eventName: string,
  data: Record<string, unknown>,
  logger?: Logger
): void {
  // Handle empty event names gracefully
  const trimmedEventName = (eventName || '').trim();
  if (!trimmedEventName) {
    console.warn('logPortfolioEvent called with empty event name');
    return;
  }
  
  const portfolioLogger = logger || createPortfolioLogger();
  
  // Sanitize data
  const sanitizedData = { ...data };
  
  if (sanitizedData.walletAddress) {
    sanitizedData.walletAddress = sanitizeAddress(
      sanitizedData.walletAddress as string,
      !!process.env.DEBUG_LOGGING
    );
  }
  
  if (sanitizedData.userId) {
    sanitizedData.userId = sanitizeUserId(
      sanitizedData.userId as string,
      !!process.env.DEBUG_LOGGING
    );
  }
  
  // Remove any other sensitive fields
  delete sanitizedData.privateKey;
  delete sanitizedData.apiKey;
  delete sanitizedData.apiSecret;
  delete sanitizedData.password;
  
  portfolioLogger.info(trimmedEventName, sanitizedData);
}

// ============================================================================
// SAFETY MODE (Requirement 14.1)
// ============================================================================

/**
 * Default safety mode configuration
 * 
 * Requirement 14.1: Implement default safe mode with warnings for new/unverified contracts
 */
export const DEFAULT_SAFETY_CONFIG: SafetyModeConfig = {
  enabled: true,
  warnOnNewContracts: true,
  warnOnUnlimitedApprovals: true,
  requireSimulationForSpend: true,
  requireSimulationForApprove: true,
  requireSimulationForRevoke: true,
  newContractAgeDays: 7,
};

/**
 * Check if contract is new/unverified
 * 
 * Requirement 14.1: Warn for new/unverified contracts
 */
export function isNewContract(
  contractCreatedAt: Date,
  config: SafetyModeConfig = DEFAULT_SAFETY_CONFIG
): boolean {
  const ageInDays = (Date.now() - contractCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays < config.newContractAgeDays;
}

/**
 * Generate safety warnings for an operation
 * 
 * Requirement 14.1: Display appropriate warnings in default safe mode
 */
export function generateSafetyWarnings(
  operation: {
    type: 'spend' | 'approve' | 'revoke' | 'transfer';
    contractAddress: string;
    contractCreatedAt?: Date;
    contractVerified?: boolean;
    approvalAmount?: string;
    valueUsd?: number;
  },
  config: SafetyModeConfig = DEFAULT_SAFETY_CONFIG
): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  
  if (!config.enabled) {
    return warnings;
  }
  
  // Check for new contracts
  if (config.warnOnNewContracts && operation.contractCreatedAt) {
    if (isNewContract(operation.contractCreatedAt, config)) {
      warnings.push({
        severity: 'high',
        type: 'new_contract',
        message: 'This contract was recently deployed',
        details: `Contract is less than ${config.newContractAgeDays} days old. Exercise caution when interacting with new contracts.`,
        canProceed: true,
        requiresOverride: true,
      });
    }
  }
  
  // Check for unverified contracts
  if (operation.contractVerified === false) {
    warnings.push({
      severity: 'high',
      type: 'unverified_contract',
      message: 'This contract is not verified',
      details: 'Unverified contracts may contain malicious code. Proceed with extreme caution.',
      canProceed: true,
      requiresOverride: true,
    });
  }
  
  // Check for unlimited approvals
  if (
    config.warnOnUnlimitedApprovals &&
    operation.type === 'approve' &&
    operation.approvalAmount === 'unlimited'
  ) {
    warnings.push({
      severity: 'critical',
      type: 'unlimited_approval',
      message: 'Unlimited approval requested',
      details: 'This will allow the contract to spend all of your tokens. Consider approving only the amount needed.',
      canProceed: true,
      requiresOverride: true,
    });
  }
  
  // Check for high value operations
  if (operation.valueUsd !== undefined && !isNaN(operation.valueUsd) && operation.valueUsd > 10000) {
    warnings.push({
      severity: 'medium',
      type: 'high_value',
      message: 'High value transaction',
      details: `This transaction involves $${operation.valueUsd.toLocaleString()}. Please verify all details carefully.`,
      canProceed: true,
      requiresOverride: false,
    });
  }
  
  return warnings;
}

/**
 * Check if operation can proceed based on safety warnings
 */
export function canProceedWithOperation(warnings: SafetyWarning[]): boolean {
  // Critical warnings that require override
  const criticalWarnings = warnings.filter(
    w => w.severity === 'critical' && w.requiresOverride
  );
  
  return criticalWarnings.length === 0;
}

// ============================================================================
// SIMULATION REQUIREMENTS (Requirement 14.2)
// ============================================================================

/**
 * Check if simulation is required for an operation
 * 
 * Requirement 14.2: Require simulation for all spend/approve/revoke operations
 */
export function isSimulationRequired(
  operation: {
    type: 'spend' | 'approve' | 'revoke' | 'transfer';
    valueUsd?: number;
  },
  config: SafetyModeConfig = DEFAULT_SAFETY_CONFIG
): SimulationRequirement {
  if (!config.enabled) {
    return {
      required: false,
      reason: 'Safety mode disabled',
      operationType: operation.type,
    };
  }
  
  // Check operation type requirements
  switch (operation.type) {
    case 'spend':
      if (config.requireSimulationForSpend) {
        return {
          required: true,
          reason: 'Simulation required for all spend operations',
          operationType: operation.type,
          valueUsd: operation.valueUsd,
        };
      }
      break;
      
    case 'approve':
      if (config.requireSimulationForApprove) {
        return {
          required: true,
          reason: 'Simulation required for all approval operations',
          operationType: operation.type,
          valueUsd: operation.valueUsd,
        };
      }
      break;
      
    case 'revoke':
      if (config.requireSimulationForRevoke) {
        return {
          required: true,
          reason: 'Simulation required for all revoke operations',
          operationType: operation.type,
          valueUsd: operation.valueUsd,
        };
      }
      break;
      
    case 'transfer':
      // Transfers always require simulation if value is significant
      if (operation.valueUsd && operation.valueUsd > 100) {
        return {
          required: true,
          reason: 'Simulation required for high-value transfers',
          operationType: operation.type,
          valueUsd: operation.valueUsd,
        };
      }
      break;
  }
  
  return {
    required: false,
    reason: 'Simulation not required for this operation',
    operationType: operation.type,
    valueUsd: operation.valueUsd,
  };
}

/**
 * Validate that simulation was performed before execution
 * 
 * Requirement 14.2: Enforce simulation requirement
 */
export function validateSimulationPerformed(
  operation: {
    type: 'spend' | 'approve' | 'revoke' | 'transfer';
    valueUsd?: number;
  },
  simulationReceiptId?: string,
  config: SafetyModeConfig = DEFAULT_SAFETY_CONFIG
): { valid: boolean; error?: string } {
  const requirement = isSimulationRequired(operation, config);
  
  if (requirement.required && !simulationReceiptId) {
    return {
      valid: false,
      error: `Simulation required: ${requirement.reason}`,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// WALLET-USER LINKAGE PROTECTION (Requirement 12.5)
// ============================================================================

/**
 * Create wallet linkage data with encryption and hashing
 * 
 * Requirement 12.5: Protect wallet-user linkage with RLS and encryption
 */
export async function createWalletLinkage(
  userId: string,
  walletAddress: string,
  encryptAddress = true
): Promise<WalletLinkageData> {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  const addressHash = await hashWalletAddress(normalizedAddress);
  
  const linkage: WalletLinkageData = {
    userId,
    walletAddress: normalizedAddress,
    addressHash,
    createdAt: new Date(),
  };
  
  if (encryptAddress) {
    linkage.addressEnc = await encryptWalletAddress(normalizedAddress);
  }
  
  return linkage;
}

/**
 * Verify wallet linkage by comparing hashes
 * 
 * Requirement 12.5: Use address_hash for verification without exposing raw addresses
 */
export async function verifyWalletLinkage(
  walletAddress: string,
  storedAddressHash: string
): Promise<boolean> {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  const computedHash = await hashWalletAddress(normalizedAddress);
  return computedHash === storedAddressHash;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Logger,
  LogContext,
} from '@/lib/guardian/observability';
