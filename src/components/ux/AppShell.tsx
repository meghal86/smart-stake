/**
 * AppShell - Persistent Layout Shell
 * 
 * Prevents white flash during navigation by maintaining header and navigation
 * Only the main content area transitions, shell remains mounted
 * 
 * Requirements: R2.LOADING.APPSHELL_PERSISTENCE
 */

import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserHeader } from '@/components/layout/UserHeader';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Skeleton } from '@/components/ux/Skeleton';
import { DemoBanner, DemoBannerSpacer } from '@/components/ux/DemoBanner';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  className?: string;
}

/**
 * Loading overlay for global loading states
 */
const GlobalLoadingOverlay = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </motion.div>
  );
};

/**
 * Main content area with loading states
 */
const MainContent = ({ 
  children, 
  isLoading 
}: { 
  children: React.ReactNode; 
  isLoading: boolean; 
}) => {
  const location = useLocation();

  return (
    <main className="flex-1 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.15,
            ease: 'easeOut'
          }}
          className="h-full"
        >
          <Suspense
            fallback={
              <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      
      {/* Loading overlay for main content */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Loading content...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

/**
 * AppShell component that persists across navigation
 */
export const AppShell = ({ 
  children, 
  showHeader = true, 
  showNavigation = true,
  className 
}: AppShellProps) => {
  const { globalLoading, isLoading } = useLoadingState();
  const location = useLocation();

  // Determine if we should show navigation based on route
  const shouldShowNavigation = showNavigation && !location.pathname.startsWith('/auth');
  const shouldShowHeader = showHeader && !location.pathname.startsWith('/auth');

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', className)}>
      {/* Demo Banner - Persistent across all pages */}
      <DemoBanner dismissible={false} position="top" />
      
      {/* Persistent Header - Never unmounts */}
      {shouldShowHeader && (
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          {/* Spacer to prevent content from being hidden behind demo banner */}
          <DemoBannerSpacer position="top" />
          <div className="flex justify-end p-4">
            <UserHeader />
          </div>
        </header>
      )}

      {/* Main Content Area - Only this transitions */}
      <MainContent isLoading={isLoading && !globalLoading}>
        {/* Spacer for demo banner when no header is shown */}
        {!shouldShowHeader && <DemoBannerSpacer position="top" />}
        {children}
      </MainContent>

      {/* Persistent Bottom Navigation - Never unmounts */}
      {shouldShowNavigation && (
        <footer className="sticky bottom-0 z-40 bg-card/80 backdrop-blur-lg border-t border-border">
          <BottomNavigation />
        </footer>
      )}

      {/* Global Loading Overlay */}
      <AnimatePresence>
        <GlobalLoadingOverlay isVisible={globalLoading} />
      </AnimatePresence>
    </div>
  );
};

/**
 * Higher-order component to wrap pages with AppShell
 */
export const withAppShell = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options?: Omit<AppShellProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <AppShell {...options}>
      <Component {...props} />
    </AppShell>
  );
  
  WrappedComponent.displayName = `withAppShell(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook to control AppShell loading states
 */
export const useAppShellLoading = () => {
  const { showLoading, hideLoading } = useLoadingState();
  
  const showGlobalLoading = (message?: string) => {
    showLoading({
      id: 'app-shell-global',
      type: 'navigation',
      message: message || 'Loading...'
    });
  };
  
  const hideGlobalLoading = () => {
    hideLoading('app-shell-global');
  };
  
  return {
    showGlobalLoading,
    hideGlobalLoading
  };
};