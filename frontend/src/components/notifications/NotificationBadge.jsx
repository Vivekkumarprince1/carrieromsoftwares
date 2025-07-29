import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const NotificationBadge = ({ className = "", showCount = true, size = "md" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Define size variants
  const sizeClasses = {
    sm: {
      icon: "w-4 h-4",
      badge: "min-w-[14px] h-[14px] text-[8px]",
      container: "relative"
    },
    md: {
      icon: "w-5 h-5",
      badge: "min-w-[18px] h-[18px] text-[10px]",
      container: "relative"
    },
    lg: {
      icon: "w-6 h-6",
      badge: "min-w-[20px] h-[20px] text-xs",
      container: "relative"
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  useEffect(() => {
    let interval;
    
    if (currentUser) {
      fetchUnreadCount();
      
      // Set up polling for real-time updates
      interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentUser]);

  const fetchUnreadCount = async () => {
    if (isLoading || !currentUser) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await notificationService.getUnreadCount();
      const count = response.data.count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('NotificationBadge: Error fetching unread count:', error);
      setError(error.message);
      // Don't show error to user for badge component, but log it
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <Link 
      to="/notifications" 
      className={`${currentSize.container} ${className}`}
      title={`${unreadCount} unread notifications`}
    >
      {/* Bell Icon */}
      <svg 
        className={`${currentSize.icon} text-gray-400 hover:text-lime-400 transition-colors duration-300`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M13.73 21a2 2 0 0 1-3.46 0" 
        />
      </svg>
      
      {/* Notification Badge - positioned as superscript */}
      {(unreadCount > 0 || isLoading) && (
        <>
          {/* Main notification badge */}
          <span 
            className={`absolute -top-1 -right-1 ${currentSize.badge} bg-red-500 text-white rounded-full flex items-center justify-center font-bold border-2 border-black z-10`}
            style={{ lineHeight: '1' }}
          >
            {isLoading ? '...' : (showCount ? (unreadCount > 99 ? '99+' : unreadCount) : '')}
          </span>
          
          {/* Pulse animation for new notifications */}
          {!isLoading && unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 ${currentSize.badge} bg-red-500 rounded-full animate-ping opacity-75`}></span>
          )}
        </>
      )}
    </Link>
  );
};

export default NotificationBadge;
