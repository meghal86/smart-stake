/**
 * CSP Nonce Utilities
 * 
 * Provides utilities to access the per-request nonce for inline scripts and styles.
 * The nonce is generated in middleware and passed via headers.
 */

import { headers } from 'next/headers';

/**
 * Get the CSP nonce for the current request (Server Components only)
 * 
 * @returns The nonce string or undefined if not available
 * 
 * @example
 * ```tsx
 * import { getNonce } from '@/lib/security/nonce';
 * 
 * export default function Page() {
 *   const nonce = getNonce();
 *   
 *   return (
 *     <script nonce={nonce}>
 *       console.log('This script has a nonce');
 *     </script>
 *   );
 * }
 * ```
 */
export function getNonce(): string | undefined {
  try {
    const headersList = headers();
    return headersList.get('x-nonce') || undefined;
  } catch (error) {
    // headers() can only be called in Server Components
    console.warn('getNonce() can only be called in Server Components');
    return undefined;
  }
}

/**
 * Get nonce attribute for inline scripts/styles
 * 
 * @returns Object with nonce attribute or empty object
 * 
 * @example
 * ```tsx
 * import { getNonceAttr } from '@/lib/security/nonce';
 * 
 * export default function Page() {
 *   const nonceAttr = getNonceAttr();
 *   
 *   return (
 *     <script {...nonceAttr}>
 *       console.log('This script has a nonce');
 *     </script>
 *   );
 * }
 * ```
 */
export function getNonceAttr(): { nonce?: string } {
  const nonce = getNonce();
  return nonce ? { nonce } : {};
}
