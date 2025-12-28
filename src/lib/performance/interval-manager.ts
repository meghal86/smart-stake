/**
 * Interval and Timeout Management
 * 
 * Centralized management of intervals and timeouts to prevent memory leaks
 * Requirements: R1-AC4, R22-AC4
 */

import React from 'react';

class IntervalManager {
  private intervals = new Set<NodeJS.Timeout>();
  private timeouts = new Set<NodeJS.Timeout>();

  /**
   * Create a managed interval that will be automatically cleaned up
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Create a managed timeout that will be automatically cleaned up
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      callback();
      this.timeouts.delete(timeout);
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  /**
   * Clear a specific interval
   */
  clearInterval(interval: NodeJS.Timeout) {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(timeout: NodeJS.Timeout) {
    clearTimeout(timeout);
    this.timeouts.delete(timeout);
  }

  /**
   * Clear all managed intervals and timeouts
   */
  clearAll() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Clear all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  /**
   * Get statistics about managed timers
   */
  getStats() {
    return {
      activeIntervals: this.intervals.size,
      activeTimeouts: this.timeouts.size,
      total: this.intervals.size + this.timeouts.size,
    };
  }
}

// Global instance
export const intervalManager = new IntervalManager();

/**
 * React hook for managed intervals
 */
export function useManagedInterval(callback: () => void, delay: number | null) {
  const callbackRef = React.useRef(callback);
  
  // Update callback ref when callback changes
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) return;

    const interval = intervalManager.setInterval(() => {
      callbackRef.current();
    }, delay);

    return () => intervalManager.clearInterval(interval);
  }, [delay]);
}

/**
 * React hook for managed timeouts
 */
export function useManagedTimeout(callback: () => void, delay: number | null) {
  const callbackRef = React.useRef(callback);
  
  // Update callback ref when callback changes
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay === null) return;

    const timeout = intervalManager.setTimeout(() => {
      callbackRef.current();
    }, delay);

    return () => intervalManager.clearTimeout(timeout);
  }, [delay]);
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    intervalManager.clearAll();
  });

  // Also cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optionally pause intervals when tab is hidden
      console.log('Tab hidden - intervals continue running');
    }
  });
}