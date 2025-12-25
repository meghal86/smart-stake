/**
 * Legal Disclosure Management Tests
 * Tests for disclosure state management and localStorage integration
 * 
 * Requirements: Enhanced Req 0 AC1-5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDisclosureState,
  shouldShowDisclosure,
  saveDisclosureAcceptance,
  clearDisclosureState,
  CURRENT_DISCLOSURE_VERSION,
  DISCLOSURE_STORAGE_KEY,
} from '@/lib/harvestpro/disclosure';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Disclosure Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getDisclosureState', () => {
    it('returns null when no state is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getDisclosureState();
      
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(DISCLOSURE_STORAGE_KEY);
    });

    it('returns parsed state when valid JSON is stored', () => {
      const mockState = {
        disclosureAccepted: true,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));
      
      const result = getDisclosureState();
      
      expect(result).toEqual(mockState);
    });

    it('returns null when invalid JSON is stored', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = getDisclosureState();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse disclosure state:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('shouldShowDisclosure', () => {
    it('returns true for first-time visitors', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = shouldShowDisclosure();
      
      expect(result).toBe(true);
    });

    it('returns false when current version is already accepted', () => {
      const mockState = {
        disclosureAccepted: true,
        version: CURRENT_DISCLOSURE_VERSION,
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));
      
      const result = shouldShowDisclosure();
      
      expect(result).toBe(false);
    });

    it('returns true when version has changed', () => {
      const mockState = {
        disclosureAccepted: true,
        version: '0.9.0', // Old version
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));
      
      const result = shouldShowDisclosure();
      
      expect(result).toBe(true);
    });
  });

  describe('saveDisclosureAcceptance', () => {
    it('saves acceptance state to localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      saveDisclosureAcceptance();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        DISCLOSURE_STORAGE_KEY,
        expect.stringContaining('"disclosureAccepted":true')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        DISCLOSURE_STORAGE_KEY,
        expect.stringContaining(`"version":"${CURRENT_DISCLOSURE_VERSION}"`)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        DISCLOSURE_STORAGE_KEY,
        expect.stringContaining('"timestamp":')
      );
      
      consoleSpy.mockRestore();
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => saveDisclosureAcceptance()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save disclosure state:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearDisclosureState', () => {
    it('removes disclosure state from localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      clearDisclosureState();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(DISCLOSURE_STORAGE_KEY);
      
      consoleSpy.mockRestore();
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => clearDisclosureState()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear disclosure state:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete first-visit flow', () => {
      // First visit - no state
      localStorageMock.getItem.mockReturnValue(null);
      expect(shouldShowDisclosure()).toBe(true);
      
      // User accepts disclosure
      saveDisclosureAcceptance();
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Simulate state being saved
      const savedCall = localStorageMock.setItem.mock.calls[0];
      const savedState = JSON.parse(savedCall[1]);
      localStorageMock.getItem.mockReturnValue(savedCall[1]);
      
      // Second visit - should not show disclosure
      expect(shouldShowDisclosure()).toBe(false);
      expect(getDisclosureState()).toEqual(savedState);
    });

    it('handles version upgrade flow', () => {
      // User has old version
      const oldState = {
        disclosureAccepted: true,
        version: '0.9.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldState));
      
      // Should show disclosure for new version
      expect(shouldShowDisclosure()).toBe(true);
      
      // User accepts new version
      saveDisclosureAcceptance();
      
      // Simulate new state being saved
      const savedCall = localStorageMock.setItem.mock.calls[0];
      const newState = JSON.parse(savedCall[1]);
      localStorageMock.getItem.mockReturnValue(savedCall[1]);
      
      // Should not show disclosure anymore
      expect(shouldShowDisclosure()).toBe(false);
      expect(newState.version).toBe(CURRENT_DISCLOSURE_VERSION);
    });
  });
});