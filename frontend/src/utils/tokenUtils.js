// Token utility functions
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Parse JWT token to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Add a 30-second buffer to handle clock skew
    return payload.exp < (currentTime + 30);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

export const getTokenExpiryTime = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error parsing token expiry:', error);
    return null;
  }
};

export const getTimeUntilExpiry = (token) => {
  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return 0;

  return Math.max(0, expiryTime.getTime() - Date.now());
};

export const formatTimeUntilExpiry = (token) => {
  const timeLeft = getTimeUntilExpiry(token);
  if (timeLeft <= 0) return 'Expired';

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
