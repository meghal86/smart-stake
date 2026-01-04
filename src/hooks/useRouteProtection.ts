/**
 * useRouteProtection Hook
 * 
 * Protects routes by redirecting unauthenticated users to /login with a next parameter.
 * Validates the next parameter to prevent open redirects.
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.1, 3.2
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseRouteProtectionOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Validates a redirect path to prevent open redirects
 * Must start with / and must not start with //
 */
function isValidRedirectPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

/**
 * Hook to protect routes and redirect unauthenticated users
 */
export function useRouteProtection(options: UseRouteProtectionOptions = {}) {
  const { requireAuth = true, redirectTo = '/login' } = options;
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If auth is required and user is not authenticated
    if (requireAuth && !session) {
      // Build the next parameter with current path
      const currentPath = location.pathname + location.search;
      const nextParam = isValidRedirectPath(currentPath) 
        ? `?next=${encodeURIComponent(currentPath)}`
        : '';

      // Redirect to login with next parameter
      navigate(`${redirectTo}${nextParam}`, { replace: true });
    }
  }, [session, loading, requireAuth, navigate, location, redirectTo]);

  return {
    isAuthenticated: !!session,
    isLoading: loading,
  };
}
