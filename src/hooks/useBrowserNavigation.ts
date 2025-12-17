/**
 * React hook for deterministic browser navigation handling
 * 
 * Requirements: R1.ROUTING.DETERMINISTIC, R1.ROUTING.CANONICAL
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

interface UseBrowserNavigationOptions {
  showToast?: (message: string) => void;
}

/**
 * Hook to initialize and manage deterministic browser navigation
 * Ensures back/forward buttons work correctly with canonical routes
 */
export const useBrowserNavigation = (options: UseBrowserNavigationOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = options;

  useEffect(() => {
    // Initialize browser navigation handling
    NavigationRouter.initializeBrowserNavigation(navigate, showToast);

    // Update current route when location changes
    const currentPath = location.pathname + location.search;
    NavigationRouter.updateCurrentRoute(currentPath);
  }, [navigate, showToast, location.pathname, location.search]);

  /**
   * Navigate to a canonical route for a navigation item
   */
  const navigateToCanonical = (navItemId: string) => {
    NavigationRouter.navigateToCanonical(navItemId, navigate, showToast);
  };

  /**
   * Navigate to a specific path with canonical validation
   */
  const navigateToPath = (path: string) => {
    NavigationRouter.navigateToPath(path, navigate, showToast);
  };

  /**
   * Get the current canonical route
   */
  const getCurrentRoute = () => {
    return NavigationRouter.getCurrentCanonicalRoute();
  };

  return {
    navigateToCanonical,
    navigateToPath,
    getCurrentRoute,
  };
};