import React from 'react';

const StatusDistribution = ({ statusCounts, getStatusLabel }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500',
      reviewing: 'bg-blue-400',
      shortlisted: 'bg-blue-600',
      rejected: 'bg-red-500',
      offered: 'bg-green-500',
      hired: 'bg-green-600'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden h-full border border-gray-700">
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h5 className="font-semibold text-gray-100 text-lg">Applications by Status</h5>
      </div>
      <div className="p-6">
        {Object.keys(statusCounts).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-gray-400 text-center">No application data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg transition-colors duration-150 border border-gray-700">
                <span className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-3 ${getStatusColor(status)}`}></span>
                  <span className="font-medium text-white">{getStatusLabel(status)}</span>
                </span>
                <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm font-medium rounded-full">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusDistribution;