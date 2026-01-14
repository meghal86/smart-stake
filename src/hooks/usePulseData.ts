'use client';

import { useState, useEffect } from 'react';
import { PulsePayload } from '@/lib/cockpit/pulse-generator';

interface UsePulseDataOptions {
  date?: string; // YYYY-MM-DD format
  walletScope?: 'active' | 'all';
  isDemo?: boolean;
  enabled?: boolean;
}

interface UsePulseDataResult {
  pulseData: PulsePayload | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePulseData({
  date,
  walletScope = 'active',
  isDemo = false,
  enabled = true,
}: UsePulseDataOptions = {}): UsePulseDataResult {
  const [pulseData, setPulseData] = useState<PulsePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPulseData = async () => {
    if (!enabled || isDemo) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (date) {
        params.append('date', date);
      }
      params.append('wallet_scope', walletScope);

      const response = await fetch(`/api/cockpit/pulse?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch pulse data');
      }

      const result = await response.json();
      setPulseData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching pulse data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchPulseData();
  };

  useEffect(() => {
    fetchPulseData();
  }, [date, walletScope, isDemo, enabled]);

  return {
    pulseData,
    isLoading,
    error,
    refetch,
  };
}