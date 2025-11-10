/**
 * React Hooks for Analytics
 * 
 * Provides React hooks for easy analytics integration in components.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  trackFeedView,
  trackFilterChange,
  trackCardImpression,
  trackCardClick,
  trackSave,
  trackReport,
  trackCTAClick,
  trackScrollDepth,
} from './tracker';

/**
 * Hook to track feed view on mount
 */
export function useFeedViewTracking(params: {
  tab?: string;
  hasWallet: boolean;
  filterCount: number;
  walletAddress?: string;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackFeedView(params);
      tracked.current = true;
    }
  }, [params.tab, params.hasWallet, params.filterCount, params.walletAddress]);
}

/**
 * Hook to track filter changes
 */
export function useFilterChangeTracking(walletAddress?: string) {
  return useCallback(
    (filterType: string, filterValue: any, activeFilters: Record<string, any>) => {
      trackFilterChange({
        filterType,
        filterValue,
        activeFilters,
        walletAddress,
      });
    },
    [walletAddress]
  );
}

/**
 * Hook to track card impressions with Intersection Observer
 */
export function useCardImpressionTracking(params: {
  opportunityId: string;
  opportunityType: string;
  trustLevel: string;
  position: number;
  isSponsored: boolean;
  isFeatured: boolean;
  walletAddress?: string;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || tracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            trackCardImpression(params);
            tracked.current = true;
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [params]);

  return elementRef;
}

/**
 * Hook to track card clicks
 */
export function useCardClickTracking(walletAddress?: string) {
  return useCallback(
    (params: {
      opportunityId: string;
      opportunityType: string;
      trustLevel: string;
      position: number;
      isSponsored: boolean;
      isFeatured: boolean;
    }) => {
      trackCardClick({
        ...params,
        walletAddress,
      });
    },
    [walletAddress]
  );
}

/**
 * Hook to track save actions
 */
export function useSaveTracking(walletAddress?: string) {
  return useCallback(
    (opportunityId: string, opportunityType: string, action: 'save' | 'unsave') => {
      trackSave({
        opportunityId,
        opportunityType,
        action,
        walletAddress,
      });
    },
    [walletAddress]
  );
}

/**
 * Hook to track report actions
 */
export function useReportTracking(walletAddress?: string) {
  return useCallback(
    (opportunityId: string, reportCategory: string) => {
      trackReport({
        opportunityId,
        reportCategory,
        walletAddress,
      });
    },
    [walletAddress]
  );
}

/**
 * Hook to track CTA clicks
 */
export function useCTAClickTracking(walletAddress?: string) {
  return useCallback(
    (params: {
      opportunityId: string;
      opportunityType: string;
      ctaAction: string;
      trustLevel: string;
    }) => {
      trackCTAClick({
        ...params,
        walletAddress,
      });
    },
    [walletAddress]
  );
}

/**
 * Hook to track scroll depth
 */
export function useScrollDepthTracking(walletAddress?: string) {
  const thresholdsTracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

      // Track at 25%, 50%, 75%, 100%
      const thresholds = [25, 50, 75, 100];
      
      thresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !thresholdsTracked.current.has(threshold)) {
          thresholdsTracked.current.add(threshold);
          trackScrollDepth({
            depthPercent: threshold,
            pageHeight: docHeight,
            viewportHeight: winHeight,
            walletAddress,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [walletAddress]);
}
