import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { applicationService, jobService } from '../services/api';
import { useAuth } from '../hooks/useAuth';


const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [jobDetails, setJobDetails] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/my-applications' } });
      return;
    }

    if (location.state?.success) {
      setSuccessMessage('Application submitted successfully!');
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
    
    loadMyApplications();
  }, [currentUser, location, navigate]);

  // Add effect to reset copied ID notification after 3 seconds
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const loadMyApplications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await applicationService.getMyApplications();
      setApplications(response.data);

      // Fetch job details for all applications
      // Extract job IDs, handling both string IDs and populated job objects
      const jobIds = [...new Set(response.data.map(app => {
        // If jobId is an object (populated), get its _id property
        if (app.jobId && typeof app.jobId === 'object' && app.jobId._id) {
          return app.jobId._id;
        }
        // Otherwise, use the jobId directly (it's a string)
        return app.jobId;
      }))];
      
      const jobDetailsObj = {};

      // For applications with already populated job objects, add them to jobDetails
      response.data.forEach(app => {
        if (app.jobId && typeof app.jobId === 'object' && app.jobId._id) {
          jobDetailsObj[app.jobId._id] = app.jobId;
        }
      });

      // Fetch any missing job details that weren't already populated
      const missingJobIds = jobIds.filter(id => !jobDetailsObj[id]);
      
      if (missingJobIds.length > 0) {
        await Promise.all(missingJobIds.map(async (jobId) => {
          try {
            const jobResponse = await jobService.getJobById(jobId);
            jobDetailsObj[jobId] = jobResponse.data;
          } catch (err) {
            console.error(`Error fetching job ${jobId}:`, err);
            jobDetailsObj[jobId] = { title: 'Unknown Job', company: 'N/A', location: 'Unknown Location' };
          }
        }));
      }

      setJobDetails(jobDetailsObj);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading your applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApplication = async (application) => {
    // If the application is already selected, deselect it
    if (selectedApplication && selectedApplication._id === application._id) {
      setSelectedApplication(null);
      return;
    }
    
    // Otherwise, select the application
    setSelectedApplication(application);
    
    // Extract the job ID, handling both string IDs and populated job objects
    const jobId = (application.jobId && typeof application.jobId === 'object' && application.jobId._id) 
      ? application.jobId._id 
      : application.jobId;
    
    // If we don't have job details for this application yet, fetch them
    if (!jobDetails[jobId] || !jobDetails[jobId]?.description) {
      setLoadingDetails(true);
      try {
        const jobResponse = await jobService.getJobById(jobId);
        setJobDetails(prev => ({
          ...prev,
          [jobId]: jobResponse.data
        }));
      } catch (err) {
        console.error(`Error fetching job details for ${jobId}:`, err);
        // Set a fallback job detail if fetch fails
        if (!jobDetails[jobId]) {
          setJobDetails(prev => ({
            ...prev,
            [jobId]: { title: 'Unknown Job', company: 'N/A', location: 'Unknown Location' }
          }));
        }
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-600';
      case 'reviewing': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'shortlisted': return 'bg-gradient-to-r from-indigo-500 to-violet-600';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'offered': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'hired': return 'bg-gradient-to-r from-green-600 to-emerald-700';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  // Add function to copy application ID to clipboard
  const copyApplicationId = (id, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    navigator.clipboard.writeText(id)
      .then(() => {
        setCopiedId(id);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen py-10 px-4 flex items-center justify-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-yellow shadow-[0_0_15px_rgba(255,193,7,0.5)]"></div>
          </div>
          <p className="text-center text-gray-300 mt-6 text-lg">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-yellow to-amber-400 mb-12 text-center"></h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-md text-red-400 shadow-md backdrop-blur-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-md text-green-400 shadow-md backdrop-blur-sm animate-pulse">
            {successMessage}
          </div>
        )}
        
        <div className="w-full">
          <div className="bg-gray-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden border border-gray-800">
            <div className="p-5 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
              <h2 className="text-2xl  font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Application History
              </h2>
            </div>
            
            <div className="p-5">
              {applications.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="mb-6 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-white mb-3">You haven't applied for any jobs yet.</h3>
                  <p className="text-gray-400 mb-8 max-w-lg mx-auto">Browse available jobs and submit your first application to kickstart your career journey.</p>
                  <Link to="/jobs" className="px-8 py-3 bg-black text-white font-medium rounded-md transition-all duration-300 shadow-lg hover:shadow-amber-500/20">
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-5 divide-y divide-gray-800">
                  {applications.map(application => (
                    <div key={application._id} className="py-5">
                      <div 
                        className={`rounded-xl cursor-pointer transition-all duration-300 group ${
                          selectedApplication && selectedApplication._id === application._id 
                            ? 'bg-gradient-to-r from-secondary-black to-gray-900 border-l-4  shadow-lg shadow-primary-yellow/10 backdrop-blur-sm' 
                            : 'hover:bg-gray-900/80 hover:shadow-md hover:border-l-4 hover:border-white'
                        }`}
                      >
                        <div 
                          className="p-5"
                          onClick={() => handleSelectApplication(application)}
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                            <div>
                              <h3 className="text-xl font-medium mb-2 text-white group-hover:font-extrabold transition-colors duration-300">
                              {(() => {
                                // Get the job ID, whether it's a string or object with _id
                                const jobId = (application.jobId && typeof application.jobId === 'object' && application.jobId._id) 
                                  ? application.jobId._id 
                                  : application.jobId;
                                
                                // If jobId is an object with title, use that directly
                                if (typeof application.jobId === 'object' && application.jobId.title) {
                                  return application.jobId.title;
                                }
                                
                                // Otherwise look up in jobDetails
                                return jobDetails[jobId]?.title || 'Loading...';
                              })()}
                            </h3>
                            <p className="text-gray-400 flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium text-gray-300">
                                {(() => {
                                  const jobId = (application.jobId && typeof application.jobId === 'object' && application.jobId._id) 
                                    ? application.jobId._id 
                                    : application.jobId;
                                  
                                  if (typeof application.jobId === 'object' && application.jobId.company) {
                                    return application.jobId.company;
                                  }
                                  
                                  return jobDetails[jobId]?.company || 'Unknown Company';
                                })()}
                              </span>
                              <span className="text-gray-600">•</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {(() => {
                                const jobId = (application.jobId && typeof application.jobId === 'object' && application.jobId._id) 
                                  ? application.jobId._id 
                                  : application.jobId;
                                
                                if (typeof application.jobId === 'object' && application.jobId.location) {
                                  return application.jobId.location;
                                }
                                
                                return jobDetails[jobId]?.location || 'Unknown Location';
                              })()}
                            </p>
                            <div className="mt-3 flex items-center flex-wrap gap-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(application.status)} text-white shadow-md`}>
                                <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></span>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              <span className="text-sm text-gray-400 flex items-center bg-gray-800/40 px-2 py-0.5 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Applied on {formatDate(application.createdAt)}
                              </span>
                            </div>
                          </div>
                          <button 
                            className={`px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium flex items-center ${
                              selectedApplication && selectedApplication._id === application._id
                                ? 'bg-black text-white hover:from-gray-800 hover:to-gray-700 hover:shadow-lg'
                                : 'bg-black text-white hover:from-gray-700 hover:to-gray-600 hover:shadow-md'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectApplication(application);
                            }}
                          >
                            {selectedApplication && selectedApplication._id === application._id ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Hide Details
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {selectedApplication && selectedApplication._id === application._id && (
                        <div className="px-5 pb-5 pt-6 border-t border-gray-700/50 transition-all duration-500 animate-fade-in-up">
                          {loadingDetails ? (
                            <div className="p-8 text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-yellow mx-auto shadow-[0_0_10px_rgba(255,193,7,0.3)]"></div>
                              <p className="mt-4 text-gray-400 text-lg">Loading details...</p>
                            </div>
                          ) : (
                            <div>
                              {/* Application ID with copy button */}
                              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-400 mr-2">Application ID:</span>
                                  <span className="text-primary-yellow font-mono">{application._id}</span>
                                </div>
                                <button 
                                  onClick={(e) => copyApplicationId(application._id, e)}
                                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs flex items-center transition-all duration-300"
                                  title="Copy Application ID"
                                >
                                  {copiedId === application._id ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                      </svg>
                                      Copy ID
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                  <h4 className="font-medium text-primary-yellow mb-3 flex items-center text-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Contact Information
                                  </h4>
                                  <div className="space-y-2">
                                    <p className="text-gray-300 flex items-start">
                                      <span className="font-medium text-gray-400 w-16 inline-block">Name:</span> 
                                      <span className="ml-1">{selectedApplication.fullName}</span>
                                    </p>
                                    <p className="text-gray-300 flex items-start">
                                      <span className="font-medium text-gray-400 w-16 inline-block">Email:</span> 
                                      <span className="ml-1">{selectedApplication.email}</span>
                                    </p>
                                    <p className="text-gray-300 flex items-start">
                                      <span className="font-medium text-gray-400 w-16 inline-block">Phone:</span> 
                                      <span className="ml-1">{selectedApplication.phone}</span>
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                  <h4 className="font-medium text-primary-yellow mb-3 flex items-center text-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Resume
                                  </h4>
                                  {selectedApplication.resumeUrl ? (
                                    <a 
                                      href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${selectedApplication.resumeUrl}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-md transition-all duration-300 text-sm shadow-md hover:shadow-lg"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      View Resume
                                    </a>
                                  ) : (
                                    <p className="text-gray-500 italic">No resume file available</p>
                                  )}
                                </div>
                                
                                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 md:col-span-2">
                                  <h4 className="font-medium text-primary-yellow mb-3 flex items-center text-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Cover Letter
                                  </h4>
                                  <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{selectedApplication.coverLetter}</p>
                                  </div>
                                </div>

                                {selectedApplication.questionAnswers && selectedApplication.questionAnswers.length > 0 && (
                                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 md:col-span-2">
                                    <h4 className="font-medium text-primary-yellow mb-3 flex items-center text-lg">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Question Responses
                                    </h4>
                                    <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                      {selectedApplication.questionAnswers.map((qa, index) => (
                                        <div key={index} className="border-b border-gray-600/50 pb-4 last:border-b-0 last:pb-0">
                                          <p className="font-medium text-white mb-2">{index + 1}. {qa.questionText}</p>
                                          <div className="pl-4 mt-2 bg-gray-700/20 p-3 rounded-lg border border-gray-600/30">
                                            {qa.questionType === 'file' ? (
                                              qa.fileUrl ? (
                                                <a href={qa.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-all duration-300 text-sm shadow-sm hover:shadow-md">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                  {qa.answer}
                                                </a>
                                              ) : (
                                                <p className="text-gray-500 italic">No file uploaded</p>
                                              )
                                            ) : qa.questionType === 'checkbox' ? (
                                              Array.isArray(qa.answer) ? (
                                                <ul className="list-disc pl-6 text-gray-300 space-y-1">
                                                  {qa.answer.map((ans, i) => (
                                                    <li key={i} className="pl-1">{ans}</li>
                                                  ))}
                                                </ul>
                                              ) : (
                                                <p className="text-gray-300">{qa.answer || 'No answer provided'}</p>
                                              )
                                            ) : (
                                              <p className="text-gray-300">{qa.answer || <span className="italic text-gray-500">No answer provided</span>}</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
