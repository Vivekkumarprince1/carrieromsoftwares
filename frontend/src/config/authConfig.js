// Environment-based configuration for authentication and token management

export const authConfig = {
  // Token check interval in milliseconds
  tokenCheckInterval: (import.meta.env.VITE_TOKEN_CHECK_INTERVAL || 5) * 60 * 1000,
  
  // Token warning threshold in milliseconds
  tokenWarningThreshold: (import.meta.env.VITE_TOKEN_WARNING_THRESHOLD || 5) * 60 * 1000,
  
  // Session timeout in milliseconds (for frontend validation)
  sessionTimeout: (import.meta.env.VITE_SESSION_TIMEOUT || 1440) * 60 * 1000,
  
  // Whether to show session status component
  showSessionStatus: import.meta.env.VITE_SHOW_SESSION_STATUS === 'true',
  
  // Whether to attempt automatic token refresh (future feature)
  autoRefreshToken: import.meta.env.VITE_AUTO_REFRESH_TOKEN === 'true',
  
  // API base URL
  apiBaseUrl: import.meta.env.VITE_BASE_URL || 'http://localhost:3000',
};

export const getTokenCheckInterval = () => authConfig.tokenCheckInterval;
export const getTokenWarningThreshold = () => authConfig.tokenWarningThreshold;
export const getSessionTimeout = () => authConfig.sessionTimeout;
export const shouldShowSessionStatus = () => authConfig.showSessionStatus;
export const shouldAutoRefreshToken = () => authConfig.autoRefreshToken;

// Helper function to convert JWT expiry format to milliseconds
export const parseJWTExpiry = (expiryString) => {
  if (!expiryString) return 24 * 60 * 60 * 1000; // Default 1 day
  
  const unit = expiryString.slice(-1).toLowerCase();
  const value = parseInt(expiryString.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000; // Default 1 day
  }
};

// Development helpers
export const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
export const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

export default authConfig;
