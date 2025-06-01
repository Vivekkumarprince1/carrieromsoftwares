import React from 'react';
import { Link } from 'react-router-dom';

const TopJobs = ({ jobCounts, getJobById }) => {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden h-full border border-gray-700">
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h5 className="font-semibold text-gray-100 text-lg">Top Jobs by Applications</h5>
      </div>
      <div className="p-6">
        {Object.keys(jobCounts).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-400 text-center">No application data available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {Object.entries(jobCounts)
              .sort((a, b) => b[1] - a[1]) // Sort by count, descending
              .map(([jobId, count]) => {
                const job = getJobById(jobId);
                return (
                  <Link 
                    key={jobId} 
                    to={`/jobs/edit/${jobId}?tab=applications`} 
                    className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg transition-colors duration-150 text-gray-300 hover:text-blue-400 border border-gray-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{job.title}</span>
                      <span className="text-xs text-gray-400">{job.company}</span>
                    </div>
                    <span className="px-3 py-1 bg-gray-800 text-blue-400 text-sm font-medium rounded-full">{count}</span>
                  </Link>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TopJobs;