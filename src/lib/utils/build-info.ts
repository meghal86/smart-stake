/**
 * Build Information Utilities
 * 
 * Provides app version and build information
 * Requirements: R24-AC3
 */

// Get version from package.json
const getAppVersion = (): string => {
  // In a real build process, this would be injected at build time
  // For now, we'll use a static version that matches package.json
  return '1.1.0';
};

// Get build timestamp
const getBuildTimestamp = (): string => {
  // In a real build process, this would be injected at build time
  // For now, we'll use the current date as a fallback
  return new Date().toISOString();
};

// Get build commit hash (if available)
const getBuildCommit = (): string | null => {
  // In a real build process, this would be injected from git
  // For now, return null as it's not available
  return null;
};

// Get environment
const getBuildEnvironment = (): string => {
  return import.meta.env.MODE || 'development';
};

export interface BuildInfo {
  version: string;
  timestamp: string;
  commit?: string;
  environment: string;
  buildDate: string;
}

export const getBuildInfo = (): BuildInfo => {
  const timestamp = getBuildTimestamp();
  const buildDate = new Date(timestamp).toLocaleDateString();
  
  return {
    version: getAppVersion(),
    timestamp,
    commit: getBuildCommit() || undefined,
    environment: getBuildEnvironment(),
    buildDate
  };
};

export const getVersionString = (): string => {
  const info = getBuildInfo();
  const parts = [info.version];
  
  if (info.commit) {
    parts.push(`(${info.commit.substring(0, 7)})`);
  }
  
  if (info.environment !== 'production') {
    parts.push(`[${info.environment}]`);
  }
  
  return parts.join(' ');
};

export const getBuildDateString = (): string => {
  const info = getBuildInfo();
  return `Built on ${info.buildDate}`;
};