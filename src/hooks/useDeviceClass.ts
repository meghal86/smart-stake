/**
 * SSR-safe device class hook
 * 
 * Returns the current device class based on viewport width.
 * 
 * CRITICAL SSR SAFETY RULES:
 * - During SSR, always returns 'desktop' to prevent hydration mismatches
 * - DOM structure MUST NOT branch on deviceClass
 * - Use CSS breakpoints (Tailwind) for hide/show instead
 * - Only use deviceClass for telemetry and non-structural logic
 */

import { useState, useEffect } from 'react';
import { getDeviceClass, BREAKPOINTS } from '@/lib/header';
import type { DeviceClass } from '@/types/header';

/**
 * Hook to get current device class
 * 
 * @returns DeviceClass ('mobile' | 'tablet' | 'desktop')
 * 
 * @example
 * const deviceClass = useDeviceClass();
 * 
 * // ✅ Good: Use for telemetry
 * analytics.track('event', { device_class: deviceClass });
 * 
 * // ✅ Good: Use CSS for hide/show
 * <div className="hidden md:block">Desktop only</div>
 * 
 * // ❌ Bad: Don't branch DOM structure
 * {deviceClass === 'mobile' ? <MobileNav /> : <DesktopNav />}
 */
export function useDeviceClass(): DeviceClass {
  // SSR default: 'desktop' to prevent hydration mismatch
  const [deviceClass, setDeviceClass] = useState<DeviceClass>('desktop');

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const updateDeviceClass = () => {
      const width = window.innerWidth;
      setDeviceClass(getDeviceClass(width));
    };

    // Set initial value
    updateDeviceClass();

    // Listen for resize
    window.addEventListener('resize', updateDeviceClass);

    return () => {
      window.removeEventListener('resize', updateDeviceClass);
    };
  }, []);

  return deviceClass;
}
