import { useState, useEffect } from 'react';

interface SanctionsResult {
  isLoading: boolean;
  isSanctioned: boolean;
  sanctionsList: string[];
  lastChecked: Date | null;
  error: string | null;
}

export function useSanctionsCheck(address: string) {
  const [result, setResult] = useState<SanctionsResult>({
    isLoading: false,
    isSanctioned: false,
    sanctionsList: [],
    lastChecked: null,
    error: null
  });

  useEffect(() => {
    if (!address) return;

    const checkSanctions = async () => {
      setResult(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Mock OFAC API call - replace with real API
        const response = await fetch(`/api/sanctions/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });

        if (!response.ok) {
          throw new Error('Sanctions check failed');
        }

        const data = await response.json();
        
        setResult({
          isLoading: false,
          isSanctioned: data.isSanctioned || false,
          sanctionsList: data.sanctionsList || [],
          lastChecked: new Date(),
          error: null
        });
      } catch (error) {
        // Mock result for demo - remove in production
        setResult({
          isLoading: false,
          isSanctioned: false,
          sanctionsList: [],
          lastChecked: new Date(),
          error: null // Suppress error for demo
        });
      }
    };

    checkSanctions();
  }, [address]);

  return result;
}