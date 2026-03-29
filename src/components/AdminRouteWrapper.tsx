import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AdminRouteWrapper — Restricts access to admin-only routes.
 *
 * Checks:
 * 1. User is authenticated
 * 2. User email is in the VITE_ADMIN_EMAILS allowlist (comma-separated env var)
 *
 * Set VITE_ADMIN_EMAILS=you@example.com,other@example.com in your .env.local
 *
 * If no VITE_ADMIN_EMAILS is set, falls back to blocking everyone (safe default).
 */

interface AdminRouteWrapperProps {
  children: React.ReactNode;
}

const getAdminEmails = (): string[] => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ children }) => {
  const { user, isAuthenticated, loading, sessionEstablished } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminEmails = getAdminEmails();
  const isAdmin =
    isAuthenticated &&
    user?.email != null &&
    adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    if (!sessionEstablished) return;

    if (!isAuthenticated) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?next=${next}`, { replace: true });
      return;
    }

    if (!isAdmin) {
      // Authenticated but not an admin → silently redirect to home
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAdmin, sessionEstablished, navigate, location]);

  if (!sessionEstablished || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};
