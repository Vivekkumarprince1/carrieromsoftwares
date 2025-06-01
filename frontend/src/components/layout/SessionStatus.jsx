import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatTimeUntilExpiry } from '../../utils/tokenUtils';
import { getTokenWarningThreshold, shouldShowSessionStatus } from '../../config/authConfig';

const SessionStatus = () => {
  const { currentUser } = useAuth();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const updateTimeDisplay = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const timeLeft = formatTimeUntilExpiry(token);
      setTimeUntilExpiry(timeLeft);

      // Show warning based on configurable threshold
      const warningThresholdMs = getTokenWarningThreshold();
      const minutesLeft = (expiryTime - rawTimeLeft) / (1000 * 60);
      const warningThresholdMinutes = warningThresholdMs / (1000 * 60);
      
      setShowWarning(minutesLeft < warningThresholdMinutes && minutesLeft > 0);
    };

    // Update immediately
    updateTimeDisplay();

    // Update every minute
    const interval = setInterval(updateTimeDisplay, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser || !shouldShowSessionStatus()) return null;

  return (
    <div className={`text-xs px-2 py-1 rounded ${
      showWarning 
        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500' 
        : 'bg-gray-800 text-gray-400'
    }`}>
      {showWarning && <span className="mr-1">⚠️</span>}
      Session: {timeUntilExpiry}
    </div>
  );
};

export default SessionStatus;
