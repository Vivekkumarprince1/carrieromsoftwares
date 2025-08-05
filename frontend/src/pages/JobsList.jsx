import { useState, useEffect, useRef } from 'react';
import { jobService, applicationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl, getFirstLetterFallback } from '../utils/imageUtils';
import ConfirmationModal from '../components/common/ConfirmationModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicationStatuses, setApplicationStatuses] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [animateList, setAnimateList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState(window.innerWidth < 640 ? 'compact' : 'detailed');
  const [isScrolling, setIsScrolling] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  
  // States for confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  
  // Handle window resize for responsive view mode
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 640 ? 'compact' : 'detailed');
      // Collapse search on resize to larger screens
      if (window.innerWidth > 768 && searchExpanded) {
        setSearchExpanded(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [searchExpanded]);
  
  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Click outside to collapse search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchExpanded && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        // Check if the click was on the search toggle button
        const isSearchToggleClick = event.target.closest('[data-search-toggle]');
        if (!isSearchToggleClick) {
          setSearchExpanded(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchExpanded]);
  
  // Add scroll listener for enhanced UI experiences
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle success message from application submission
  useEffect(() => {
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      
      const timer = setTimeout(() => {
        setSuccessMessage('');
        // Clear the location state
        navigate('.', { replace: true, state: {} });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!loading && jobs.length > 0) {
      setAnimateList(true);
    }
  }, [loading, jobs]);

  // Simulate loading progress for better UX
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      return () => {
        clearInterval(interval);
        setLoadingProgress(100);
      };
    }
  }, [loading]);

  const loadJobs = async () => {
    setLoading(true);
    setLoadingProgress(0);
    try {
      const response = await jobService.getAllJobs();
      setJobs(response.data);
      
      // If user is logged in, check application status for all jobs
      if (currentUser) {
        await checkAllApplicationStatuses(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkAllApplicationStatuses = async (jobList) => {
    const statuses = {};
    
    // Check application status for each job
    await Promise.all(jobList.map(async (job) => {
      try {
        const response = await applicationService.checkApplicationStatus(job._id);
        statuses[job._id] = response.data;
      } catch (err) {
        // If there's an error checking status, assume not applied
        statuses[job._id] = { hasApplied: false };
      }
    }));
    
    setApplicationStatuses(statuses);
  };

  const getApplicationStatusInfo = (jobId) => {
    const status = applicationStatuses[jobId];
    if (!status || !status.hasApplied) {
      return { hasApplied: false, canApply: true };
    }
    
    return {
      hasApplied: true,
      canApply: status.status === 'rejected',
      status: status.status,
      appliedDate: status.appliedDate
    };
  };

  const renderApplyButton = (job, isCompact = false) => {
    const statusInfo = getApplicationStatusInfo(job._id);
    
    if (!statusInfo.hasApplied) {
      // User hasn't applied yet
      return (
        <button 
          className={`bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 shadow-lg hover:shadow-yellow-600/20 flex items-center justify-center gap-2`}
          onClick={(e) => {
            if (isCompact) e.stopPropagation();
            handleApply(job);
          }}
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCompact ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"} />
          </svg>
          {isCompact ? 'Apply Now' : 'Apply for this Position'}
        </button>
      );
    } else if (statusInfo.canApply) {
      // User can reapply (previous application was rejected)
      return (
        <button 
          className={`bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-500 hover:to-orange-600 text-white ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 shadow-lg hover:shadow-orange-600/20 flex items-center justify-center gap-2`}
          onClick={(e) => {
            if (isCompact) e.stopPropagation();
            handleApply(job);
          }}
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isCompact ? 'Apply Again' : 'Apply Again'}
        </button>
      );
    } else {
      // User has applied and cannot apply again
      return (
        <button 
          className={`bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium cursor-not-allowed opacity-75 flex items-center justify-center gap-2`}
          disabled
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Applied ({statusInfo.status})
        </button>
      );
    }
  };

  const handleToggleJobDetails = (id) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handleEdit = (job) => {
    navigate(`/jobs/edit/${job._id}`);
  };

  const handleAdd = () => {
    navigate('/jobs/create');
  };

  const handleDelete = async (id) => {
    const jobTitle = jobs.find(job => job._id === id)?.title || 'this job';
    setJobToDelete({ id, title: jobTitle });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      await jobService.deleteJob(jobToDelete.id);
      setJobs(jobs.filter(job => job._id !== jobToDelete.id));
      if (expandedJobId === jobToDelete.id) {
        setExpandedJobId(null);
      }
      setShowDeleteModal(false);
      setJobToDelete(null);
      
      // Show success message
      setSuccessMessage(`Job "${jobToDelete.title}" deleted successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Error deleting job with ID: ${jobToDelete.id}`);
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const handleApply = async (job) => {
    // Check if user has already applied
    const appStatus = applicationStatuses[job._id];
    if (appStatus?.hasApplied) {
      setError(`You have already applied for this job. Current status: ${appStatus.status}. You can only apply again if your application is rejected.`);
      return;
    }
    
    navigate(`/apply/${job._id}`);
  };

  const handleViewApplications = (jobId) => {
    navigate(`/jobs/edit/${jobId}?tab=applications`);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(job => 
    filterType ? job.type === filterType : true
  ).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'salary-high') {
      return parseFloat(b.salary.replace(/[^0-9.-]+/g, '')) - parseFloat(a.salary.replace(/[^0-9.-]+/g, ''));
    } else if (sortBy === 'salary-low') {
      return parseFloat(a.salary.replace(/[^0-9.-]+/g, '')) - parseFloat(b.salary.replace(/[^0-9.-]+/g, ''));
    }
    return 0;
  });

  const jobTypes = [...new Set(jobs.map(job => job.type))];

  // Check if a job was posted within the last 7 days
  const isNewJob = (createdAt) => {
    const jobDate = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* <h1 className="text-3xl font-bold mb-6 text-white text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
            Job Listings
          </span>
        </h1> */}
        <div className="w-full space-y-4">
          <div className="bg-black bg-opacity-70 rounded-xl overflow-hidden shadow-lg border border-gray-800 backdrop-blur-sm">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Loading Jobs...</h2>
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden p-4 animate-pulse">
                  <div className="flex flex-col md:flex-row justify-between gap-3">
                    <div className="flex-1 flex gap-3">
                      <div className="hidden sm:block h-16 w-16 bg-gray-700 rounded-md"></div>
                      <div className="w-full">
                        <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center justify-end">
                      <div className="h-8 bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 max-w-7xl">
      {/* Success Message Notification */}
      {successMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}
      
      {/* Hero Section with Background Image */}
      <div className="relative mb-6 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/80 to-gray-900/90 z-10 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-20 px-6 py-6 md:py-12 text-center">
          <h1 className="text-2xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-4 drop-shadow-lg">
            Discover Your Dream Career
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Explore exciting job opportunities tailored for your skills and ambitions
          </p>
          
          {/* Search Box in Hero */}
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for job titles, companies or locations..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-3 px-6 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-300 shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button 
                  className="absolute right-4 text-gray-300 hover:text-white focus:outline-none"
                  onClick={() => setSearchTerm('')}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {error && 
        <div className="bg-red-900/40 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6 animate-fade-in">
          <p>{error}</p>
        </div>
      }
      
      {/* Filter and Sort Controls */}
      <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 backdrop-blur-md mb-6 transform hover:scale-[1.01] transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 gap-4">
          {/* Left side - Filter controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <select 
                className="appearance-none bg-gray-800/80 border border-gray-700/80 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-transparent transition-all duration-300 pr-10 hover:bg-gray-700/80 cursor-pointer w-full sm:w-auto min-w-0 sm:min-w-[180px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Filter by job type"
              >
                <option value="">All Job Types</option>
                {[...new Set(jobs.map(job => job.type))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-yellow-500">
                <svg className="w-4 h-4 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="relative group flex-1 sm:flex-none">
              <select
                className="appearance-none bg-gray-800/80 border border-gray-700/80 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-transparent transition-all duration-300 pr-10 hover:bg-gray-700/80 cursor-pointer w-full sm:w-auto min-w-0 sm:min-w-[160px]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort jobs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="salary-high">Highest Salary</option>
                <option value="salary-low">Lowest Salary</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-yellow-500">
                <svg className="w-4 h-4 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Right side - Admin controls */}
          <div className="flex items-center justify-center lg:justify-end w-full lg:w-auto">
            {currentUser && currentUser.role === 'admin' && (
              <button 
                onClick={handleAdd}
                className="bg-green-600 text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 relative overflow-hidden group w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 relative z-10 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="relative z-10 text-sm sm:text-base">Post New Job</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Count Indicator */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center">
          <span className="text-white text-sm font-medium">Showing</span>
          <span className="mx-2 bg-yellow-500/20 text-yellow-400 text-sm font-bold px-2.5 py-0.5 rounded-full">
            {filteredJobs.length}
          </span>
          <span className="text-white text-sm font-medium">job opportunities</span>
        </div>
      </div>

      {/* Jobs listing section */}
      <div className="w-full space-y-6">
        {loading ? (
          <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 backdrop-blur-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="animate-spin w-5 h-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading Jobs...</span>
              </h2>
              <div className="w-24 bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-600 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden p-5 animate-pulse">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 flex gap-4">
                      <div className="hidden sm:block h-16 w-16 bg-gray-700 rounded-lg"></div>
                      <div className="w-full">
                        <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center justify-end">
                      <div className="h-9 bg-gray-700 rounded-lg w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 backdrop-blur-md p-10">
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <svg className="w-20 h-20 mb-6 text-gray-600 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">No matching jobs found</h3>
              <p className="text-gray-400 text-center max-w-md">Try adjusting your search criteria or browse all available positions</p>
              <button 
                onClick={() => {setSearchTerm(''); setFilterType('');}}
                className="mt-6 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job, index) => (
              <div 
                key={job._id} 
                className={`bg-gradient-to-r from-gray-900/95 to-gray-800/90 border border-gray-700/50 hover:border-gray-600/70 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl shadow-lg ${expandedJobId === job._id ? 'ring-2 ring-yellow-500/50' : ''} ${animateList ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <div 
                    className="p-5 flex md:flex-row justify-between gap-4 relative cursor-pointer"
                    onClick={() => handleToggleJobDetails(job._id)}
                  >
                    {isNewJob(job.createdAt) && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-md transform rotate-2 z-10">
                        NEW
                      </div>
                    )}
                    <div className="flex-1 flex gap-5">
                      {job.imageUrl ? (
                        <div className="hidden sm:block">
                          <div className="h-20 w-20 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-gray-800 to-gray-700 p-1">
                            <img 
                              src={getImageUrl(job.imageUrl)}
                              alt={job.title}
                              className="h-full w-full object-cover rounded-md transition-transform duration-500 hover:scale-110"
                              onError={(e) => {
                                const letterDiv = document.createElement('div');
                                letterDiv.className = "h-full w-full flex items-center justify-center text-white text-2xl font-bold rounded-md";
                                letterDiv.innerText = getFirstLetterFallback(job.title);
                                e.target.parentNode.appendChild(letterDiv);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex h-20 w-20 items-center justify-center bg-gray-500 text-white text-2xl font-bold rounded-lg shadow-md">
                          {getFirstLetterFallback(job.title)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white hover:text-yellow-400 transition-colors duration-300 flex items-center group">
                          {job.title}
                          <svg className="w-5 h-5 ml-2 text-gray-400 group-hover:text-yellow-400 transition-transform duration-300 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center mt-2 text-sm">
                          <span className="flex items-center text-gray-300 hover:text-white transition-colors duration-300 group">
                            <svg className="w-4 h-4 mr-1.5 text-yellow-500 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {job.company}
                          </span>
                          <span className="flex items-center text-gray-300 hover:text-white transition-colors duration-300 group">
                            <svg className="w-4 h-4 mr-1.5 text-yellow-500 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors duration-300 group">
                              <svg className="w-4 h-4 mr-1.5 text-emerald-500 group-hover:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {job.salary}
                            </span>
                          )}
                          {job.type && (
                            <span className="bg-gray-800/80 px-3 py-1 text-sm text-yellow-400 rounded-full border border-yellow-500/30 shadow-sm">
                              {job.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {currentUser && currentUser.role === 'user' && expandedJobId !== job._id && (
                        <div className="hidden md:block">
                          {renderApplyButton(job, true)}
                        </div>
                      )}
                      {currentUser && currentUser.role === 'admin' && (
                        <div className="hidden md:flex gap-2">
                          <button 
                            className="bg-blue-900/80 hover:bg-blue-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewApplications(job._id);
                            }}
                            title="View applications"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="hidden sm:inline ml-1">Applications</span>
                          </button>
                          <button 
                            className="bg-amber-900/80 hover:bg-amber-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(job);
                            }}
                            title="Edit job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline ml-1">Edit</span>
                          </button>
                          <button 
                            className="bg-red-900/80 hover:bg-red-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(job._id);
                            }}
                            title="Delete job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline ml-1">Delete</span>
                          </button>
                        </div>
                      )}
                      <button 
                        className="bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-full p-2 transition duration-300 ease-in-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleJobDetails(job._id);
                        }}
                        aria-label={expandedJobId === job._id ? "Collapse job details" : "Expand job details"}
                      >
                        <svg 
                          className={`w-5 h-5 transition-transform duration-300 ${expandedJobId === job._id ? 'transform rotate-180' : ''}`} 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile bottom section with full-width apply button */}
                  <div className="md:hidden border-t border-gray-700/50 px-5 py-4">
                    <div className="flex flex-col gap-3">
                      {currentUser && currentUser.role === 'user' && expandedJobId !== job._id && (
                        <div className="w-full">
                          {renderApplyButton(job, false)}
                        </div>
                      )}
                      {currentUser && currentUser.role === 'admin' && (
                        <div className="flex gap-2 justify-center">
                          <button 
                            className="bg-blue-900/80 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewApplications(job._id);
                            }}
                            title="View applications"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="ml-1">Applications</span>
                          </button>
                          <button 
                            className="bg-amber-900/80 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(job);
                            }}
                            title="Edit job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="ml-1">Edit</span>
                          </button>
                          <button 
                            className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(job._id);
                            }}
                            title="Delete job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="ml-1">Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable job details section */}
                {expandedJobId === job._id && (
                  <div className="border-t border-gray-700/50 p-6 space-y-6 bg-gradient-to-b from-gray-800/50 to-gray-900/80 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Job Description
                        </h3>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{job.description}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Requirements
                        </h3>
                        {Array.isArray(job.requirements) ? (
                          <ul className="text-gray-300 space-y-2">
                            {job.requirements.map((req, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="w-4 h-4 text-yellow-500 mt-1 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-300 leading-relaxed">{job.requirements}</p>
                        )}
                      </div>
                    </div>
                    
                    {currentUser && (
                      <div className="pt-4 flex justify-center">
                        {renderApplyButton(job, false)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!currentUser && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/30 border border-yellow-600/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">Ready to apply for your dream job?</h3>
                <p className="text-yellow-100">Sign in to your account or create a new one to start your career journey.</p>
              </div>
              <div className="flex gap-3">
                <Link 
                  to="/login" 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${jobToDelete?.title}"? This action cannot be undone and will permanently remove the job posting and all associated applications.`}
        confirmText="Delete Job"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        cancelButtonClass="bg-gray-600 hover:bg-gray-700 text-white"
        type="danger"
      />
    </div>
  );
};

export default Jobs;