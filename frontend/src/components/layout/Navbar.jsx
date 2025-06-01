import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userBtnRef = useRef(null);
  
  // Handle window scroll for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuOpen && 
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) &&
        userBtnRef.current && 
        !userBtnRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Reset UI state when route changes
  useEffect(() => {
    if (userMenuOpen) setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };



  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      {/* Top navbar with logo and user dropdown */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out ${
          scrolled 
            ? 'bg-black/80 shadow-lg backdrop-blur-md' 
            : 'bg-transparent'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {/* <span className="h-8 w-8 bg-gradient-to-br from-lime-400 to-amber-600 rounded-md flex items-center justify-center text-white font-bold text-xl">
                C
              </span>
              <span className="text-white text-xl font-bold">OM</span>
              <span className="text-lime-400">SOFTWARES</span> */}
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="h-16 rounded-md"
              />
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <Link 
                to="/" 
                className={`${
                  location.pathname === '/' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                } font-medium transition-colors duration-300`}
              >
                Home
              </Link>
              <Link 
                to="/jobs" 
                className={`${
                  location.pathname === '/jobs' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                } font-medium transition-colors duration-300`}
              >
                Jobs
              </Link>
              {currentUser && (
                <Link 
                  to="/my-applications" 
                  className={`${
                    location.pathname === '/my-applications' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                  } font-medium transition-colors duration-300`}
                >
                  My Applications
                </Link>
              )}
              {currentUser && currentUser.role === 'admin' && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`${
                      location.pathname === '/dashboard' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                    } font-medium transition-colors duration-300`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/certificates" 
                    className={`${
                      location.pathname === '/certificates' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                    } font-medium transition-colors duration-300`}
                  >
                    Certificates and Offer Letters
                  </Link>
                  {/* <Link 
                    to="/offer-letters" 
                    className={`${
                      location.pathname === '/offer-letters' ? 'text-lime-400' : 'text-white hover:text-lime-400'
                    } font-medium transition-colors duration-300`}
                  >
                    Offer Letters
                  </Link> */}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User menu or login button */}
            {currentUser ? (
              <div className="relative ml-3">
                <div>
                  <button
                    ref={userBtnRef}
                    onClick={toggleUserMenu}
                    className="flex items-center max-w-xs text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-400 to-amber-700 flex items-center justify-center text-white font-semibold">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block ml-2">{currentUser.name || currentUser.email}</span>
                    <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Desktop user dropdown */}
                {userMenuOpen && (
                  <div 
                    ref={userMenuRef}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-900 border border-gray-700 ring-1 ring-black ring-opacity-5 divide-y divide-gray-700 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1"
                  >
                    <div className="py-1" role="none">
                      <div className="block px-4 py-2 text-sm text-gray-300" role="menuitem">
                        <p className="font-medium">{currentUser.name || currentUser.email}</p>
                        <p className="text-gray-400">{currentUser.email}</p>
                        <p className="text-xs text-lime-400 mt-1">{currentUser.role}</p>
                      </div>
                    </div>
                    {/* <div className="py-1" role="none">
                      {currentUser.role === 'user' && (
                        <Link
                          to="/my-applications"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                          role="menuitem"
                        >
                          My Applications
                        </Link>
                      )}
                      {currentUser.role === 'admin' && (
                        <>
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                            role="menuitem"
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/certificates"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                            role="menuitem"
                          >
                            Certificates
                          </Link>
                        </>
                      )}
                    </div> */}
                    <div className="py-1" role="none">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors duration-150"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-white hover:text-lime-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-lime-400 to-amber-600 hover:from-lime-500 hover:to-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
            

          </div>
        </div>
      </div>
    </nav>
    
    {/* Bottom Navigation Bar with Icons - Only for small screens */}
    <nav className="md:hidden fixed bottom-0 w-full bg-black/80 shadow-lg backdrop-blur-md z-50 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/' ? 'text-lime-400' : 'text-white'}`}
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link 
            to="/jobs" 
            className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/jobs' ? 'text-lime-400' : 'text-white'}`}
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Jobs</span>
          </Link>

          <Link 
            to="/verify" 
            className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/verify' ? 'text-lime-400' : 'text-white'}`}
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs mt-1">Verify</span>
          </Link>
          
          {currentUser && (
            <Link 
              to="/my-applications" 
              className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/my-applications' ? 'text-lime-400' : 'text-white'}`}
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs mt-1">My Applications</span>
            </Link>
          )}
          
          {!currentUser ? (
            <Link 
              to="/login" 
              className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/login' ? 'text-lime-400' : 'text-white'}`}
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-xs mt-1">Sign In</span>
            </Link>
          ) : (
            <>
              {currentUser.role === 'admin' && (
                <Link 
                  to="/dashboard" 
                  className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/dashboard' ? 'text-lime-400' : 'text-white'}`}
                >
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs mt-1">Dashboard</span>
                </Link>
              )}
            </>
          )}
          
          {currentUser && currentUser.role === 'admin' && (
            <>
              <Link 
                to="/certificates" 
                className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/certificates' ? 'text-lime-400' : 'text-white'}`}
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-xs mt-1">Certificates</span>
              </Link>
              <Link 
                to="/offer-letters" 
                className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === '/offer-letters' ? 'text-lime-400' : 'text-white'}`}
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs mt-1">Offers</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
  // );
};

export default Navbar;