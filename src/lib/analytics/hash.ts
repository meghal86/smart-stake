/**
 * Wallet Address Hashing Utilities
 * 
 * Provides secure hashing for wallet addresses with per-session salt.
 * Requirements: 10.12, 10.14
 */

const SESSION_SALT_KEY = 'alphawhale_session_salt';

/**
 * Get or generate per-session salt
 */
function getSessionSalt(): string {
  if (typeof window === 'undefined') return '';

  try {
    let salt = sessionStorage.getItem(SESSION_SALT_KEY);
    
    if (!salt) {
      // Generate new salt for this session
      salt = generateSalt();
      sessionStorage.setItem(SESSION_SALT_KEY, salt);
    }

    return salt;
  } catch (error) {
    console.error('Failed to get session salt:', error);
    return generateSalt();
  }
}

/**
 * Generate a random salt
 */
function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a wallet address with per-session salt
 * 
 * IMPORTANT: This ensures wallet addresses are NEVER logged in plain text
 */
export async function hashWalletAddress(address: string): Promise<string> {
  if (!address) return '';

  const salt = getSessionSalt();
  const data = `${salt}:${address.toLowerCase()}`;
  
  // Use SubtleCrypto for secure hashing
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Validate that a string is not a plain wallet address
 * Used in tests to ensure we never log plain addresses
 */
export function isPlainWalletAddress(value: string): boolean {
  if (!value) return false;
  
  // Check for Ethereum address pattern (0x followed by 40 hex chars)
  const ethPattern = /^0x[a-fA-F0-9]{40}$/;
  if (ethPattern.test(value)) return true;
  
  // Check for Solana address pattern (base58, 32-44 chars)
  const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (solanaPattern.test(value)) return true;
  
  return false;
}

/**
 * Sanitize event properties to ensure no plain wallet addresses
 * This is a safety check that should be used before sending any analytics
 */
export function sanitizeEventProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' && isPlainWalletAddress(value)) {
      console.error(`SECURITY WARNING: Plain wallet address detected in analytics property "${key}"`);
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeEventProperties(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
