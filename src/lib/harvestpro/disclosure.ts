/**
 * Legal Disclosure Management for HarvestPro
 * Handles disclosure acceptance tracking and version management
 * 
 * Requirements: Enhanced Req 0 AC1-5
 * - Store disclosure acceptance in localStorage
 * - Track disclosure version for re-prompting
 * - Manage first-visit detection
 */

export interface DisclosureState {
  disclosureAccepted: boolean;
  version: string;
  timestamp: string;
}

export const CURRENT_DISCLOSURE_VERSION = '1.0.0';
export const DISCLOSURE_STORAGE_KEY = 'harvestpro_disclosure_state';

/**
 * Get current disclosure state from localStorage
 */
export function getDisclosureState(): DisclosureState | null {
  try {
    const stored = localStorage.getItem(DISCLOSURE_STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored) as DisclosureState;
    return state;
  } catch (error) {
    console.error('Failed to parse disclosure state:', error);
    return null;
  }
}

/**
 * Check if user needs to see disclosure modal
 * Returns true if:
 * - First time visiting HarvestPro
 * - Disclosure version has changed
 */
export function shouldShowDisclosure(): boolean {
  const state = getDisclosureState();
  
  // First time visitor
  if (!state) {
    return true;
  }
  
  // Version has changed
  if (state.version !== CURRENT_DISCLOSURE_VERSION) {
    return true;
  }
  
  // Already accepted current version
  return false;
}

/**
 * Save disclosure acceptance to localStorage
 */
export function saveDisclosureAcceptance(): void {
  const state: DisclosureState = {
    disclosureAccepted: true,
    version: CURRENT_DISCLOSURE_VERSION,
    timestamp: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(DISCLOSURE_STORAGE_KEY, JSON.stringify(state));
    console.log('✅ Disclosure acceptance saved:', state);
  } catch (error) {
    console.error('Failed to save disclosure state:', error);
  }
}

/**
 * Clear disclosure state (for testing purposes)
 */
export function clearDisclosureState(): void {
  try {
    localStorage.removeItem(DISCLOSURE_STORAGE_KEY);
    console.log('🗑️ Disclosure state cleared');
  } catch (error) {
    console.error('Failed to clear disclosure state:', error);
  }
}