/**
 * SSE Streaming Scan Hook
 * Progressive scan results with real-time updates
 */
import { useState, useEffect, useCallback } from 'react';
import { normalizeGuardianScanPayload } from '@/lib/guardian/scan-contract';
import { useGuardianStore } from '@/store/guardianStore';

export interface ScanStep {
  step: 'approvals' | 'reputation' | 'mixer' | 'complete' | 'error';
  progress: number;
  message?: string;
  data?: unknown;
  error?: unknown;
}

export function useSSEScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState<ScanStep | null>(null);
  const setResult = useGuardianStore((state) => state.setResult);
  const setError = useGuardianStore((state) => state.setError);

  const startScan = useCallback(
    async (walletAddress: string, network: string = 'ethereum') => {
      setIsScanning(true);
      setCurrentStep({ step: 'approvals', progress: 0, message: 'Starting scan...' });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        setError('VITE_SUPABASE_URL not configured');
        setIsScanning(false);
        return;
      }

      const eventSource = new EventSource(
        `${supabaseUrl}/functions/v1/guardian-scan-v2`,
        {
          // Note: EventSource doesn't support POST, so we'll use fetch with ReadableStream instead
        }
      );

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/guardian-scan-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            network,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for(;;) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              setCurrentStep(data);

              if (data.step === 'complete' && data.data) {
                const result = normalizeGuardianScanPayload(
                  {
                    trust_score_percent:
                      typeof data.data.trust_score === 'number'
                        ? Math.round(data.data.trust_score * 100)
                        : data.data.trust_score_percent,
                    risk_score: data.data.risk_score,
                    scanned_at: data.data.last_scan || data.data.scanned_at,
                    confidence: data.data.confidence,
                    risks: data.data.flags || data.data.risks,
                    approvals: data.data.approvals,
                    scan_id: data.data.guardian_scan_id || data.data.scan_id,
                  },
                  {
                    walletAddress: data.data.wallet_address || walletAddress,
                    network: data.data.network || network,
                    dataSource: 'live',
                  }
                );

                setResult(result);
              } else if (data.step === 'error') {
                setError(data.error?.message || 'Scan failed');
              }
            }
          }
        }
      } catch (error) {
        console.error('SSE scan error:', error);
        setError(error instanceof Error ? error.message : 'Scan failed');
      } finally {
        setIsScanning(false);
      }
    },
    [setResult, setError]
  );

  return {
    isScanning,
    currentStep,
    startScan,
  };
}
