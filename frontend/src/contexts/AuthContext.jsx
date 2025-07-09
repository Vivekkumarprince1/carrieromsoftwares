import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { getTokenCheckInterval } from '../config/authConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    // Check if token exists and is not expired
    if (user && token && !authService.isTokenExpired()) {
      setCurrentUser(user);
    } else if (token && authService.isTokenExpired()) {
      // Token is expired, clear auth data
      authService.clearAuthData();
      setCurrentUser(null);
    }
    
    setLoading(false);

    // Listen for token expiry events
    const handleTokenExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // Check token validity on app focus/visibility change
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');
      if (token && currentUser) {
        try {
          // Try to make a simple authenticated request to verify token
          const response = await fetch('/api/auth/user-data', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            // Token is invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setCurrentUser(null);
            if (window.location.pathname !== '/login') {
              window.location.href = '/login?message=Session expired. Please login again.';
            }
          }
        } catch (error) {
          console.error('Token validation error:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        checkTokenValidity();
      }
    };

    const handleFocus = () => {
      if (currentUser) {
        checkTokenValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  

  // Periodic token validity check
  useEffect(() => {
    if (!currentUser) return;

    const checkTokenPeriodically = () => {
      const token = localStorage.getItem('token');
      if (token && authService.isTokenExpired()) {
        console.log('Token expired during periodic check');
        authService.clearAuthData();
        setCurrentUser(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?message=Your session has expired. Please login again.';
        }
      }
    };

    // Check every interval defined in config (default 5 minutes)
    const interval = setInterval(checkTokenPeriodically, getTokenCheckInterval());

    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token, user } = response.data;
      
      console.log('AuthContext: Login response received:', { token: !!token, user: user });
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update current user state and wait for it to be set
      setCurrentUser(user);
      
      console.log('AuthContext: User state updated to:', user);
      
      // Return the response data for navigation logic
      return { ...response.data, user };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };



  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response; // Return the full response to check for requiresVerification
    } catch (error) {
      throw error;
    }
  };



  const logout = () => {
    authService.clearAuthData();
    setCurrentUser(null);
  };



  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };



  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};