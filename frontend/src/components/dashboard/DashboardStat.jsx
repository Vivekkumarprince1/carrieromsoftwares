import React from 'react';

const DashboardStat = ({ title, value, subtitle, icon, gradientFrom, gradientTo, borderColor }) => {
  return (
    <div className={`bg-gradient-to-br from-${gradientFrom} to-${gradientTo} text-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-${borderColor}`}>
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
    </div>
  );
};

export default DashboardStat;