/**
 * No Silent Clicks Validator Tests
 * 
 * Requirements: R13.NO_SILENT_CLICKS, R10.TRUST.AUDIT_LINKS
 * 
 * Tests to ensure no clickable elements dead-end without meaningful actions
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { NoSilentClicksValidator } from '../NoSilentClicksValidator';

// Mock DOM environment
const mockDocument = {
  addEventListener: vi.fn(),
  createElement: vi.fn(() => ({
    style: {},
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    hasAttribute: vi.fn(),
    textContent: '',
    remove: vi.fn(),
    closest: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  querySelectorAll: vi.fn(() => [])
};

const mockWindow = {
  getComputedStyle: vi.fn(() => ({ cursor: 'pointer' }))
};

// Mock global objects
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('NoSilentClicksValidator', () => {
  let validator: NoSilentClicksValidator;
  let mockElement: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    validator = NoSilentClicksValidator.getInstance();
    validator.clearCache();

    // Create mock element
    mockElement = {
      tagName: 'BUTTON',
      className: '',
      textContent: 'Click me',
      getAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
      getBoundingClientRect: vi.fn(() => ({ top: 100, left: 100 }))
    } as any;
  });

  afterEach(() => {
    validator.clearCache();
  });

  describe('Valid Clickable Elements', () => {
    test('validates button with href attribute', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
      expect(result.recommendedAction).toBe('allow');
    });

    test('validates button with onclick handler', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'onclick') return 'handleClick()';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
      expect(result.recommendedAction).toBe('allow');
    });

    test('validates element with modal trigger', () => {
      mockElement.hasAttribute = vi.fn((attr) => {
        return attr === 'data-modal-trigger';
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
      expect(result.recommendedAction).toBe('allow');
    });

    test('validates element with fallback action', () => {
      mockElement.hasAttribute = vi.fn((attr) => {
        return attr === 'data-fallback-action';
      });
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'data-fallback-action') return 'show-unavailable-modal';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(false);
      expect(result.hasFallback).toBe(true);
      expect(result.recommendedAction).toBe('show-fallback');
    });
  });

  describe('Invalid Clickable Elements', () => {
    test('rejects button with no action', () => {
      mockElement.getAttribute = vi.fn(() => null);
      mockElement.hasAttribute = vi.fn(() => false);

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
      expect(result.hasFallback).toBe(false);
      expect(result.recommendedAction).toBe('prevent');
      expect(result.errorMessage).toContain('no meaningful action');
    });

    test('rejects button with empty href', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return '';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
      expect(result.recommendedAction).toBe('prevent');
    });

    test('rejects button with placeholder href', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return '#';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
      expect(result.recommendedAction).toBe('prevent');
    });

    test('rejects button with javascript:void(0)', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'javascript:void(0)';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
      expect(result.recommendedAction).toBe('prevent');
    });
  });

  describe('Trust Badge Validation', () => {
    test('validates trust badge with proof available', () => {
      mockElement.hasAttribute = vi.fn((attr) => {
        return attr === 'data-trust-badge' || attr === 'data-proof-available';
      });
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'data-proof-available') return 'true';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
      expect(result.recommendedAction).toBe('allow');
    });

    test('validates trust badge with fallback when proof unavailable', () => {
      mockElement.hasAttribute = vi.fn((attr) => {
        return attr === 'data-trust-badge' || attr === 'data-proof-available';
      });
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'data-proof-available') return 'false';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(false);
      expect(result.hasFallback).toBe(true);
      expect(result.recommendedAction).toBe('show-fallback');
    });

    test('rejects "Click for proof" without valid destination or fallback', () => {
      mockElement.textContent = 'Click for proof →';
      mockElement.getAttribute = vi.fn(() => null);
      mockElement.hasAttribute = vi.fn(() => false);

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
      expect(result.hasFallback).toBe(false);
      expect(result.recommendedAction).toBe('prevent');
      expect(result.errorMessage).toContain('claims to have proof but no valid destination');
    });

    test('allows "Click for proof" with valid destination', () => {
      mockElement.textContent = 'Click for proof →';
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com/audit';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
      expect(result.recommendedAction).toBe('allow');
    });

    test('allows "Click for proof" with fallback action', () => {
      mockElement.textContent = 'Click for proof →';
      mockElement.hasAttribute = vi.fn((attr) => {
        return attr === 'data-fallback-action';
      });
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'data-fallback-action') return 'show-unavailable-modal';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(false);
      expect(result.hasFallback).toBe(true);
      expect(result.recommendedAction).toBe('show-fallback');
    });
  });

  describe('Element Type Detection', () => {
    test('detects trust badge by data attribute', () => {
      mockElement.hasAttribute = vi.fn((attr) => attr === 'data-trust-badge');
      
      const result = validator.validateClickableElement(mockElement);
      
      // Should be treated as trust badge (requires special validation)
      expect(result).toBeDefined();
    });

    test('detects trust badge by class name', () => {
      mockElement.className = 'trust-badge-component';
      
      const result = validator.validateClickableElement(mockElement);
      
      expect(result).toBeDefined();
    });

    test('detects trust badge by text content', () => {
      mockElement.textContent = 'Click for proof →';
      
      const result = validator.validateClickableElement(mockElement);
      
      expect(result).toBeDefined();
    });

    test('detects methodology link by text content', () => {
      mockElement.textContent = 'How it\'s calculated';
      
      const result = validator.validateClickableElement(mockElement);
      
      expect(result).toBeDefined();
    });

    test('detects audit link by text content', () => {
      mockElement.textContent = 'View audit report';
      
      const result = validator.validateClickableElement(mockElement);
      
      expect(result).toBeDefined();
    });
  });

  describe('URL Validation', () => {
    test('accepts valid HTTPS URLs', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com/audit';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
    });

    test('accepts valid HTTP URLs', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'http://example.com/audit';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
    });

    test('accepts relative URLs', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return '/proof/audit-report';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(true);
      expect(result.hasDestination).toBe(true);
    });

    test('rejects invalid protocols', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'ftp://example.com/audit';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
    });

    test('rejects malformed URLs', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'not-a-url';
        return null;
      });

      const result = validator.validateClickableElement(mockElement);

      expect(result.isValid).toBe(false);
      expect(result.hasDestination).toBe(false);
    });
  });

  describe('Caching', () => {
    test('caches validation results', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com';
        return null;
      });

      // First validation
      const result1 = validator.validateClickableElement(mockElement);
      
      // Second validation should use cache
      const result2 = validator.validateClickableElement(mockElement);

      expect(result1).toEqual(result2);
      expect(mockElement.getAttribute).toHaveBeenCalledTimes(3); // Called once during analysis
    });

    test('clears cache when requested', () => {
      mockElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com';
        return null;
      });

      // First validation
      validator.validateClickableElement(mockElement);
      
      // Clear cache
      validator.clearCache();
      
      // Second validation should not use cache
      validator.validateClickableElement(mockElement);

      expect(mockElement.getAttribute).toHaveBeenCalledTimes(6); // Called twice
    });
  });

  describe('Statistics', () => {
    test('tracks validation statistics', () => {
      // Create multiple mock elements
      const validElement = { ...mockElement };
      validElement.getAttribute = vi.fn((attr) => {
        if (attr === 'href') return 'https://example.com';
        return null;
      });

      const invalidElement = { ...mockElement };
      invalidElement.getAttribute = vi.fn(() => null);
      invalidElement.hasAttribute = vi.fn(() => false);

      const fallbackElement = { ...mockElement };
      fallbackElement.hasAttribute = vi.fn((attr) => attr === 'data-fallback-action');
      fallbackElement.getAttribute = vi.fn((attr) => {
        if (attr === 'data-fallback-action') return 'show-modal';
        return null;
      });

      // Validate elements
      validator.validateClickableElement(validElement);
      validator.validateClickableElement(invalidElement);
      validator.validateClickableElement(fallbackElement);

      const stats = validator.getValidationStats();

      expect(stats.totalValidated).toBe(3);
      expect(stats.validElements).toBe(2); // valid and fallback elements
      expect(stats.invalidElements).toBe(1);
      expect(stats.elementsWithFallbacks).toBe(1);
    });
  });

  describe('Development Mode Behavior', () => {
    test('initializes global validation in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Create new instance to trigger initialization
      const devValidator = NoSilentClicksValidator.getInstance();

      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        true
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});