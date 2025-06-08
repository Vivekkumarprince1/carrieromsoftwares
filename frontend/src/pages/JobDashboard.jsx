import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jobService } from '../services/api';
import JobQuestionManager from '../components/JobQuestionManager';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salary: '',
    type: 'Full-time',
    department: '',
    position: '',
    questions: [],
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState('');
  
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam === 'applications' && id ? 'applications' : 'details');
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (id) {
      loadJob();
      if (activeTab === 'applications') {
        loadJobApplications();
      }
    }
  }, [id, activeTab]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobById(id);
      const job = response.data;

      setFormData({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        description: job.description || '',
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '',
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || '',
        salary: job.salary || '',
        type: job.type || 'Full-time',
        department: job.department || '',
        position: job.position || '',
        questions: job.questions || []
      });
      
      if (job.imageUrl) {
        setImagePreview(`${import.meta.env.VITE_API_BASE_URL || ''}${job.imageUrl}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error loading job with ID: ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const loadJobApplications = async () => {
    if (!id) return;

    try {
      setLoadingApplications(true);
      const response = await jobService.getJobApplications(id);
      setApplications(response.data);
    } catch (err) {
      setApplicationError(err.response?.data?.message || `Error loading applications for job ID: ${id}`);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview('');
  };

  const handleQuestionsChanged = (updatedQuestions) => {
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setUploadProgress(0);

    // Check if we have an image to upload
    const hasImageUpload = formData.image && formData.image instanceof File;
    
    if (hasImageUpload) {
      setIsUploading(true);
    }

    try {
      const formattedData = {
        ...formData,
        requirements: typeof formData.requirements === 'string' ?
          formData.requirements.split('\n').filter(line => line.trim()) :
          formData.requirements,
        responsibilities: typeof formData.responsibilities === 'string' ?
          formData.responsibilities.split('\n').filter(line => line.trim()) :
          formData.responsibilities,
      };

      // Setup progress callback for image uploads
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      };

      if (id) {
        await jobService.updateJob(id, formattedData, hasImageUpload ? onUploadProgress : null);
        setSuccessMessage('Job updated successfully!');
      } else {
        const response = await jobService.createJob(formattedData, hasImageUpload ? onUploadProgress : null);
        setSuccessMessage('Job created successfully!');
        setTimeout(() => {
          navigate(`/jobs/edit/${response.data.job._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Job submission error:', err);
      
      // Handle timeout errors specifically
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload is taking longer than expected. Please wait a moment and check if the job was created successfully.');
      } else {
        setError(err.response?.data?.message || 'Error saving job');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewing': return 'bg-blue-500';
      case 'shortlisted': return 'bg-indigo-500';
      case 'rejected': return 'bg-red-500';
      case 'offered': return 'bg-green-500';
      case 'hired': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
          <p className="mt-6 text-lg text-gray-300">Loading job information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold text-white pt-6 mb-8">
      {/* {id ? 'Edit Job' : 'Create New Job'} */}
      </h1>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="mb-8 border-b border-gray-700">
        <div className="flex flex-wrap">
          <ul className="flex gap-1 mb-4">
            <li>
              <button
                className={`px-6 py-3 rounded-t-lg font-medium transition ${activeTab === 'details' 
                  ? 'bg-gray-900 text-white border-t border-l border-r border-gray-700' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setActiveTab('details')}
              >
                Job Details
              </button>
            </li>
            <li>
              <button
                className={`px-6 py-3 rounded-t-lg font-medium transition ${activeTab === 'questions' 
                  ? 'bg-gray-900 text-white border-t border-l border-r border-gray-700' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setActiveTab('questions')}
              >
                Application Questions
              </button>
            </li>
            {id && (
              <li>
                <button
                  className={`px-6 py-3 rounded-t-lg font-medium transition flex items-center ${activeTab === 'applications' 
                    ? 'bg-gray-900 text-white border-t border-l border-r border-gray-700' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  onClick={() => {
                    setActiveTab('applications');
                    loadJobApplications();
                  }}
                >
                  Applications 
                  <span className="ml-2 bg-primary text-black text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {applications.length}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {activeTab === 'details' && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Acme Inc."
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Remote, New York, NY"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Employment Type</label>
                <select
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-300 mb-1">Salary</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g., ₹50,000 - ₹70,000 per year"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Engineering, Marketing, Sales"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Manager, SDE, Team Lead"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Job Description</label>
              <textarea
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
                placeholder="Provide a detailed description of the job role"
              ></textarea>
              <p className="mt-1 text-sm text-gray-500">Provide a detailed description of the job role.</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-1">Job Image</label>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload an image to represent this job (max 20MB). Large images may take a moment to upload.
                  </p>
                </div>
                
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Job preview"
                      className="h-40 w-40 object-cover rounded-lg border border-gray-700"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-1">Requirements</label>
                <textarea
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Enter each requirement on a new line"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">Enter each requirement on a new line.</p>
              </div>

              <div>
                <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-300 mb-1">Responsibilities</label>
                <textarea
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Enter each responsibility on a new line"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">Enter each responsibility on a new line.</p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="submit"
                disabled={isUploading}
                className={`px-6 py-3 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center gap-2 ${
                  isUploading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-primary bg-slate-700 text-white hover:bg-primary/90'
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Uploading image...'}
                  </>
                ) : (
                  id ? 'Update Job' : 'Create Job'
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                className={`px-6 py-3 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isUploading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Cancel
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span>Uploading image to cloud storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Please wait while we upload your image. This may take a moment for larger files.
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          {!id ? (
            <div className="bg-blue-900/30 border border-blue-500 text-blue-400 px-6 py-4 rounded-md">
              <p className="mb-4">Please save the job details first before adding application questions.</p>
              <p className="mb-4">After creating the job, you'll be able to define custom questions for applicants.</p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setActiveTab('details')}
              >
                Go to Job Details
              </button>
            </div>
          ) : (
            <JobQuestionManager
              jobId={id}
              onQuestionsChanged={handleQuestionsChanged}
            />
          )}
        </div>
      )}

      {activeTab === 'applications' && id && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-white">Applications for this Job</h3>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="filterStatus" className="text-gray-300 text-sm font-medium">
                Filter by Status:
              </label>
              <select
                id="filterStatus"
                className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <button
                className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={loadJobApplications}
                title="Refresh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {applicationError && (
            <div className="mb-6 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">
              {applicationError}
            </div>
          )}

          {loadingApplications ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-300">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-blue-900/30 border border-blue-500 text-blue-400 px-6 py-8 rounded-md text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No applications have been submitted for this job yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Applicant Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {applications
                    .filter(app => filterStatus === 'all' || app.status.toLowerCase() === filterStatus)
                    .map(app => (
                      <tr key={app._id} className="hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {app.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {app.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)} text-white`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                            onClick={() => navigate(`/applications/${app._id}`)}
                          >
                            View Details
                          </button>
                          {app.resumeUrl && (
                            <button
                              className="px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded hover:bg-gray-600 transition"
                              onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${app.resumeUrl}`, '_blank')}
                            >
                              View Resume
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition flex items-center"
              onClick={() => navigate('/applications')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm5 0h5a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h5z" clipRule="evenodd" />
              </svg>
              View All Applications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobForm;
