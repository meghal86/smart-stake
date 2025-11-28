/**
 * SSE Streaming Scan Hook
 * Progressive scan results with real-time updates
 */
import { useState, useEffect, useCallback } from 'react';
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

        while(1) {
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
                // Transform to GuardianScanResult format
                const result = {
                  trustScorePercent: Math.round(data.data.trust_score * 100),
                  trustScoreRaw: data.data.trust_score,
                  riskScore: data.data.risk_score,
                  riskLevel: data.data.risk_level,
                  confidence: data.data.confidence,
                  statusLabel: data.data.risk_level === 'Low' ? 'Trusted' : data.data.risk_level === 'Medium' ? 'Warning' : 'Danger',
                  statusTone: data.data.risk_level === 'Low' ? 'trusted' : data.data.risk_level === 'Medium' ? 'warning' : 'danger',
                  walletAddress: data.data.wallet_address,
                  network: data.data.network,
                  networkCode: network,
                  lastScan: data.data.last_scan,
                  lastScanRelative: 'just now',
                  flags: data.data.flags,
                  issuesBySeverity: {
                    low: data.data.flags.filter((f: unknown) => f.severity === 'low').length,
                    medium: data.data.flags.filter((f: unknown) => f.severity === 'medium').length,
                    high: data.data.flags.filter((f: unknown) => f.severity === 'high').length,
                  },
                  hasFlags: data.data.flags.length > 0,
                  summary: `Scan completed with ${data.data.flags.length} flags`,
                  guardianScanId: data.data.guardian_scan_id,
                };

                setResult(result as unknown);
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

