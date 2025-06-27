import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const OfferLetterStatus = ({ offerLetter, compact = false }) => {
  if (!offerLetter) {
    return null;
  }

  const validUntil = new Date(offerLetter.validUntil);
  const today = new Date();
  const isExpired = validUntil < today;
  const isExpiringSoon = validUntil - today < 7 * 24 * 60 * 60 * 1000; // 7 days

  const getStatusConfig = () => {
    if (isExpired) {
      return {
        icon: ExclamationCircleIcon,
        text: 'Expired',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/50'
      };
    }
    
    if (isExpiringSoon) {
      return {
        icon: ClockIcon,
        text: `Expires ${validUntil.toLocaleDateString()}`,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-500/50'
      };
    }
    
    return {
      icon: CheckCircleIcon,
      text: `Valid until ${validUntil.toLocaleDateString()}`,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/50'
    };
  };

  const { icon: Icon, text, color, bgColor, borderColor } = getStatusConfig();

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color} ${bgColor} border ${borderColor}`}>
        <Icon className="w-3 h-3 mr-1" />
        {isExpired ? 'Expired' : 'Active'}
      </span>
    );
  }

  return (
    <div className={`flex items-center px-3 py-2 rounded-lg ${bgColor} border ${borderColor}`}>
      <Icon className={`w-4 h-4 mr-2 ${color}`} />
      <span className={`text-sm font-medium ${color}`}>
        {text}
      </span>
    </div>
  );
};

export default OfferLetterStatus;
