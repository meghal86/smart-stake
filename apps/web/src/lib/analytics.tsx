'use client';
import { ReactNode } from 'react';

export function PostHogProvider({ children }: { children: ReactNode }) {
  // TODO: init posthog-js with key/env; instrument 'spotlight_view', 'share', 'upgrade_click'
  return <>{children}</>;
}
