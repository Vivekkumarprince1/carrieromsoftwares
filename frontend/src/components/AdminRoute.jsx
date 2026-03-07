import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';

const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
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

  // If user is not logged in, redirect to login with admin message
  if (!currentUser) {
    return <Navigate to="/login" state={{ 
      // message: "You must be an admin to access this page",
      from: location.pathname 
    }} />;
  }

  // If user is logged in but not admin, redirect to home page without message
  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
