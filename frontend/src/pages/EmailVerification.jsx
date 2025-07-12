import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const EmailVerification = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Get email and password from location state (from registration or login)
    const stateEmail = location.state?.email;
    const statePassword = location.state?.password;
    if (stateEmail) {
      setEmail(stateEmail);
      if (statePassword) {
        setPassword(statePassword);
      }
    } else {
      // Redirect to login if no email provided
      navigate('/login');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      if (error) setError('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyEmail({ email, otp });
      
      // If password is available, automatically log in the user
      if (password) {
        try {
          await login({ email, password });
          toast.success('Email verified successfully! You are now logged in.');
          navigate('/dashboard');
        } catch (loginError) {
          // If auto-login fails, redirect to login page
          toast.success('Email verified successfully! Please log in with your credentials.');
          navigate('/login');
        }
      } else {
        toast.success('Email verified successfully! You can now login.');
        navigate('/login');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await authService.resendVerificationOTP({ email });
      toast.success('Verification code sent to your email');
      setOtp('');
      setError('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.945L21 8m-18 0l7.89 4.945L21 8M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-gray-300 mb-4">
              We've sent a verification code to
            </p>
            <p className="text-lime-400 font-semibold break-all">
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-white font-medium mb-2 text-center">
                Enter 6-digit verification code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={handleChange}
                maxLength={6}
                className={`w-full px-4 py-4 bg-gray-800 border ${
                  error ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono`}
                placeholder="000000"
                autoComplete="one-time-code"
              />
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-400 hover:bg-lime-300 text-black font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm mb-3">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-lime-400 hover:text-lime-300 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend verification code'}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              Need help?{' '}
              <Link to="/contact" className="text-lime-400 hover:text-lime-300 underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
