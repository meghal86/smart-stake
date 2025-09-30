'use client';
export function track(event: string, props?: Record<string, any>) {
  // swap to posthog.capture(event, props) when ready
  if (typeof window !== 'undefined') console.debug('[track]', event, props ?? {});
}