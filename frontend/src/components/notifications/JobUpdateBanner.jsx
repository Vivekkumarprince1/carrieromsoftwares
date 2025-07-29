import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const JobUpdateBanner = ({ applicationId, jobId, className = "" }) => {
  const [relatedNotifications, setRelatedNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && (applicationId || jobId)) {
      fetchRelatedNotifications();
    }
  }, [currentUser, applicationId, jobId]);

  const fetchRelatedNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications({
        unreadOnly: 'true',
        limit: 50
      });
      
      const notifications = response.data.notifications.filter(notification => {
        if (notification.type !== 'job_update') return false;
        
        // Match by application ID or job ID
        const matchesApplication = applicationId && 
          notification.relatedApplicationId && 
          (notification.relatedApplicationId._id === applicationId || 
           notification.relatedApplicationId === applicationId);
           
        const matchesJob = jobId && 
          notification.relatedJobId && 
          (notification.relatedJobId._id === jobId || 
           notification.relatedJobId === jobId);
           
        return matchesApplication || matchesJob;
      });
      
      setRelatedNotifications(notifications);
      setIsVisible(notifications.length > 0 && !isDismissed);
    } catch (error) {
      console.error('Error fetching related notifications:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setRelatedNotifications(prev => 
        prev.filter(n => n._id !== notificationId)
      );
      
      // Hide banner if no more notifications
      if (relatedNotifications.length === 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!isVisible || relatedNotifications.length === 0) {
    return null;
  }

  const mostRecentNotification = relatedNotifications[0];
  const hasMultiple = relatedNotifications.length > 1;

  return (
    <div className={`bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/50 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-orange-200">
              Job Requirements Updated
              {hasMultiple && (
                <span className="ml-2 px-2 py-1 text-xs bg-orange-500/30 text-orange-200 rounded-full">
                  {relatedNotifications.length} updates
                </span>
              )}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm text-orange-100 mb-3">
            {hasMultiple 
              ? "There have been multiple updates to this job's requirements. Review the changes to ensure your application remains competitive."
              : mostRecentNotification.message
            }
          </p>
          
          <div className="flex items-center space-x-3">
            <Link
              to="/notifications"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </Link>
            
            {mostRecentNotification.relatedJobId && (
              <Link
                to={`/jobs/${mostRecentNotification.relatedJobId._id || mostRecentNotification.relatedJobId}`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => handleMarkAsRead(mostRecentNotification._id)}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                View Job
              </Link>
            )}
            
            <button
              onClick={() => handleMarkAsRead(mostRecentNotification._id)}
              className="text-xs text-orange-200 hover:text-orange-100 transition-colors"
            >
              Mark as read
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobUpdateBanner;
