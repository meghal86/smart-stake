import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Signin page - Alias to Login
 * 
 * This page serves as an alias to /login, preserving all query parameters.
 * This allows users to navigate to /signin?next=<path> and be redirected to /login?next=<path>
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.6
 */
const Signin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters when redirecting to login
    const queryString = searchParams.toString();
    const loginPath = queryString ? `/login?${queryString}` : '/login';
    navigate(loginPath, { replace: true });
  }, [navigate, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Signin;
