/**
 * Responsive Layout Components
 * Mobile-first responsive layouts for Guardian
 */
import React, { forwardRef, HTMLAttributes, useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hook to detect screen size
 */
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    screenSize,
  };
}

/**
 * Mobile Header - Sticky header for mobile
 */
export interface MobileHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  onMenuClick?: () => void;
  rightActions?: React.ReactNode;
}

export const MobileHeader = forwardRef<HTMLElement, MobileHeaderProps>(
  ({ className, title, onMenuClick, rightActions, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full',
          'backdrop-blur-xl bg-slate-900/90 border-b border-white/10',
          'px-4 py-3',
          'lg:hidden', // Hide on desktop
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-300" />
            </button>
          )}
          
          <h1 className="text-lg font-bold text-slate-100">{title}</h1>
          
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </div>
      </header>
    );
  }
);
MobileHeader.displayName = 'MobileHeader';

/**
 * Bottom Navigation - Mobile bottom nav bar
 */
export interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
}

export interface BottomNavProps extends HTMLAttributes<HTMLElement> {
  items: BottomNavItem[];
  onItemClick?: (item: BottomNavItem) => void;
}

export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(
  ({ className, items, onItemClick, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'backdrop-blur-xl bg-slate-900/95 border-t border-white/10',
          'pb-safe', // iOS safe area
          'lg:hidden', // Hide on desktop
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                  item.active
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);
BottomNav.displayName = 'BottomNav';

/**
 * Mobile Drawer - Slide-in drawer for mobile
 */
export interface MobileDrawerProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
}

export const MobileDrawer = forwardRef<HTMLDivElement, MobileDrawerProps>(
  ({ className, open, onClose, position = 'left', children, ...props }, ref) => {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          ref={ref}
          className={cn(
            'fixed top-0 bottom-0 z-50 w-[280px] max-w-[85vw]',
            'backdrop-blur-xl bg-slate-900/95 border-white/10',
            'transition-transform duration-300 ease-in-out',
            'lg:hidden',
            position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
            open ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full',
            className
          )}
          {...props}
        >
          {/* Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-slate-100">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-slate-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
            {children}
          </div>
        </div>
      </>
    );
  }
);
MobileDrawer.displayName = 'MobileDrawer';

/**
 * Responsive Grid - Auto-responsive grid
 */
export interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: number;
}

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          `gap-${gap}`,
          `grid-cols-${cols.mobile}`,
          `sm:grid-cols-${cols.tablet}`,
          `lg:grid-cols-${cols.desktop}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Stack - Vertical or horizontal stack with responsive direction
 */
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal' | 'responsive';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    { className, direction = 'vertical', gap = 4, align = 'stretch', justify = 'start', children, ...props },
    ref
  ) => {
    const directionClass =
      direction === 'responsive' ? 'flex-col sm:flex-row' : direction === 'vertical' ? 'flex-col' : 'flex-row';

    const alignClass = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    }[align];

    const justifyClass = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    }[justify];

    return (
      <div
        ref={ref}
        className={cn('flex', directionClass, alignClass, justifyClass, `gap-${gap}`, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = 'Stack';

/**
 * Container - Responsive container with max width
 */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', center = true, children, ...props }, ref) => {
    const sizeClass = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    }[size];

    return (
      <div
        ref={ref}
        className={cn('w-full px-4 sm:px-6 lg:px-8', center && 'mx-auto', sizeClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = 'Container';

/**
 * Floating Action Button - FAB for mobile
 */
export interface FABProps extends HTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ className, icon: Icon, label, position = 'bottom-right', ...props }, ref) => {
    const positionClass = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    }[position];

    return (
      <button
        ref={ref}
        className={cn(
          'fixed z-40 flex items-center gap-2',
          'px-5 py-4 rounded-full',
          'bg-gradient-to-r from-blue-500 to-purple-600',
          'text-white font-semibold shadow-lg',
          'hover:scale-110 active:scale-95',
          'transition-all duration-300',
          'lg:hidden', // Hide on desktop
          positionClass,
          className
        )}
        aria-label={label}
        {...props}
      >
        <Icon className="h-6 w-6" />
        {label && <span className="text-sm">{label}</span>}
      </button>
    );
  }
);
FAB.displayName = 'FAB';

/**
 * Pull to Refresh - Mobile pull-to-refresh
 */
export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, threshold));
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold) {
      await onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {isPulling && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center"
          style={{ transform: `translateY(${pullDistance - 40}px)` }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance * 0.3}px)`, transition: 'transform 0.2s' }}>
        {children}
      </div>
    </div>
  );
}

