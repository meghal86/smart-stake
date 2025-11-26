/**
 * React Hook for Harvest Session Management
 * Provides client-side session state management
 */

import { useState, useCallback } from 'react';
import type {
  HarvestSession,
  HarvestSessionStatus,
  CreateSessionRequest,
  CreateSessionResponse,
  SessionResponse,
  ErrorResponse,
} from '@/types/harvestpro';

export interface UseHarvestSessionReturn {
  session: HarvestSession | null;
  loading: boolean;
  error: string | null;
  createSession: (request: CreateSessionRequest) => Promise<string | null>;
  getSession: (sessionId: string) => Promise<void>;
  updateSession: (
    sessionId: string,
    updates: Partial<HarvestSession>
  ) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export function useHarvestSession(): UseHarvestSessionReturn {
  const [session, setSession] = useState<HarvestSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createSession = useCallback(
    async (request: CreateSessionRequest): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/harvest/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json();
          throw new Error(errorData.error.message);
        }

        const data: CreateSessionResponse = await response.json();
        return data.sessionId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create session';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSession = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/harvest/sessions/${sessionId}`);

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error.message);
      }

      const data: SessionResponse = await response.json();
      setSession(data.session);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch session';
      setError(errorMessage);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: Partial<HarvestSession>
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/harvest/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json();
          throw new Error(errorData.error.message);
        }

        const data: SessionResponse = await response.json();
        setSession(data.session);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update session';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelSession = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/harvest/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error.message);
      }

      // Clear session after successful cancellation
      setSession(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel session';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    loading,
    error,
    createSession,
    getSession,
    updateSession,
    cancelSession,
    clearError,
  };
}
