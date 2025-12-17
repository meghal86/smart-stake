/**
 * Browser Navigation Provider - Handles deterministic browser navigation
 * 
 * Requirements: R1.ROUTING.DETERMINISTIC, R1.ROUTING.CANONICAL
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

import { ReactNode } from 'react';
import { useBrowserNavigation } from '@/hooks/useBrowserNavigation';

interface BrowserNavigationProviderProps {
  children: ReactNode;
  showToast?: (message: string) => void;
}

/**
 * Provider component that initializes browser navigation handling
 * Must be used inside BrowserRouter
 */
export const BrowserNavigationProvider = ({ 
  children, 
  showToast 
}: BrowserNavigationProviderProps) => {
  // Initialize browser navigation handling
  useBrowserNavigation({ showToast });

  return <>{children}</>;
};