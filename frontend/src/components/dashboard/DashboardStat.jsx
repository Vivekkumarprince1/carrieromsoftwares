import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';

const DashboardStat = memo(({ title, value, subtitle, icon, gradientFrom, gradientTo, borderColor, redirectTo, onScroll }) => {
  const handleClick = useCallback(() => {
    if (onScroll) {
      onScroll();
    }
  }, [onScroll]);

  return (
    <div className={`bg-gradient-to-br from-${gradientFrom} to-${gradientTo} text-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-${borderColor} relative group`}>
      <div className="p-6">
        <div className="flex items-center mb-2">
          {icon}
          <h5 className="text-xl font-bold">{title}</h5>
        </div>
        <h2 className="text-4xl font-extrabold mb-3">{value}</h2>
        <p className="text-sm opacity-80">
          {subtitle}
        </p>
      </div>
      
      {/* Redirect Button */}
      {(redirectTo || onScroll) && (
        redirectTo ? (
          <Link
            to={redirectTo}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
            title={`View ${title}`}
          >
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 5v14m7-7H5" 
              />
            </svg>
          </Link>
        ) : (
          <button
            onClick={handleClick}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
            title={`View ${title}`}
          >
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </button>
        )
      )}
    </div>
  );
});

export default DashboardStat;