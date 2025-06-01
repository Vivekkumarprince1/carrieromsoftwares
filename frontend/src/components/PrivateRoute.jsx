import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Check if token exists but is expired
  const token = localStorage.getItem('token');
  if (token && authService.isTokenExpired()) {
    authService.clearAuthData();
    return <Navigate to="/login" state={{ 
      message: "Your session has expired. Please login again.",
      from: location.pathname 
    }} />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }

  return children;
};

export default PrivateRoute;