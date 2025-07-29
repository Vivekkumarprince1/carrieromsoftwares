import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';

const JobUpdateNotificationCard = ({ notification, onMarkAsRead, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const handleViewJob = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const getUpdateTypeIcon = (updateType) => {
    switch (updateType) {
      case 'requirements':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'responsibilities':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'both':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderChangesList = (oldItems, newItems, title) => {
    if (!Array.isArray(oldItems) || !Array.isArray(newItems)) return null;
    
    const oldSet = new Set(oldItems);
    const newSet = new Set(newItems);
    
    const added = newItems.filter(item => !oldSet.has(item));
    const removed = oldItems.filter(item => !newSet.has(item));
    const unchanged = oldItems.filter(item => newSet.has(item));

    if (added.length === 0 && removed.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-200 mb-2">{title} Changes:</h4>
        
        {added.length > 0 && (
          <div className="mb-2">
            <span className="text-sm font-medium text-green-400">✓ Added:</span>
            <ul className="list-disc list-inside ml-4 text-sm text-gray-300">
              {added.map((item, index) => (
                <li key={index} className="bg-green-900/30 px-2 py-1 rounded mb-1">{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {removed.length > 0 && (
          <div className="mb-2">
            <span className="text-sm font-medium text-red-400">✗ Removed:</span>
            <ul className="list-disc list-inside ml-4 text-sm text-gray-300">
              {removed.map((item, index) => (
                <li key={index} className="bg-red-900/30 px-2 py-1 rounded mb-1">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {unchanged.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-400">○ Unchanged:</span>
            <ul className="list-disc list-inside ml-4 text-sm text-gray-400">
              {unchanged.map((item, index) => (
                <li key={index} className="px-2 py-1">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-200 ${
      !notification.isRead 
        ? notification.priority === 'high'
          ? 'border-l-orange-500 bg-orange-900/10'
          : 'border-l-blue-500 bg-blue-900/10'
        : 'border-l-gray-600'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          notification.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'
        }`}>
          {getUpdateTypeIcon(notification.jobUpdateDetails?.updateType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold ${
              !notification.isRead ? 'text-white' : 'text-gray-300'
            }`}>
              {notification.title}
            </h3>
            <div className="flex items-center space-x-2">
              {notification.priority === 'high' && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                  High Priority
                </span>
              )}
              {!notification.isRead && (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="text-gray-400 mb-3 leading-relaxed">
            {notification.message}
          </p>
          
          {notification.relatedJobId && (
            <div className="mb-3">
              <Link 
                to={`/apply/${notification.relatedJobId._id || notification.relatedJobId}`}
                onClick={handleViewJob}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-900/50 text-blue-300 rounded-full hover:bg-blue-900/70 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                View {notification.relatedJobId?.title || 'Job'}
              </Link>
            </div>
          )}

          {/* Update Details Section */}
          {notification.jobUpdateDetails && (
            <div className="mt-3">
              <button
                onClick={handleToggleDetails}
                className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>View detailed changes</span>
                <svg 
                  className={`w-4 h-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h4 className="font-medium text-gray-200 mb-3">What Changed:</h4>
                  
                  {notification.jobUpdateDetails.updateType === 'requirements' || notification.jobUpdateDetails.updateType === 'both' ? (
                    renderChangesList(
                      notification.jobUpdateDetails.oldRequirements,
                      notification.jobUpdateDetails.newRequirements,
                      'Job Requirements'
                    )
                  ) : null}
                  
                  {notification.jobUpdateDetails.updateType === 'responsibilities' || notification.jobUpdateDetails.updateType === 'both' ? (
                    renderChangesList(
                      notification.jobUpdateDetails.oldResponsibilities,
                      notification.jobUpdateDetails.newResponsibilities,
                      'Job Responsibilities'
                    )
                  ) : null}
                  
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h5 className="font-medium text-blue-300 mb-1">Recommended Actions:</h5>
                        <ul className="text-sm text-blue-200 space-y-1">
                          <li>• Review the updated job requirements carefully</li>
                          {notification.jobUpdateDetails.updateType === 'requirements' || notification.jobUpdateDetails.updateType === 'both' ? (
                            <li>• Consider updating your skills or qualifications to match new requirements</li>
                          ) : null}
                          <li>• Update your application or portfolio if needed</li>
                          <li>• Contact the hiring team if you have questions about the changes</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              {formatDate(notification.createdAt)}
            </span>
            <button
              onClick={() => onDismiss(notification._id)}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobUpdateNotificationCard;
