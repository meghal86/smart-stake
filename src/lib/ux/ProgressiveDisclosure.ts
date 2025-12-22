/**
 * Progressive Disclosure System
 * 
 * Manages expandable content with smooth animations and scroll position maintenance.
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DisclosureState {
  isExpanded: boolean;
  isAnimating: boolean;
  contentHeight: number;
}

export interface DisclosureOptions {
  /** Animation duration in milliseconds (default: 300) */
  duration?: number;
  /** Easing function (default: 'ease-out') */
  easing?: string;
  /** Whether to maintain scroll position during expansion */
  maintainScrollPosition?: boolean;
  /** Whether to auto-collapse other expanded items */
  autoCollapse?: boolean;
  /** Callback when expansion state changes */
  onStateChange?: (isExpanded: boolean) => void;
}

export interface DisclosureManager {
  /** Current disclosure state */
  state: DisclosureState;
  /** Toggle expansion state */
  toggle: () => void;
  /** Expand the content */
  expand: () => void;
  /** Collapse the content */
  collapse: () => void;
  /** Ref for the content container */
  contentRef: React.RefObject<HTMLDivElement>;
  /** Ref for the expandable content */
  expandableRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for managing progressive disclosure state
 */
export function useProgressiveDisclosure(
  id: string,
  options: DisclosureOptions = {}
): DisclosureManager {
  const {
    duration = 300,
    easing = 'ease-out',
    maintainScrollPosition = true,
    autoCollapse = false,
    onStateChange
  } = options;

  const [state, setState] = useState<DisclosureState>({
    isExpanded: false,
    isAnimating: false,
    contentHeight: 0
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const expandableRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Store scroll position before expansion
  const storeScrollPosition = useCallback(() => {
    if (maintainScrollPosition && contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      scrollPositionRef.current = rect.top + window.scrollY;
    }
  }, [maintainScrollPosition]);

  // Restore scroll position after expansion
  const restoreScrollPosition = useCallback(() => {
    if (maintainScrollPosition && contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const currentTop = rect.top + window.scrollY;
      const diff = currentTop - scrollPositionRef.current;
      
      if (Math.abs(diff) > 5) { // Only adjust if significant difference
        window.scrollTo({
          top: window.scrollY - diff,
          behavior: 'smooth'
        });
      }
    }
  }, [maintainScrollPosition]);

  // Measure content height
  const measureContentHeight = useCallback(() => {
    if (expandableRef.current) {
      const height = expandableRef.current.scrollHeight;
      setState(prev => ({ ...prev, contentHeight: height }));
      return height;
    }
    return 0;
  }, []);

  // Toggle expansion state
  const toggle = useCallback(() => {
    setState(prev => {
      const newExpanded = !prev.isExpanded;
      
      if (newExpanded) {
        storeScrollPosition();
      }
      
      // Start animation
      const newState = {
        ...prev,
        isExpanded: newExpanded,
        isAnimating: true
      };
      
      // Measure height if expanding
      if (newExpanded && expandableRef.current) {
        newState.contentHeight = expandableRef.current.scrollHeight;
      }
      
      // End animation after duration
      setTimeout(() => {
        setState(current => ({ ...current, isAnimating: false }));
        
        if (newExpanded) {
          // Restore scroll position after expansion completes
          setTimeout(restoreScrollPosition, 50);
        }
      }, duration);
      
      onStateChange?.(newExpanded);
      return newState;
    });
  }, [duration, onStateChange, storeScrollPosition, restoreScrollPosition]);

  const expand = useCallback(() => {
    if (!state.isExpanded) {
      toggle();
    }
  }, [state.isExpanded, toggle]);

  const collapse = useCallback(() => {
    if (state.isExpanded) {
      toggle();
    }
  }, [state.isExpanded, toggle]);

  // Auto-collapse functionality (for accordion-style behavior)
  useEffect(() => {
    if (autoCollapse && state.isExpanded) {
      const handleOtherExpansion = (event: CustomEvent) => {
        if (event.detail.id !== id && event.detail.expanded) {
          collapse();
        }
      };

      window.addEventListener('disclosure-expanded', handleOtherExpansion as EventListener);
      return () => {
        window.removeEventListener('disclosure-expanded', handleOtherExpansion as EventListener);
      };
    }
  }, [autoCollapse, state.isExpanded, id, collapse]);

  // Dispatch expansion event for auto-collapse
  useEffect(() => {
    if (autoCollapse && state.isExpanded) {
      const event = new CustomEvent('disclosure-expanded', {
        detail: { id, expanded: true }
      });
      window.dispatchEvent(event);
    }
  }, [autoCollapse, state.isExpanded, id]);

  // Re-measure height on content changes
  useEffect(() => {
    if (state.isExpanded) {
      measureContentHeight();
    }
  }, [state.isExpanded, measureContentHeight]);

  return {
    state,
    toggle,
    expand,
    collapse,
    contentRef,
    expandableRef
  };
}

/**
 * CSS-in-JS styles for smooth animations
 */
export const getDisclosureStyles = (
  state: DisclosureState,
  options: DisclosureOptions = {}
) => {
  const { duration = 300, easing = 'ease-out' } = options;
  
  return {
    container: {
      overflow: 'hidden',
      transition: `height ${duration}ms ${easing}`,
      height: state.isExpanded ? `${state.contentHeight}px` : '0px'
    },
    content: {
      opacity: state.isExpanded ? 1 : 0,
      transition: `opacity ${duration * 0.8}ms ${easing} ${state.isExpanded ? duration * 0.2 : 0}ms`,
      transform: state.isExpanded ? 'translateY(0)' : 'translateY(-10px)'
    }
  };
};

/**
 * Utility for creating disclosure animation classes
 */
export const createDisclosureClasses = (
  state: DisclosureState,
  options: DisclosureOptions = {}
) => {
  const { duration = 300 } = options;
  
  return {
    container: [
      'overflow-hidden',
      'transition-all',
      `duration-[${duration}ms]`,
      'ease-out'
    ].join(' '),
    content: [
      'transition-all',
      `duration-[${Math.round(duration * 0.8)}ms]`,
      'ease-out',
      state.isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    ].join(' ')
  };
};