/**
 * No Silent Clicks Validator
 * 
 * Enforces the "No Silent Clicks" rule in development mode by validating
 * that all clickable elements provide appropriate feedback.
 * 
 * Requirements: R13.NO_SILENT_CLICKS
 */

export interface ClickableElement {
  element: HTMLElement;
  hasValidAction: boolean;
  actionType: 'navigation' | 'modal' | 'toast' | 'tooltip' | 'loading' | 'disabled' | 'none';
  reason?: string;
  violation?: string;
}

export class NoSilentClicksValidator {
  private violations: ClickableElement[] = [];
  private isEnabled: boolean;

  constructor() {
    // Only enable in development mode
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Validates all clickable elements on the page
   */
  validateClickableElements(): ClickableElement[] {
    if (!this.isEnabled) {
      return [];
    }

    this.violations = [];
    const clickableSelectors = [
      'button',
      'a',
      '[role="button"]',
      '[role="menuitem"]',
      '[role="menuitemradio"]',
      '[role="tab"]',
      '[onclick]',
      '[data-testid*="button"]',
      '[data-testid*="click"]',
      '.cursor-pointer'
    ];

    const elements = document.querySelectorAll(clickableSelectors.join(', '));
    
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const analysis = this.analyzeElement(htmlElement);
      
      if (!analysis.hasValidAction) {
        this.violations.push(analysis);
      }
    });

    return this.violations;
  }

  /**
   * Analyzes a single element to determine if it follows No Silent Clicks rule
   */
  private analyzeElement(element: HTMLElement): ClickableElement {
    const analysis: ClickableElement = {
      element,
      hasValidAction: false,
      actionType: 'none'
    };

    // Check if element is disabled
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      const hasExplanation = 
        element.hasAttribute('title') ||
        element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-describedby');
      
      if (hasExplanation) {
        analysis.hasValidAction = true;
        analysis.actionType = 'disabled';
        analysis.reason = element.getAttribute('title') || 
                         element.getAttribute('aria-label') || 
                         'Disabled with explanation';
      } else {
        analysis.violation = 'Disabled element lacks explanation (title, aria-label, or aria-describedby)';
      }
      
      return analysis;
    }

    // Check for navigation action
    if (element.hasAttribute('href')) {
      const href = element.getAttribute('href');
      if (href && href !== '#' && href !== 'javascript:void(0)') {
        analysis.hasValidAction = true;
        analysis.actionType = 'navigation';
        analysis.reason = `Navigates to: ${href}`;
        return analysis;
      } else {
        analysis.violation = 'Link has empty or placeholder href';
      }
    }

    // Check for click handler
    if (element.onclick || element.hasAttribute('onclick')) {
      analysis.hasValidAction = true;
      analysis.actionType = 'loading'; // Assume click handlers trigger some action
      analysis.reason = 'Has click handler';
      return analysis;
    }

    // Check for React event handlers (data attributes or class patterns)
    const hasReactHandler = 
      element.className.includes('cursor-pointer') ||
      Array.from(element.attributes).some(attr => 
        attr.name.startsWith('data-') && attr.name.includes('click')
      );

    if (hasReactHandler) {
      analysis.hasValidAction = true;
      analysis.actionType = 'loading';
      analysis.reason = 'Appears to have React click handler';
      return analysis;
    }

    // Check for form submission
    if (element.type === 'submit' || element.getAttribute('type') === 'submit') {
      analysis.hasValidAction = true;
      analysis.actionType = 'loading';
      analysis.reason = 'Form submission button';
      return analysis;
    }

    // Check for modal triggers (common patterns)
    const modalTriggerPatterns = [
      'data-modal',
      'data-dialog',
      'data-popup',
      'aria-haspopup',
      'data-bs-toggle', // Bootstrap
      'data-toggle'     // Generic
    ];

    const isModalTrigger = modalTriggerPatterns.some(pattern => 
      element.hasAttribute(pattern)
    );

    if (isModalTrigger) {
      analysis.hasValidAction = true;
      analysis.actionType = 'modal';
      analysis.reason = 'Modal trigger';
      return analysis;
    }

    // Check for tooltip triggers
    if (element.hasAttribute('title') && element.hasAttribute('aria-describedby')) {
      analysis.hasValidAction = true;
      analysis.actionType = 'tooltip';
      analysis.reason = 'Tooltip trigger';
      return analysis;
    }

    // If we reach here, it's likely a silent click violation
    analysis.violation = 'Clickable element provides no observable feedback';
    return analysis;
  }

  /**
   * Highlights violations on the page for visual debugging
   */
  highlightViolations(): void {
    if (!this.isEnabled) {
      return;
    }

    this.violations.forEach((violation) => {
      const element = violation.element;
      
      // Add visual indicator
      element.style.outline = '2px solid red';
      element.style.outlineOffset = '2px';
      
      // Add tooltip with violation details
      element.title = `Silent Click Violation: ${violation.violation}`;
      
      // Add data attribute for testing
      element.setAttribute('data-silent-click-violation', 'true');
    });
  }

  /**
   * Logs violations to console for debugging
   */
  logViolations(): void {
    if (!this.isEnabled || this.violations.length === 0) {
      return;
    }

    console.group('🚨 No Silent Clicks Violations');
    console.warn(`Found ${this.violations.length} violations:`);
    
    this.violations.forEach((violation, index) => {
      console.group(`Violation ${index + 1}:`);
      console.log('Element:', violation.element);
      console.log('Issue:', violation.violation);
      console.log('Tag:', violation.element.tagName);
      console.log('Classes:', violation.element.className);
      console.log('Text:', violation.element.textContent?.trim());
      console.groupEnd();
    });
    
    console.groupEnd();
  }

  /**
   * Removes all violation highlights
   */
  clearHighlights(): void {
    const violationElements = document.querySelectorAll('[data-silent-click-violation]');
    violationElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.outline = '';
      htmlElement.style.outlineOffset = '';
      htmlElement.removeAttribute('data-silent-click-violation');
      
      // Only remove title if it was added by us (contains "Silent Click Violation")
      if (htmlElement.title?.includes('Silent Click Violation')) {
        htmlElement.title = '';
      }
    });
  }

  /**
   * Runs a complete validation cycle
   */
  validate(): ClickableElement[] {
    if (!this.isEnabled) {
      return [];
    }

    this.clearHighlights();
    const violations = this.validateClickableElements();
    
    if (violations.length > 0) {
      this.highlightViolations();
      this.logViolations();
    } else {
      console.log('✅ No Silent Clicks validation passed - all clickable elements provide feedback');
    }

    return violations;
  }

  /**
   * Sets up automatic validation on DOM changes (for development)
   */
  enableAutoValidation(): void {
    if (!this.isEnabled) {
      return;
    }

    // Debounced validation function
    let validationTimeout: NodeJS.Timeout;
    const debouncedValidate = () => {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => {
        this.validate();
      }, 500);
    };

    // Watch for DOM changes
    const observer = new MutationObserver(debouncedValidate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'href', 'disabled', 'aria-disabled']
    });

    // Initial validation
    setTimeout(() => {
      this.validate();
    }, 1000);

    // Expose validator to window for manual testing
    if (typeof window !== 'undefined') {
      (window as Window & { noSilentClicksValidator?: NoSilentClicksValidator }).noSilentClicksValidator = this;
    }
  }
}

// Create singleton instance
export const noSilentClicksValidator = new NoSilentClicksValidator();

// Auto-enable in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      noSilentClicksValidator.enableAutoValidation();
    });
  } else {
    noSilentClicksValidator.enableAutoValidation();
  }
}