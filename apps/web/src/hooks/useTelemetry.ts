import { useCallback } from 'react';

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
}

export function useTelemetry() {
  const track = useCallback(async ({ event, properties = {} }: TelemetryEvent) => {
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          properties,
          timestamp: new Date().toISOString(),
          sessionId: sessionStorage.getItem('session_id') || 'anonymous'
        })
      });
    } catch (error) {
      console.error('Telemetry failed:', error);
    }
  }, []);

  return { track };
}