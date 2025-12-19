/**
 * UX Gap Requirements - Timestamp Formatting Utilities
 * 
 * Ensures timestamps never display "0s ago" and use "Just now" for < 1 second
 * 
 * Requirements: R3.GAS.NONZERO (Requirement 3.11)
 * Design: Data Integrity → Timestamp System
 */

/**
 * Formats a timestamp to relative time, ensuring "Just now" is shown for < 1 second
 * This prevents "0s ago" from ever being displayed
 */
export function formatRelativeTime(timestamp: Date | string | number): string {
  const now = Date.now();
  const then = typeof timestamp === 'number' 
    ? timestamp 
    : new Date(timestamp).getTime();
  
  const diffMs = Math.abs(now - then);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // CRITICAL: Never show "0s ago" - always use "Just now" for < 1 second
  if (diffSeconds < 1) {
    return 'Just now';
  }
  
  // For 1-59 seconds, show "Just now" to avoid "0s ago" edge cases
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `${years}y ago`;
}

/**
 * Formats timestamp for "Updated X ago" display
 * Specifically handles the requirement that UI SHALL NEVER display "0s ago"
 */
export function formatUpdatedTime(timestamp: Date | string | number): string {
  const relativeTime = formatRelativeTime(timestamp);
  
  // For "Updated" context, we want to be explicit
  if (relativeTime === 'Just now') {
    return 'Updated just now';
  }
  
  return `Updated ${relativeTime}`;
}

/**
 * Formats absolute timestamp for hover tooltips
 */
export function formatAbsoluteTime(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Complete timestamp formatting with both relative and absolute
 * For use with tooltips that show absolute time on hover
 */
export function formatTimestampWithTooltip(timestamp: Date | string | number): {
  relative: string;
  absolute: string;
  updated: string;
} {
  return {
    relative: formatRelativeTime(timestamp),
    absolute: formatAbsoluteTime(timestamp),
    updated: formatUpdatedTime(timestamp)
  };
}

/**
 * Validates that a timestamp format never contains "0s ago"
 * Used in tests to ensure compliance
 */
export function validateTimestampFormat(formattedTime: string): boolean {
  // Should never contain "0s ago" pattern
  if (/^0s ago$/i.test(formattedTime)) {
    return false;
  }
  
  // Should use "Just now" or "just now" for very recent times
  if (formattedTime.toLowerCase().includes('just now')) {
    return true;
  }
  
  // Should follow proper format patterns
  const validPatterns = [
    /^\d+m ago$/,     // "5m ago"
    /^\d+h ago$/,     // "2h ago"  
    /^\d+d ago$/,     // "3d ago"
    /^\d+mo ago$/,    // "2mo ago"
    /^\d+y ago$/,     // "1y ago"
    /^Updated just now$/i,
    /^Updated \d+m ago$/,
    /^Updated \d+h ago$/,
    /^Updated \d+d ago$/,
    /^Updated \d+mo ago$/,
    /^Updated \d+y ago$/
  ];
  
  return validPatterns.some(pattern => pattern.test(formattedTime));
}