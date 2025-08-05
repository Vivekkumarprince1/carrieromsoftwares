import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || '/';

  useEffect(() => {
    // Check for session expiry message in URL params
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    if (message) {
      setSessionMessage(message);
      // Clear the message from URL after showing it
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Also check for message from location state (from protected routes)
    if (location.state?.message) {
      setSessionMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(formData);
      
      console.log('Login response:', response);
      console.log('User role:', response.user?.role);
      console.log('From path:', from);
      
      // Check if user is admin and redirect accordingly
      if (response.user && response.user.role === 'admin') {
        console.log('Navigating to dashboard for admin');
        navigate('/dashboard', { replace: true });
      } else {
        // For regular users, navigate to home page or the intended page
        // But avoid redirecting to admin-only routes
        let targetPath = from;
        
        // List of admin-only routes
        const adminOnlyRoutes = [
          '/dashboard',
          '/certificates', 
          '/offer-letters',
          '/jobs/create',
          '/admin/'
        ];
        
        // Check if the target path is admin-only
        const isAdminRoute = adminOnlyRoutes.some(route => 
          from === route || from.startsWith(route) || from.startsWith('/jobs/edit/')
        );
        
        if (isAdminRoute) {
          targetPath = '/';
        }
        
        console.log('Navigating to:', targetPath);
        navigate(targetPath, { replace: true });
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requiresVerification) {
        // Redirect to email verification if email is not verified
        navigate('/verify-email', { state: { email: formData.email, password: formData.password } });
      } else {
        setError(errorData?.message || 'Invalid login credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{' '}
            <Link to="/register" className="font-medium text-lime-400 hover:text-lime-300">
              create a new account
            </Link>
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          {sessionMessage && (
            <div className="mb-6 bg-yellow-900/30 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-md">
              <p className="font-medium">{sessionMessage}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-lime-400 hover:text-lime-300">
                  Forgot your password?
                </Link>
              </div>
              <input
                type="password"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-white"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-lime-400 hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400 transition-colors duration-300 disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;