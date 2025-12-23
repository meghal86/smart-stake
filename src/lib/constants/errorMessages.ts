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
  API_FAILED: 'Having trouble loading your data. Please refresh the page and we\'ll try again.',
  API_TIMEOUT: 'This is taking longer than usual. Please try again in a moment.',
  API_UNAUTHORIZED: 'Your session has expired. Please reconnect your wallet to continue.',
  API_RATE_LIMITED: 'Whoa, slow down there! Please wait a moment before trying again.',
  API_SERVER_ERROR: 'Our servers are having a moment. Please try again in a few minutes.',
  API_NETWORK_ERROR: 'Connection hiccup detected. Please check your internet and try again.',
  
  // Wallet Errors
  WALLET_CONNECTION_FAILED: 'Wallet connection didn\'t work out. Please try connecting again or refresh the page.',
  WALLET_NOT_INSTALLED: 'You\'ll need a Web3 wallet like MetaMask to get started. Please install one and try again.',
  WALLET_WRONG_NETWORK: 'Please switch to Ethereum Mainnet to continue.',
  WALLET_SIGNATURE_REJECTED: 'No worries! Please try again when you\'re ready to continue.',
  WALLET_USER_CANCELLED: 'Connection cancelled. You can try again anytime.',
  WALLET_ALREADY_CONNECTED: 'Good news - your wallet is already connected! You can proceed with your actions or refresh if needed.',
  WALLET_DISCONNECTION_FAILED: 'Having trouble disconnecting. Please refresh the page and try again.',
  
  // Component Errors
  COMPONENT_ERROR: 'Something unexpected happened. Please refresh the page to get back on track.',
  NAVIGATION_ERROR: 'Navigation hiccup! Please try again or refresh the page.',
  RENDER_ERROR: 'Display issue detected. Please refresh the page to fix this.',
  
  // Network Errors
  NETWORK_OFFLINE: 'You appear to be offline. Don\'t worry - we\'re showing your cached data. Please check your connection.',
  NETWORK_SLOW: 'Your connection seems slow. Please wait while we load your data.',
  NETWORK_UNREACHABLE: 'Can\'t reach our servers right now. Please check your connection and try again.',
  
  // Data Errors
  DATA_FETCH_FAILED: 'Couldn\'t load your data this time. Please try refreshing.',
  DATA_PARSE_ERROR: 'Data format looks unusual. Please refresh and try again.',
  DATA_STALE: 'Your data is a bit outdated. Please wait while we refresh it for you.',
  DATA_UNAVAILABLE: 'Data is temporarily unavailable. Please try again in a moment.',
  
  // Authentication Errors
  AUTH_REQUIRED: 'Please connect your wallet to unlock this feature. Try again after connecting.',
  AUTH_EXPIRED: 'Your session has expired. Please reconnect your wallet to continue.',
  AUTH_INVALID: 'Authentication issue detected. Please reconnect your wallet.',
  
  // Generic Errors
  UNKNOWN_ERROR: 'Something unexpected happened. Please try refreshing the page.',
  TRY_AGAIN: 'Please try again in a moment.',
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
  // Handle special property names and invalid codes safely
  if (typeof code !== 'string' || code.length === 0) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // Check if the code exists in ERROR_MESSAGES using hasOwnProperty for safety
  if (Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
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
