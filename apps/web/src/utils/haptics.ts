export function triggerHaptic(duration = 10) {
  // Respect user's motion preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  // Try different haptic APIs
  try {
    // Modern Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
      return;
    }
    
    // iOS haptic feedback (if available)
    if ('hapticFeedback' in window) {
      (window as any).hapticFeedback.impactOccurred('light');
      return;
    }
    
    // Fallback for older devices - no-op
  } catch (error) {
    // Silently fail if haptics not supported
  }
}