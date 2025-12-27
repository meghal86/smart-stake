/**
 * Accessibility Utilities for HarvestPro
 * 
 * Common accessibility patterns and helpers to ensure WCAG AA compliance
 * 
 * Requirements: Enhanced Req 18 AC4-5 (accessibility standards)
 * Design: Accessibility → Compliance Validation
 */

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateAriaId(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

/**
 * Create accessible button props with proper ARIA attributes
 */
export interface AccessibleButtonProps {
  'aria-label': string;
  'aria-describedby'?: string;
  title?: string;
  role?: string;
}

export function createAccessibleButton(
  label: string,
  options?: {
    describedBy?: string;
    title?: string;
    role?: string;
  }
): AccessibleButtonProps {
  return {
    'aria-label': label,
    'aria-describedby': options?.describedBy,
    title: options?.title || label,
    role: options?.role,
  };
}

/**
 * Create accessible modal props
 */
export interface AccessibleModalProps {
  role: 'dialog';
  'aria-modal': true;
  'aria-labelledby': string;
  'aria-describedby'?: string;
}

export function createAccessibleModal(
  titleId: string,
  descriptionId?: string
): AccessibleModalProps {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
  };
}

/**
 * Create accessible form field props
 */
export interface AccessibleFormFieldProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export function createAccessibleFormField(
  label?: string,
  options?: {
    describedBy?: string;
    invalid?: boolean;
    required?: boolean;
  }
): AccessibleFormFieldProps {
  return {
    'aria-label': label,
    'aria-describedby': options?.describedBy,
    'aria-invalid': options?.invalid,
    'aria-required': options?.required,
  };
}

/**
 * Create accessible list props
 */
export interface AccessibleListProps {
  role: 'list';
  'aria-label': string;
}

export function createAccessibleList(label: string): AccessibleListProps {
  return {
    role: 'list',
    'aria-label': label,
  };
}

/**
 * Create accessible list item props
 */
export interface AccessibleListItemProps {
  role: 'listitem';
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function createAccessibleListItem(
  labelledBy?: string,
  describedBy?: string
): AccessibleListItemProps {
  return {
    role: 'listitem',
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  };
}

/**
 * Create accessible region props
 */
export interface AccessibleRegionProps {
  role: 'region';
  'aria-labelledby': string;
}

export function createAccessibleRegion(labelledBy: string): AccessibleRegionProps {
  return {
    role: 'region',
    'aria-labelledby': labelledBy,
  };
}

/**
 * Create accessible status announcement props
 */
export interface AccessibleStatusProps {
  role: 'status' | 'alert';
  'aria-live': 'polite' | 'assertive';
  'aria-atomic'?: boolean;
}

export function createAccessibleStatus(
  type: 'status' | 'alert' = 'status',
  live: 'polite' | 'assertive' = 'polite',
  atomic: boolean = true
): AccessibleStatusProps {
  return {
    role: type,
    'aria-live': live,
    'aria-atomic': atomic,
  };
}

/**
 * Format currency values for screen readers
 */
export function formatCurrencyForScreenReader(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  
  // Convert "$1,234" to "1,234 dollars" for better screen reader pronunciation
  return formatted.replace('$', '').replace(/,/g, ' ') + ' dollars';
}

/**
 * Format percentage values for screen readers
 */
export function formatPercentageForScreenReader(value: number): string {
  return `${value} percent`;
}

/**
 * Create accessible loading state props
 */
export interface AccessibleLoadingProps {
  'aria-busy': boolean;
  'aria-live': 'polite';
  'aria-label': string;
}

export function createAccessibleLoading(label: string): AccessibleLoadingProps {
  return {
    'aria-busy': true,
    'aria-live': 'polite',
    'aria-label': label,
  };
}

/**
 * Create accessible error state props
 */
export interface AccessibleErrorProps {
  role: 'alert';
  'aria-live': 'assertive';
  'aria-atomic': boolean;
}

export function createAccessibleError(): AccessibleErrorProps {
  return {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': true,
  };
}

/**
 * Keyboard event handler for Enter and Space keys
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static previousFocus: HTMLElement | null = null;

  /**
   * Store the currently focused element
   */
  static storeFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  /**
   * Restore focus to the previously focused element
   */
  static restoreFocus(): void {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  /**
   * Focus the first focusable element within a container
   */
  static focusFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  /**
   * Trap focus within a container (for modals)
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Color contrast utilities
 */
export class ContrastChecker {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  static meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
  }

  /**
   * Check if contrast ratio meets WCAG AAA standards
   */
  static meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Create a live region for announcements
   */
  static createLiveRegion(id: string, level: 'polite' | 'assertive' = 'polite'): HTMLElement {
    let region = document.getElementById(id);
    
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', level);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }
    
    return region;
  }

  /**
   * Announce a message to screen readers
   */
  static announce(message: string, level: 'polite' | 'assertive' = 'polite'): void {
    const region = this.createLiveRegion('sr-announcements', level);
    region.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }

  /**
   * Check if screen reader is likely active
   */
  static isScreenReaderActive(): boolean {
    // This is a heuristic - not 100% reliable
    return window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking ||
           false;
  }
}

/**
 * Touch target utilities
 */
export class TouchTargetUtils {
  /**
   * Check if an element meets minimum touch target size (44x44px)
   */
  static meetsTouchTargetSize(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }

  /**
   * Get recommended touch target size adjustments
   */
  static getTouchTargetAdjustments(element: HTMLElement): {
    width: number;
    height: number;
    needsAdjustment: boolean;
  } {
    const rect = element.getBoundingClientRect();
    const minSize = 44;
    
    return {
      width: Math.max(minSize, rect.width),
      height: Math.max(minSize, rect.height),
      needsAdjustment: rect.width < minSize || rect.height < minSize,
    };
  }
}