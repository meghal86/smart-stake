/**
 * Error Messages Constants
 * 
 * Centralized user-facing error, success, and info messages for the AlphaWhale platform.
 * All messages should be clear, actionable, and user-friendly.
 */

/**
 * Error Messages
 * 
 * User-facing error messages for various failure scenarios.
 * Keep messages concise and actionable.
 */
export const ERROR_MESSAGES = {
  // API Errors
  API_FAILED: 'Unable to load metrics. Please refresh the page.',
  API_TIMEOUT: 'Request took too long. Please try again.',
  API_UNAUTHORIZED: 'Session expired. Please reconnect your wallet.',
  API_RATE_LIMITED: 'Too many requests. Please wait a moment.',
  API_SERVER_ERROR: 'Server error. Please try again later.',
  API_NETWORK_ERROR: 'Network error. Please check your connection.',
  
  // Wallet Errors
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  WALLET_NOT_INSTALLED: 'Please install a Web3 wallet (MetaMask, etc.)',
  WALLET_WRONG_NETWORK: 'Please switch to Ethereum Mainnet.',
  WALLET_SIGNATURE_REJECTED: 'You declined the signature request.',
  WALLET_USER_CANCELLED: 'Connection cancelled.',
  WALLET_ALREADY_CONNECTED: 'Wallet is already connected.',
  WALLET_DISCONNECTION_FAILED: 'Failed to disconnect wallet.',
  
  // Component Errors
  COMPONENT_ERROR: 'Something went wrong. Please refresh the page.',
  NAVIGATION_ERROR: 'Navigation failed. Please try again.',
  RENDER_ERROR: 'Failed to render component. Please refresh.',
  
  // Network Errors
  NETWORK_OFFLINE: 'You appear to be offline. Showing cached data.',
  NETWORK_SLOW: 'Your connection is slow. Data may be outdated.',
  NETWORK_UNREACHABLE: 'Cannot reach server. Please check your connection.',
  
  // Data Errors
  DATA_FETCH_FAILED: 'Failed to load data. Please try again.',
  DATA_PARSE_ERROR: 'Invalid data format received.',
  DATA_STALE: 'Data is outdated. Refreshing...',
  DATA_UNAVAILABLE: 'Data temporarily unavailable.',
  
  // Authentication Errors
  AUTH_REQUIRED: 'Please connect your wallet to continue.',
  AUTH_EXPIRED: 'Your session has expired. Please reconnect.',
  AUTH_INVALID: 'Invalid authentication. Please reconnect.',
  
  // Generic Errors
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  TRY_AGAIN: 'Please try again.',
} as const;

/**
 * Success Messages
 * 
 * User-facing success messages for completed actions.
 */
export const SUCCESS_MESSAGES = {
  // Wallet
  WALLET_CONNECTED: 'Wallet connected successfully!',
  WALLET_DISCONNECTED: 'Wallet disconnected.',
  
  // Data
  METRICS_REFRESHED: 'Data refreshed.',
  DATA_LOADED: 'Data loaded successfully.',
  
  // Navigation
  NAVIGATION_SUCCESS: 'Navigation successful.',
  
  // Generic
  ACTION_COMPLETED: 'Action completed successfully.',
} as const;

/**
 * Info Messages
 * 
 * User-facing informational messages for various states.
 */
export const INFO_MESSAGES = {
  // Loading States
  LOADING_METRICS: 'Loading your data...',
  LOADING_WALLET: 'Connecting wallet...',
  LOADING_PAGE: 'Loading...',
  
  // Demo Mode
  DEMO_MODE: 'Explore with sample data. Connect wallet for personalized results.',
  DEMO_MODE_SHORT: 'Demo Mode',
  DEMO_MODE_BADGE: 'Demo',
  
  // Data States
  DATA_STALE: 'Data is outdated. Refreshing...',
  DATA_CACHED: 'Using cached data. Last updated 2 minutes ago.',
  DATA_FRESH: 'Data is up to date.',
  
  // Wallet States
  WALLET_NOT_CONNECTED: 'Wallet not connected.',
  WALLET_CONNECTING: 'Connecting to wallet...',
  
  // Feature States
  FEATURE_COMING_SOON: 'Coming soon!',
  FEATURE_BETA: 'Beta',
  FEATURE_NEW: 'New',
  
  // Generic
  NO_DATA: 'No data available.',
  EMPTY_STATE: 'Nothing to show yet.',
} as const;

/**
 * Warning Messages
 * 
 * User-facing warning messages for potential issues.
 */
export const WARNING_MESSAGES = {
  // Data Warnings
  DATA_OUTDATED: 'Data may be outdated.',
  DATA_INCOMPLETE: 'Some data is missing.',
  
  // Network Warnings
  SLOW_CONNECTION: 'Slow connection detected.',
  UNSTABLE_CONNECTION: 'Connection is unstable.',
  
  // Feature Warnings
  FEATURE_EXPERIMENTAL: 'This feature is experimental.',
  FEATURE_DEPRECATED: 'This feature will be removed soon.',
  
  // Generic
  PROCEED_WITH_CAUTION: 'Proceed with caution.',
} as const;

/**
 * Helper function to get error message by code
 * 
 * @param {string} code - Error code
 * @returns {string} Error message
 */
export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Helper function to get success message by code
 * 
 * @param {string} code - Success code
 * @returns {string} Success message
 */
export const getSuccessMessage = (code: string): string => {
  return SUCCESS_MESSAGES[code as keyof typeof SUCCESS_MESSAGES] || SUCCESS_MESSAGES.ACTION_COMPLETED;
};

/**
 * Helper function to get info message by code
 * 
 * @param {string} code - Info code
 * @returns {string} Info message
 */
export const getInfoMessage = (code: string): string => {
  return INFO_MESSAGES[code as keyof typeof INFO_MESSAGES] || INFO_MESSAGES.NO_DATA;
};

/**
 * Helper function to get warning message by code
 * 
 * @param {string} code - Warning code
 * @returns {string} Warning message
 */
export const getWarningMessage = (code: string): string => {
  return WARNING_MESSAGES[code as keyof typeof WARNING_MESSAGES] || WARNING_MESSAGES.PROCEED_WITH_CAUTION;
};
