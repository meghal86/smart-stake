/**
 * No Silent Clicks Validator
 * 
 * Requirements: R13.NO_SILENT_CLICKS, R10.TRUST.AUDIT_LINKS
 * 
 * Runtime validation system to prevent dead-end clicks on trust badges
 * and other interactive elements.
 */

export interface ClickableElement {
  element: HTMLElement;
  type: 'trust-badge' | 'proof-link' | 'methodology-link' | 'audit-link' | 'button' | 'link';
  hasValidDestination: boolean;
  destinationUrl?: string;
  fallbackAction?: () => void;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasDestination: boolean;
  hasFallback: boolean;
  errorMessage?: string;
  recommendedAction: 'allow' | 'show-fallback' | 'show-error' | 'prevent';
}

/**
 * No Silent Clicks Validator
 * 
 * Ensures all clickable elements have meaningful actions and never dead-end
 */
export class NoSilentClicksValidator {
  private static instance: NoSilentClicksValidator;
  private validatedElements: Map<HTMLElement, ValidationResult> = new Map();
  private isDevelopmentMode: boolean;

  private constructor() {
    this.isDevelopmentMode = process.env.NODE_ENV === 'development';
    this.initializeGlobalValidation();
  }

  static getInstance(): NoSilentClicksValidator {
    if (!NoSilentClicksValidator.instance) {
      NoSilentClicksValidator.instance = new NoSilentClicksValidator();
    }
    return NoSilentClicksValidator.instance;
  }

  /**
   * Initialize global click validation in development mode
   */
  private initializeGlobalValidation(): void {
    if (!this.isDevelopmentMode) return;

    // Add global click listener to catch potential dead-end clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (this.isClickableElement(target)) {
        const validation = this.validateClickableElement(target);
        if (validation.recommendedAction === 'prevent') {
          event.preventDefault();
          event.stopPropagation();
          this.showValidationError(target, validation);
        }
      }
    }, true);
  }

  /**
   * Validate a clickable element to ensure it has a meaningful action
   */
  validateClickableElement(element: HTMLElement): ValidationResult {
    // Check cache first
    const cached = this.validatedElements.get(element);
    if (cached) {
      return cached;
    }

    const clickableInfo = this.analyzeClickableElement(element);
    const validation = this.performValidation(clickableInfo);
    
    // Cache the result
    this.validatedElements.set(element, validation);
    
    return validation;
  }

  /**
   * Analyze a clickable element to determine its properties
   */
  private analyzeClickableElement(element: HTMLElement): ClickableElement {
    const type = this.determineElementType(element);
    const hasValidDestination = this.hasValidDestination(element);
    const destinationUrl = this.getDestinationUrl(element);
    const fallbackAction = this.getFallbackAction(element);
    const errorMessage = this.getErrorMessage(element);

    return {
      element,
      type,
      hasValidDestination,
      destinationUrl,
      fallbackAction,
      errorMessage
    };
  }

  /**
   * Perform validation logic
   */
  private performValidation(clickable: ClickableElement): ValidationResult {
    // Trust badges and proof links have special validation
    if (clickable.type === 'trust-badge' || clickable.type === 'proof-link') {
      return this.validateTrustElement(clickable);
    }

    // General clickable element validation
    if (clickable.hasValidDestination) {
      return {
        isValid: true,
        hasDestination: true,
        hasFallback: false,
        recommendedAction: 'allow'
      };
    }

    if (clickable.fallbackAction) {
      return {
        isValid: true,
        hasDestination: false,
        hasFallback: true,
        recommendedAction: 'show-fallback'
      };
    }

    return {
      isValid: false,
      hasDestination: false,
      hasFallback: false,
      errorMessage: clickable.errorMessage || 'This element has no meaningful action',
      recommendedAction: 'prevent'
    };
  }

  /**
   * Special validation for trust elements
   */
  private validateTrustElement(clickable: ClickableElement): ValidationResult {
    // Check if it's a trust badge with proof content
    if (clickable.element.hasAttribute('data-proof-available')) {
      const proofAvailable = clickable.element.getAttribute('data-proof-available') === 'true';
      
      if (proofAvailable) {
        return {
          isValid: true,
          hasDestination: true,
          hasFallback: false,
          recommendedAction: 'allow'
        };
      } else {
        // Has fallback for unavailable proof
        return {
          isValid: true,
          hasDestination: false,
          hasFallback: true,
          recommendedAction: 'show-fallback'
        };
      }
    }

    // Check for "Click for proof" text without actual proof
    const textContent = clickable.element.textContent?.toLowerCase() || '';
    if (textContent.includes('click for proof') || textContent.includes('view proof')) {
      if (!clickable.hasValidDestination && !clickable.fallbackAction) {
        return {
          isValid: false,
          hasDestination: false,
          hasFallback: false,
          errorMessage: 'Trust badge claims to have proof but no valid destination or fallback',
          recommendedAction: 'prevent'
        };
      }
    }

    return {
      isValid: true,
      hasDestination: clickable.hasValidDestination,
      hasFallback: !!clickable.fallbackAction,
      recommendedAction: 'allow'
    };
  }

  /**
   * Determine the type of clickable element
   */
  private determineElementType(element: HTMLElement): ClickableElement['type'] {
    // Check data attributes first
    if (element.hasAttribute('data-trust-badge')) return 'trust-badge';
    if (element.hasAttribute('data-proof-link')) return 'proof-link';
    if (element.hasAttribute('data-methodology-link')) return 'methodology-link';
    if (element.hasAttribute('data-audit-link')) return 'audit-link';

    // Check class names
    const className = element.className.toLowerCase();
    if (className.includes('trust-badge')) return 'trust-badge';
    if (className.includes('proof-link')) return 'proof-link';
    if (className.includes('methodology')) return 'methodology-link';
    if (className.includes('audit')) return 'audit-link';

    // Check text content
    const textContent = element.textContent?.toLowerCase() || '';
    if (textContent.includes('click for proof') || textContent.includes('view proof')) {
      return 'trust-badge';
    }
    if (textContent.includes('methodology') || textContent.includes('how it\'s calculated')) {
      return 'methodology-link';
    }
    if (textContent.includes('audit') || textContent.includes('security report')) {
      return 'audit-link';
    }

    // Default types
    if (element.tagName === 'A') return 'link';
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') return 'button';

    return 'button';
  }

  /**
   * Check if element has a valid destination
   */
  private hasValidDestination(element: HTMLElement): boolean {
    // Check for href attribute
    const href = element.getAttribute('href');
    if (href && href !== '#' && href !== 'javascript:void(0)' && href !== '') {
      return this.isValidUrl(href);
    }

    // Check for onclick handler
    const onclick = element.getAttribute('onclick');
    if (onclick && onclick.trim() !== '') {
      return true;
    }

    // Check for React event handlers (data attributes)
    if (element.hasAttribute('data-has-click-handler')) {
      return element.getAttribute('data-has-click-handler') === 'true';
    }

    // Check for modal triggers
    if (element.hasAttribute('data-modal-trigger') || 
        element.hasAttribute('data-opens-modal') ||
        element.hasAttribute('aria-haspopup')) {
      return true;
    }

    return false;
  }

  /**
   * Get destination URL if available
   */
  private getDestinationUrl(element: HTMLElement): string | undefined {
    const href = element.getAttribute('href');
    if (href && href !== '#') {
      return href;
    }

    const dataUrl = element.getAttribute('data-url');
    if (dataUrl) {
      return dataUrl;
    }

    return undefined;
  }

  /**
   * Get fallback action if available
   */
  private getFallbackAction(element: HTMLElement): (() => void) | undefined {
    // Check if element has a fallback action defined
    if (element.hasAttribute('data-fallback-action')) {
      return () => {
        const action = element.getAttribute('data-fallback-action');
        if (action === 'show-unavailable-modal') {
          this.showUnavailableModal(element);
        }
      };
    }

    return undefined;
  }

  /**
   * Get error message for invalid elements
   */
  private getErrorMessage(element: HTMLElement): string | undefined {
    return element.getAttribute('data-error-message') || undefined;
  }

  /**
   * Check if element is clickable
   */
  private isClickableElement(element: HTMLElement): boolean {
    // Check tag names
    if (['A', 'BUTTON'].includes(element.tagName)) {
      return true;
    }

    // Check role attribute
    if (element.getAttribute('role') === 'button') {
      return true;
    }

    // Check for cursor pointer
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
      return true;
    }

    // Check for click-related attributes
    if (element.hasAttribute('onclick') || 
        element.hasAttribute('data-clickable') ||
        element.hasAttribute('tabindex')) {
      return true;
    }

    return false;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    // Relative URLs are valid
    if (url.startsWith('/')) {
      return true;
    }

    // Check absolute URLs
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Show validation error in development mode
   */
  private showValidationError(element: HTMLElement, validation: ValidationResult): void {
    if (!this.isDevelopmentMode) return;

    console.error('🚫 No Silent Clicks Violation:', {
      element,
      validation,
      elementText: element.textContent?.trim(),
      elementHTML: element.outerHTML
    });

    // Highlight the problematic element
    element.style.outline = '3px solid red';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    
    // Show tooltip with error
    const tooltip = document.createElement('div');
    tooltip.textContent = validation.errorMessage || 'This element has no meaningful action';
    tooltip.style.cssText = `
      position: absolute;
      background: red;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.left = `${rect.left}px`;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
      document.body.removeChild(tooltip);
      element.style.outline = '';
      element.style.backgroundColor = '';
    }, 3000);
  }

  /**
   * Show unavailable modal for elements with fallback
   */
  private showUnavailableModal(element: HTMLElement): void {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      ">
        <div style="
          background: #1e293b;
          color: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          text-align: center;
        ">
          <h3 style="margin: 0 0 16px 0; color: #fbbf24;">Content Temporarily Unavailable</h3>
          <p style="margin: 0 0 16px 0; color: #d1d5db;">
            The verification content for this element is temporarily unavailable. 
            We show this honest status instead of a broken link.
          </p>
          <button onclick="this.closest('div').remove()" style="
            background: #0891b2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
          ">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validatedElements.clear();
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidated: number;
    validElements: number;
    invalidElements: number;
    elementsWithFallbacks: number;
  } {
    const results = Array.from(this.validatedElements.values());
    
    return {
      totalValidated: results.length,
      validElements: results.filter(r => r.isValid).length,
      invalidElements: results.filter(r => !r.isValid).length,
      elementsWithFallbacks: results.filter(r => r.hasFallback).length
    };
  }
}

/**
 * Hook for using no silent clicks validation
 */
export function useNoSilentClicksValidation() {
  const validator = NoSilentClicksValidator.getInstance();

  return {
    validateElement: (element: HTMLElement) => validator.validateClickableElement(element),
    clearCache: () => validator.clearCache(),
    getStats: () => validator.getValidationStats()
  };
}

/**
 * React component wrapper to ensure no silent clicks
 */
interface NoSilentClicksWrapperProps {
  children: React.ReactNode;
  fallbackAction?: () => void;
  errorMessage?: string;
}

export const NoSilentClicksWrapper = ({ 
  children, 
  fallbackAction, 
  errorMessage 
}: NoSilentClicksWrapperProps) => {
  // Import React dynamically to avoid issues
  const React = require('react');
  const ref = React.useRef<HTMLDivElement>(null);
  const validator = NoSilentClicksValidator.getInstance();

  React.useEffect(() => {
    if (ref.current) {
      // Add data attributes for validation
      if (fallbackAction) {
        ref.current.setAttribute('data-fallback-action', 'show-unavailable-modal');
      }
      if (errorMessage) {
        ref.current.setAttribute('data-error-message', errorMessage);
      }
      
      // Validate the element
      validator.validateClickableElement(ref.current);
    }
  }, [validator, fallbackAction, errorMessage]);

  return React.createElement('div', { ref }, children);
};