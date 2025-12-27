/**
 * Accessibility Hook for HarvestPro Components
 * 
 * Provides accessibility utilities and state management for WCAG AA compliance
 * 
 * Requirements: Enhanced Req 18 AC4-5 (accessibility standards)
 * Design: Accessibility → Compliance Validation
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  FocusManager, 
  ScreenReaderUtils,
  generateAriaId,
  handleKeyboardActivation 
} from '@/lib/accessibility/utils';

export interface UseAccessibilityOptions {
  /**
   * Component name for generating unique IDs
   */
  componentName: string;
  
  /**
   * Unique identifier for this instance
   */
  instanceId: string;
  
  /**
   * Whether this component is a modal or dialog
   */
  isModal?: boolean;
  
  /**
   * Whether to manage focus automatically
   */
  manageFocus?: boolean;
  
  /**
   * Whether to announce status changes
   */
  announceChanges?: boolean;
}

export interface AccessibilityState {
  /**
   * Generated ARIA IDs for this component
   */
  ariaIds: {
    title: string;
    description: string;
    content: string;
    status: string;
  };
  
  /**
   * Focus management utilities
   */
  focus: {
    store: () => void;
    restore: () => void;
    trapInContainer: (event: React.KeyboardEvent) => void;
    focusFirst: () => void;
  };
  
  /**
   * Screen reader utilities
   */
  screenReader: {
    announce: (message: string, level?: 'polite' | 'assertive') => void;
    isActive: boolean;
  };
  
  /**
   * Keyboard event handlers
   */
  keyboard: {
    handleActivation: (event: React.KeyboardEvent, callback: () => void) => void;
    handleEscape: (event: React.KeyboardEvent, callback: () => void) => void;
  };
  
  /**
   * Modal-specific utilities
   */
  modal: {
    props: {
      role: 'dialog';
      'aria-modal': true;
      'aria-labelledby': string;
      'aria-describedby': string;
    };
    lockBodyScroll: () => void;
    unlockBodyScroll: () => void;
  };
}

export function useAccessibility(options: UseAccessibilityOptions): AccessibilityState {
  const {
    componentName,
    instanceId,
    isModal = false,
    manageFocus = false,
    announceChanges = false,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const originalBodyOverflow = useRef<string>('');

  // Generate unique ARIA IDs
  const ariaIds = {
    title: generateAriaId(`${componentName}-title`, instanceId),
    description: generateAriaId(`${componentName}-description`, instanceId),
    content: generateAriaId(`${componentName}-content`, instanceId),
    status: generateAriaId(`${componentName}-status`, instanceId),
  };

  // Focus management
  const storeFocus = useCallback(() => {
    if (manageFocus) {
      FocusManager.storeFocus();
    }
  }, [manageFocus]);

  const restoreFocus = useCallback(() => {
    if (manageFocus) {
      FocusManager.restoreFocus();
    }
  }, [manageFocus]);

  const trapFocusInContainer = useCallback((event: React.KeyboardEvent) => {
    if (containerRef.current && isModal) {
      FocusManager.trapFocus(containerRef.current, event.nativeEvent);
    }
  }, [isModal]);

  const focusFirst = useCallback(() => {
    if (containerRef.current && manageFocus) {
      FocusManager.focusFirst(containerRef.current);
    }
  }, [manageFocus]);

  // Screen reader utilities
  const announce = useCallback((message: string, level: 'polite' | 'assertive' = 'polite') => {
    if (announceChanges) {
      ScreenReaderUtils.announce(message, level);
    }
  }, [announceChanges]);

  const isScreenReaderActive = ScreenReaderUtils.isScreenReaderActive();

  // Keyboard event handlers
  const handleActivation = useCallback((event: React.KeyboardEvent, callback: () => void) => {
    handleKeyboardActivation(event, callback);
  }, []);

  const handleEscape = useCallback((event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  }, []);

  // Modal-specific utilities
  const lockBodyScroll = useCallback(() => {
    if (isModal) {
      originalBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }, [isModal]);

  const unlockBodyScroll = useCallback(() => {
    if (isModal) {
      document.body.style.overflow = originalBodyOverflow.current || 'unset';
    }
  }, [isModal]);

  // Modal focus management
  useEffect(() => {
    if (isModal && manageFocus) {
      storeFocus();
      
      // Focus first element after a brief delay to ensure modal is rendered
      const timer = setTimeout(() => {
        focusFirst();
      }, 100);

      return () => {
        clearTimeout(timer);
        restoreFocus();
      };
    }
  }, [isModal, manageFocus, storeFocus, restoreFocus, focusFirst]);

  // Body scroll lock for modals
  useEffect(() => {
    if (isModal) {
      lockBodyScroll();
      return unlockBodyScroll;
    }
  }, [isModal, lockBodyScroll, unlockBodyScroll]);

  // Keyboard event listeners for modals
  useEffect(() => {
    if (isModal) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // This will be handled by the component using the hook
          return;
        }
        
        if (event.key === 'Tab' && containerRef.current) {
          FocusManager.trapFocus(containerRef.current, event);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModal]);

  return {
    ariaIds,
    focus: {
      store: storeFocus,
      restore: restoreFocus,
      trapInContainer: trapFocusInContainer,
      focusFirst,
    },
    screenReader: {
      announce,
      isActive: isScreenReaderActive,
    },
    keyboard: {
      handleActivation,
      handleEscape,
    },
    modal: {
      props: {
        role: 'dialog' as const,
        'aria-modal': true as const,
        'aria-labelledby': ariaIds.title,
        'aria-describedby': ariaIds.description,
      },
      lockBodyScroll,
      unlockBodyScroll,
    },
  };
}

/**
 * Hook for managing loading states with accessibility
 */
export function useAccessibleLoading(isLoading: boolean, loadingMessage: string = 'Loading') {
  const announce = useCallback((message: string) => {
    ScreenReaderUtils.announce(message, 'polite');
  }, []);

  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage);
    }
  }, [isLoading, loadingMessage, announce]);

  return {
    loadingProps: {
      'aria-busy': isLoading,
      'aria-live': 'polite' as const,
      'aria-label': isLoading ? loadingMessage : undefined,
    },
    announce,
  };
}

/**
 * Hook for managing error states with accessibility
 */
export function useAccessibleError(error: string | null, errorMessage: string = 'An error occurred') {
  const announce = useCallback((message: string) => {
    ScreenReaderUtils.announce(message, 'assertive');
  }, []);

  useEffect(() => {
    if (error) {
      announce(errorMessage);
    }
  }, [error, errorMessage, announce]);

  return {
    errorProps: {
      role: 'alert' as const,
      'aria-live': 'assertive' as const,
      'aria-atomic': true,
    },
    announce,
  };
}

/**
 * Hook for managing form accessibility
 */
export function useAccessibleForm() {
  const announceValidation = useCallback((message: string, isError: boolean = false) => {
    ScreenReaderUtils.announce(message, isError ? 'assertive' : 'polite');
  }, []);

  const createFieldProps = useCallback((
    fieldName: string,
    options?: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string;
    }
  ) => {
    const fieldId = generateAriaId('field', fieldName);
    const errorId = generateAriaId('error', fieldName);
    
    return {
      id: fieldId,
      'aria-required': options?.required,
      'aria-invalid': options?.invalid,
      'aria-describedby': options?.invalid ? errorId : options?.describedBy,
      errorId,
    };
  }, []);

  return {
    announceValidation,
    createFieldProps,
  };
}

/**
 * Hook for managing list accessibility
 */
export function useAccessibleList(listLabel: string) {
  const listId = generateAriaId('list', listLabel.toLowerCase().replace(/\s+/g, '-'));
  
  const createListProps = useCallback(() => ({
    role: 'list' as const,
    'aria-label': listLabel,
    id: listId,
  }), [listLabel, listId]);

  const createListItemProps = useCallback((
    itemId: string,
    options?: {
      labelledBy?: string;
      describedBy?: string;
    }
  ) => ({
    role: 'listitem' as const,
    'aria-labelledby': options?.labelledBy,
    'aria-describedby': options?.describedBy,
    id: generateAriaId('listitem', itemId),
  }), []);

  return {
    listProps: createListProps(),
    createListItemProps,
  };
}

/**
 * Hook for managing button accessibility
 */
export function useAccessibleButton() {
  const createButtonProps = useCallback((
    label: string,
    options?: {
      describedBy?: string;
      pressed?: boolean;
      expanded?: boolean;
      controls?: string;
      disabled?: boolean;
    }
  ) => ({
    'aria-label': label,
    'aria-describedby': options?.describedBy,
    'aria-pressed': options?.pressed,
    'aria-expanded': options?.expanded,
    'aria-controls': options?.controls,
    'aria-disabled': options?.disabled,
    title: label,
  }), []);

  return {
    createButtonProps,
  };
}