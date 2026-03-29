import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // Sentry is opt-in via env var

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE ?? 'development',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    ignoreErrors: [
      'chrome-extension://',
      'moz-extension://',
      'ResizeObserver loop limit exceeded',
      'Invalid Refresh Token',
    ],
    beforeSend(event) {
      // Redact wallet addresses from error payloads
      if (event.request?.data) {
        const str = JSON.stringify(event.request.data);
        if (str.length > 200 && /0x[a-fA-F0-9]{40}/.test(str)) {
          event.request.data = '[wallet data redacted for privacy]';
        }
      }
      return event;
    },
  });
}
