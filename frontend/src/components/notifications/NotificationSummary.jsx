import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const NotificationSummary = ({ className = "" }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchRecentNotifications();
    }
  }, [currentUser]);

  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await notificationService.getUserNotifications({
        limit: 5,
        page: 1
      });
      
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffTime = Math.abs(now - notificationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getNotificationIcon = (type, priority = 'medium') => {
    switch (type) {
      case 'job_update':
        const iconColor = priority === 'high' ? 'text-orange-500' : 'text-blue-500';
        return (
          <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'application_status':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        <Link 
          to="/notifications" 
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-400">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM10.07 2.82a3 3 0 014.24 0l1.41 1.41a3 3 0 010 4.24l-7.07 7.07a3 3 0 01-4.24 0L2.82 14.13a3 3 0 010-4.24l7.25-7.07z" />
          </svg>
          <p className="text-gray-400 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification._id}
              to="/notifications"
              className={`block p-3 rounded-lg transition-colors duration-200 ${
                !notification.isRead 
                  ? 'bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/30' 
                  : 'bg-gray-700/50 hover:bg-gray-700/70'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 ${!notification.isRead ? 'opacity-100' : 'opacity-50'}`}>
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      !notification.isRead ? 'text-white' : 'text-gray-300'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {notification.priority === 'high' && (
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                      )}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.relatedJobId && (
                      <span className="text-xs text-blue-400 truncate max-w-[120px]">
                        {notification.relatedJobId?.title || 'Job'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationSummary;
