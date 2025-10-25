/**
 * Streaming Scan Results
 * Server-Sent Events (SSE) for progressive scan rendering
 */
import type { ScanStep } from '@/types/guardian';

export type StreamCallback = (step: ScanStep) => void;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = () => void;

export interface StreamOptions {
  onStep: StreamCallback;
  onError?: ErrorCallback;
  onComplete?: CompleteCallback;
}

/**
 * Stream scan results from Guardian API
 */
export async function streamGuardianScan(
  walletAddress: string,
  network: string,
  options: StreamOptions
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase configuration missing');
  }

  const functionUrl = `${supabaseUrl}/functions/v1/guardian-scan-stream`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        network,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        options.onComplete?.();
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              options.onError?.(new Error(data.error));
              return;
            }

            if (data.step) {
              options.onStep(data as ScanStep);
            }
          } catch (err) {
            console.warn('Failed to parse SSE message:', line, err);
          }
        }
      }
    }
  } catch (error) {
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Mock streaming for development/testing
 */
export async function mockStreamGuardianScan(
  walletAddress: string,
  network: string,
  options: StreamOptions
): Promise<void> {
  const steps: ScanStep[] = [
    {
      step: 'approvals',
      progress: 25,
      message: 'Checking token approvals...',
      data: {
        score: 100,
        grade: 'A',
        confidence: 0.8,
        factors: [],
        totals: { flags: 0, critical: 0 },
      },
    },
    {
      step: 'reputation',
      progress: 50,
      message: 'Verifying address reputation...',
      data: {
        score: 95,
        grade: 'A',
        confidence: 0.85,
        factors: [],
        totals: { flags: 0, critical: 0 },
      },
    },
    {
      step: 'mixer',
      progress: 75,
      message: 'Scanning for mixer activity...',
      data: {
        score: 90,
        grade: 'A',
        confidence: 0.9,
        factors: [],
        totals: { flags: 0, critical: 0 },
      },
    },
    {
      step: 'honeypot',
      progress: 90,
      message: 'Checking for honeypot tokens...',
      data: {
        score: 87,
        grade: 'B',
        confidence: 0.92,
        factors: [],
        totals: { flags: 1, critical: 0 },
      },
    },
    {
      step: 'complete',
      progress: 100,
      message: 'Scan complete',
      data: {
        score: 87,
        grade: 'B',
        confidence: 0.90,
        factors: [
          {
            category: 'Approvals',
            impact: -13,
            severity: 'medium',
            description: '2 unlimited approvals detected',
          },
        ],
        totals: { flags: 2, critical: 0 },
      },
    },
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 800));
    options.onStep(step);
  }

  options.onComplete?.();
}

/**
 * Hook to use streaming scans in React components
 */
export function useStreamingScan() {
  return {
    streamScan: streamGuardianScan,
    mockStreamScan: mockStreamGuardianScan,
  };
}

