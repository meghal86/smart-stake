import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRouteWrapper - Ensures authenticated access with next parameter handling
 * 
 * This component wraps protected routes and:
 * 1. Waits for auth session to be established
 * 2. Redirects unauthenticated users to /login?next=<current-path>
 * 3. Validates next parameter to prevent open redirects
 * 4. Renders children once authenticated
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.1, 3.2
 */

interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
}

export const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({ children }) => {
  const { isAuthenticated, loading, sessionEstablished } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for session to be established before checking auth
    if (!sessionEstablished) {
      return;
    }

    // If not authenticated, redirect to login with next parameter
    if (!isAuthenticated) {
      const currentPath = location.pathname + location.search;
      
      // Validate next parameter to prevent open redirects
      // Must start with / and must not start with //
      const isValidNext = currentPath.startsWith('/') && !currentPath.startsWith('//');
      
      if (isValidNext) {
        const next = encodeURIComponent(currentPath);
        navigate(`/login?next=${next}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, sessionEstablished, navigate, location]);

  // Show loading state while session is being established
  if (!sessionEstablished || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Render children once authenticated
  return <>{children}</>;
};
