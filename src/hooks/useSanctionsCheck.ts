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
        // Real Chainalysis API call
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chainalysis-sanctions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ address })
        });

        if (!response.ok) {
          throw new Error('Sanctions check failed');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setResult({
          isLoading: false,
          isSanctioned: data.isSanctioned || false,
          sanctionsList: data.sanctionsList || [],
          lastChecked: new Date(data.lastChecked),
          error: null
        });
      } catch (error) {
        console.error('Sanctions check error:', error);
        setResult({
          isLoading: false,
          isSanctioned: false,
          sanctionsList: [],
          lastChecked: null,
          error: error.message || 'Failed to check sanctions'
        });
      }
    };

    checkSanctions();
  }, [address]);

  return result;
}