'use client';
import { ReactNode } from 'react';

export function SentryWrapper({ children }: { children: ReactNode }) {
  // TODO: init Sentry browser SDK
  return <>{children}</>;
}
