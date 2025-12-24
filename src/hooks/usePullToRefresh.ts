import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  containerId?: string; // Optional container to scope the pull-to-refresh
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false,
  containerId,
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isActive = useRef(true);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) return;

    isActive.current = true;
    
    // Get container element if specified
    if (containerId) {
      containerRef.current = document.getElementById(containerId);
    }

    let touchStartY = 0;
    let touchMoveY = 0;
    let isValidPull = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isActive.current) return;
      
      // Check if touch is within our container (if specified)
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        return;
      }
      
      // Only trigger if at top of page or container
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
      if (scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
        isValidPull = true;
      } else {
        isValidPull = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive.current || !isValidPull || isRefreshing) return;
      
      // Check scroll position
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
      if (scrollTop > 0) {
        isValidPull = false;
        return;
      }

      touchMoveY = e.touches[0].clientY;
      const distance = touchMoveY - touchStartY;

      // Only handle downward pulls
      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
        currentY.current = distance;

        // Only prevent default when significantly pulling (not just touching)
        if (distance > 50) {
          e.preventDefault();
        }
      } else {
        // Reset if user scrolls up
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isActive.current || !isValidPull) return;
      
      if (isPulling && currentY.current >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            if (isActive.current) {
              setIsRefreshing(false);
              setIsPulling(false);
              setPullDistance(0);
            }
          }, 500);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
      currentY.current = 0;
      isValidPull = false;
    };

    const target = containerRef.current ?? document;
    target.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    target.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    target.addEventListener('touchend', handleTouchEnd as any);

    return () => {
      isActive.current = false;
      target.removeEventListener('touchstart', handleTouchStart as any);
      target.removeEventListener('touchmove', handleTouchMove as any);
      target.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [disabled, isPulling, isRefreshing, onRefresh, threshold, containerId]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    threshold,
  };
};
