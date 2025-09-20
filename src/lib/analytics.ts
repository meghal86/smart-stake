export const track = (name: string, props: any = {}) => {
  try {
    // @ts-ignore
    window?.posthog?.capture?.(name, props);
    console.log(`Analytics: ${name}`, props);
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

export const analytics = {
  track
};