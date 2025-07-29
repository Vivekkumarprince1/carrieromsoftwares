import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBadge from '../notifications/NotificationBadge';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  
  // Debug: Log current user data
  console.log('Navbar currentUser:', currentUser);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userBtnRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreBtnRef = useRef(null);
  const mobileMoreMenuRef = useRef(null);
  const mobileMoreBtnRef = useRef(null);
  
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
  }, [scrolled]);  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown
      if (
        userMenuOpen && 
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) &&
        userBtnRef.current && 
        !userBtnRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
      
      // Close desktop more dropdown
      if (
        moreMenuOpen && 
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target) &&
        moreBtnRef.current && 
        !moreBtnRef.current.contains(event.target)
      ) {
        setMoreMenuOpen(false);
      }
      
      // Close mobile more dropdown
      if (
        mobileMoreMenuOpen && 
        mobileMoreMenuRef.current &&
        !mobileMoreMenuRef.current.contains(event.target) &&
        mobileMoreBtnRef.current && 
        !mobileMoreBtnRef.current.contains(event.target)
      ) {
        setMobileMoreMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, moreMenuOpen, mobileMoreMenuOpen]);

  // Reset UI state when route changes
  useEffect(() => {
    if (userMenuOpen) setUserMenuOpen(false);
    if (moreMenuOpen) setMoreMenuOpen(false);
    if (mobileMoreMenuOpen) setMobileMoreMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleMoreMenu = () => {
    setMoreMenuOpen(!moreMenuOpen);
  };

  const toggleMobileMoreMenu = () => {
    setMobileMoreMenuOpen(!mobileMoreMenuOpen);
  };

  // Generate navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { to: '/jobs', label: 'Jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
    ];

    let additionalItems = [];

    if (!currentUser) {
      additionalItems = [
        { to: '/login', label: 'Login', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' }
      ];
    } else if (currentUser.role === 'user') {
      additionalItems = [
        { to: '/my-applications', label: 'My Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
      ];
      
      if (currentUser.employeeStatus === 'employee') {
        additionalItems.push({ to: '/employee/profile', label: 'Employee Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' });
      }
      
      if (currentUser.employeeStatus === 'offer_recipient' || currentUser.employeeStatus === 'employee') {
        additionalItems.push({ to: '/reviews/submit', label: 'Write Review', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' });
      }
    } else if (currentUser.role === 'admin') {
      additionalItems = [
        { to: '/dashboard', label: 'Dashboard', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { to: '/certificates', label: 'Certificates', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
        { to: '/admin/reviews', label: 'Review Management', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
        { to: '/admin/recommendations', label: 'Recommendation Management', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { to: '/admin/employees', label: 'Employee Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' }
      ];
    }

    return [...baseItems, ...additionalItems];
  };

  const allNavItems = getNavigationItems();
  const shouldShowMore = allNavItems.length > 5;
  const visibleItems = shouldShowMore ? allNavItems.slice(0, 4) : allNavItems;
  const moreItems = shouldShowMore ? allNavItems.slice(4) : [];

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
          <div className={`hidden md:block ${!currentUser ? 'flex-1' : ''}`}>
            <div className={`ml-10 flex items-center space-x-6 ${!currentUser ? 'justify-end' : ''}`}>
              {visibleItems.map((item) => {
                // Special styling for Login button
                if (item.label === 'Login') {
                  return (
                    <Link 
                      key={item.to}
                      to={item.to} 
                      className="bg-lime-400 text-black font-semibold px-6 py-2 rounded-full hover:bg-lime-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {item.label}
                    </Link>
                  );
                }
                // Regular styling for other nav items
                return (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    className={`${
                      location.pathname === item.to ? 'text-lime-400' : 'text-white hover:text-lime-400'
                    } font-medium transition-colors duration-300`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Show More dropdown only if needed */}
              {shouldShowMore && (
                <div className="relative">
                  <button
                    ref={moreBtnRef}
                    onClick={toggleMoreMenu}
                    className="flex items-center text-white hover:text-lime-400 font-medium transition-colors duration-300 focus:outline-none"
                  >
                    More
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Desktop More Dropdown Menu */}
                  {moreMenuOpen && (
                    <div 
                      ref={moreMenuRef}
                      className="absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-gray-900 border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                      {moreItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-lime-400 transition-colors duration-150"
                          onClick={() => setMoreMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User menu or login button */}
            {currentUser && (
              <div className="flex items-center space-x-4">
                {/* Notification Badge */}
                <NotificationBadge size="md" />
                
                {/* User Profile Menu */}
                <div className="relative">
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
                        {/* Debug info - remove this later */}
                        <p className="text-xs text-blue-400 mt-1">Status: {currentUser.employeeStatus || 'undefined'}</p>
                        <p className="text-xs text-blue-400">ID: {currentUser.employeeId || 'none'}</p>
                      </div>
                    </div>
                    
                    <div className="py-1" role="none">
                      <Link 
                        to="/dashboard" 
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-lime-400 transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-lime-400 transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      
                    </div>
                    
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
          {visibleItems.map((item) => {
            // Special styling for Login button in mobile view
            if (item.label === 'Login') {
              return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className="flex flex-col items-center justify-center px-3 py-2 bg-lime-400 rounded-lg text-black font-semibold transform hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            }
            // Regular styling for other nav items
            return (
              <Link 
                key={item.to}
                to={item.to} 
                className={`flex flex-col items-center justify-center px-3 py-2 ${location.pathname === item.to ? 'text-lime-400' : 'text-white'}`}
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}          {/* Show More dropdown only if needed */}
          {shouldShowMore && (
            <div className="relative">
              <button
                ref={mobileMoreBtnRef}
                onClick={toggleMobileMoreMenu}
                className="flex flex-col items-center justify-center px-3 py-2 text-white focus:outline-none"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-xs mt-1">More</span>
              </button>

              {/* More Dropdown Menu */}
              {mobileMoreMenuOpen && (
                <div 
                  ref={mobileMoreMenuRef}
                  className="absolute bottom-16 right-0 mb-2 w-48 rounded-md shadow-lg py-1 bg-gray-900 border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                >
                  {currentUser && (
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{currentUser.name || currentUser.email}</p>
                      <p className="text-xs text-gray-400">{currentUser.role}</p>
                    </div>
                  )}
                  
                  {moreItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-lime-400 transition-colors duration-150"
                      onClick={() => setMobileMoreMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Logout for authenticated users */}
                  {currentUser && (
                    <div className="border-t border-gray-700 mt-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMoreMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors duration-150"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
  // );
};

export default Navbar;