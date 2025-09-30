import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0 || !startY.current) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0) {
      e.preventDefault();
      const pullDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(pullDistance);
      setIsPulling(pullDistance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled) return;
    
    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isPulling, pullDistance, threshold]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 ${
          pullDistance > 0 ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          height: Math.max(pullDistance, 0),
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))'
        }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw 
            className={`w-4 h-4 ${
              isRefreshing ? 'animate-spin' : 
              isPulling ? 'rotate-180' : ''
            } transition-transform duration-200`} 
          />
          <span className="text-sm">
            {isRefreshing ? 'Refreshing...' : 
             isPulling ? 'Release to refresh' : 
             'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${Math.max(pullDistance * 0.3, 0)}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}