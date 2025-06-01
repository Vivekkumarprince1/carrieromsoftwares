import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationService, jobService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [offerDetails, setOfferDetails] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobDetailsExpanded, setJobDetailsExpanded] = useState(true);

  // Helper function to check if a property exists and has content
  const hasContent = (prop) => {
    if (Array.isArray(prop)) {
      return prop.length > 0;
    }
    return prop && prop.trim && prop.trim() !== '';
  };

  const formatArrayData = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.join(', ');
    }
    return String(data);
  };

  useEffect(() => {
    loadApplicationDetail();
  }, [id]);

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      const appResponse = await applicationService.getApplicationById(id);
      console.log(appResponse.data);
      setApplication(appResponse.data);
      
      // Set job details from the jobId object in application data
      if (appResponse.data.jobId) {
        setJob(appResponse.data.jobId);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error loading application details for ID: ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToJobApplications = () => {
    if (job) {
      navigate(`/jobs/edit/${job._id}`);
    } else {
      navigate('/applications');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      setStatusUpdateLoading(true);
      await applicationService.updateApplicationStatus(id, { status: newStatus });
      // Reload application details to reflect the status change
      loadApplicationDetail();
      setSuccessMessage(`Application status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Error updating application status`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleGenerateOffer = async () => {
    if (!offerDetails.trim()) {
      setError('Please provide offer details');
      return;
    }
    
    setIsProcessing(true);
    try {
      await applicationService.generateOfferLetter(id, { offerDetails });
      
      // Update application status locally
      setApplication({...application, status: 'offered'});
      
      // Reset form and hide it
      setOfferDetails('');
      setShowOfferForm(false);
      
      setSuccessMessage('Offer letter generated and sent to applicant');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating offer letter');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      await applicationService.rejectApplication(id, { rejectionReason });
      
      // Update application status locally
      setApplication({...application, status: 'rejected'});
      
      // Reset form and hide it
      setRejectionReason('');
      setShowRejectForm(false);
      
      setSuccessMessage('Rejection email sent to applicant');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting application');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    try {
      // Define CSV fields
      const csvFields = [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'skills', label: 'Skills' },
        { key: 'experience', label: 'Experience' },
        { key: 'education', label: 'Education' },
        { key: 'coverLetter', label: 'Cover Letter' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Applied Date' },
      ];

      // Create CSV header
      let csvContent = csvFields.map(field => field.label).join(',') + '\n';
      
      // Format a single row for the current application
      const row = csvFields.map(field => {
        let value = application[field.key];
        
        // Format dates
        if (field.key === 'createdAt') {
          value = new Date(value).toLocaleDateString();
        }
        
        // Format arrays
        if (Array.isArray(value)) {
          value = value.join('; ');
        }
        
        // Escape commas and quotes
        if (value && typeof value === 'string') {
          value = value.replace(/"/g, '""');
          value = `"${value}"`;
        }
        
        return value || '';
      });
      
      csvContent += row.join(',') + '\n';
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const jobTitle = job ? job.title.replace(/\s+/g, '_') : 'application';
      const fileName = `${application.fullName.replace(/\s+/g, '_')}_${jobTitle}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('Application data exported to CSV');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error exporting application data');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewing': return 'bg-blue-500';
      case 'shortlisted': return 'bg-indigo-600';
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
          <p className="mt-6 text-lg text-gray-300">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-6 py-4 rounded-md mb-6">
          Application not found or you do not have permission to view it.
        </div>
        <button 
          className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-md flex items-center"
          onClick={() => navigate('/applications')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl animate-fade-in">
      <div className="flex justify-between items-center mb-8 pt-8">
        {/* <h1 className="text-3xl font-bold text-white">Application Details</h1> */}
        <button 
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition flex items-center"
          onClick={handleBackToJobApplications}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Applications
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-6 py-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-6 py-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Applicant Information Card */}
          <div className="bg-gray-900 border border-gray-800 pt-12 rounded-xl overflow-hidden shadow-lg">
            {/* <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Applicant Information</h2>
            </div> */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Full Name</p>
                  <p className="text-white text-lg">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white text-lg">{application.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white text-lg">{application.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Application Date</p>
                  <p className="text-white text-lg">{formatDate(application.createdAt)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full ${getStatusBadgeColor(application.status)} text-white text-sm font-medium`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              {application.resumeUrl && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Resume</p>
                  <a 
                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${application.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    View Resume
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Job Information Card */}
          {job && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div 
                className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-4 flex justify-between items-center cursor-pointer"
                onClick={() => setJobDetailsExpanded(!jobDetailsExpanded)}
              >
                <h2 className="text-xl font-semibold text-white">Job Information</h2>
                <button 
                  className="text-white hover:bg-purple-800/30 rounded-full p-1 transition-all"
                  aria-label={jobDetailsExpanded ? "Collapse job details" : "Expand job details"}
                >
                  {jobDetailsExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {jobDetailsExpanded && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">{job.title}</h3>
                    <p className="text-gray-300 whitespace-pre-line">{job.description}</p>
                  </div>
                  
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-white mb-2">Requirements</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 pl-2">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {job.questions && job.questions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-white mb-2">Job Questions</h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
                        {job.questions.map((question, index) => (
                          <li key={index}>{question.text || question.question}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Experience Card */}
          {hasContent(application.experience) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Experience</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-300 whitespace-pre-line">{formatArrayData(application.experience)}</p>
              </div>
            </div>
          )}

          {/* Skills Card */}
          {hasContent(application.skills) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Skills</h2>
              </div>
              <div className="p-6">
                {Array.isArray(application.skills) ? (
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map((skill, index) => (
                      <span key={index} className="inline-block px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-300 whitespace-pre-line">{application.skills}</p>
                )}
              </div>
            </div>
          )}

          {/* Education Card */}
          {hasContent(application.education) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Education</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-300 whitespace-pre-line">{formatArrayData(application.education)}</p>
              </div>
            </div>
          )}

          {/* Cover Letter Card */}
          {application.coverLetter && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Cover Letter</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-300 whitespace-pre-line">{application.coverLetter}</p>
              </div>
            </div>
          )}
          
          {/* Question Answers Card */}
          {application.questionAnswers && application.questionAnswers.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Application Questions</h2>
              </div>
              <div className="p-6">
                {application.questionAnswers.map((qa, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-medium text-white mb-2">{qa.questionText || qa.question}</h3>
                    <p className="text-gray-300 whitespace-pre-line mb-3">{qa.answer}</p>
                    
                    {qa.fileUrl && (
                      <a 
                        href={qa.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-md transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        View Attached File
                      </a>
                    )}
                    {index < application.questionAnswers.length - 1 && (
                      <div className="border-b border-gray-700 my-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Application Answers Card - Alternative format */}
          {application.answers && application.answers.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Application Questions</h2>
              </div>
              <div className="p-6">
                {application.answers.map((answer, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-medium text-white mb-2">{answer.question || answer.questionText}</h3>
                    <p className="text-gray-300 whitespace-pre-line mb-3">{answer.answer}</p>
                    
                    {answer.fileUrl && (
                      <a 
                        href={answer.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-md transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        View Attached File
                      </a>
                    )}
                    {index < application.answers.length - 1 && (
                      <div className="border-b border-gray-700 my-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Application Responses Card - Another possible format */}
          {application.responses && application.responses.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Application Questions</h2>
              </div>
              <div className="p-6">
                {application.responses.map((response, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-medium text-white mb-2">{response.question || response.questionText}</h3>
                    
                    {response.type === 'checkbox' && Array.isArray(response.answer) ? (
                      <div className="space-y-1">
                        {response.answer.map((item, i) => (
                          <div key={i} className="flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                            <span className="text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : response.type === 'file' && response.answer ? (
                      <a 
                        href={response.answer} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Uploaded File
                      </a>
                    ) : (
                      <p className="text-gray-300 whitespace-pre-line mb-3">
                        {response.answer || <span className="text-gray-500 italic">No response</span>}
                      </p>
                    )}
                    
                    {index < application.responses.length - 1 && (
                      <div className="border-b border-gray-700 my-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Admin Actions Sidebar */}
        <div className="md:col-span-1">
          {currentUser && currentUser.role === 'admin' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg sticky top-24">
              <div className="bg-gradient-to-r from-green-900 to-teal-900 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Actions</h2>
              </div>
              <div className="p-6">
                <h3 className="font-medium text-white mb-4">Update Application Status</h3>
                <div className="space-y-3">
                  <button 
                    className={`w-full py-2.5 px-4 text-left rounded-md transition flex items-center ${application.status === 'reviewing' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => handleStatusChange('reviewing')}
                    disabled={statusUpdateLoading || application.status === 'reviewing'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Mark as Reviewing
                  </button>
                  
                  <button 
                    className={`w-full py-2.5 px-4 text-left rounded-md transition flex items-center ${application.status === 'shortlisted' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => handleStatusChange('shortlisted')}
                    disabled={statusUpdateLoading || application.status === 'shortlisted'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Mark as Shortlisted
                  </button>
                  
                  <button 
                    className={`w-full py-2.5 px-4 text-left rounded-md transition flex items-center ${application.status === 'offered' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => handleStatusChange('offered')}
                    disabled={statusUpdateLoading || application.status === 'offered'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Mark as Offered
                  </button>
                  
                  <button 
                    className={`w-full py-2.5 px-4 text-left rounded-md transition flex items-center ${application.status === 'hired' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => handleStatusChange('hired')}
                    disabled={statusUpdateLoading || application.status === 'hired'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Mark as Hired
                  </button>
                  
                  <button 
                    className={`w-full py-2.5 px-4 text-left rounded-md transition flex items-center ${application.status === 'rejected' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => handleStatusChange('rejected')}
                    disabled={statusUpdateLoading || application.status === 'rejected'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Reject Application
                  </button>
                </div>
                
                {statusUpdateLoading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-300">Updating status...</span>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="font-medium text-white mb-4">Generate Offer Letter</h3>
                  <button 
                    className="w-full py-2.5 px-4 text-left rounded-md transition flex items-center bg-gray-800 text-gray-300 hover:bg-gray-700"
                    onClick={() => setShowOfferForm(!showOfferForm)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                    </svg>
                    {showOfferForm ? 'Cancel' : 'Generate Offer'}
                  </button>
                  {showOfferForm && (
                    <div className="mt-4">
                      <textarea 
                        className="w-full p-2.5 bg-gray-800 text-white rounded-md mb-3"
                        rows="4"
                        placeholder="Enter offer details..."
                        value={offerDetails}
                        onChange={(e) => setOfferDetails(e.target.value)}
                      />
                      <button 
                        className="w-full py-2.5 px-4 text-left rounded-md transition flex items-center bg-green-600 text-white hover:bg-green-500"
                        onClick={handleGenerateOffer}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                          </svg>
                        )}
                        Generate Offer
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-white mb-4">Reject Application</h3>
                  <button 
                    className="w-full py-2.5 px-4 text-left rounded-md transition flex items-center bg-gray-800 text-gray-300 hover:bg-gray-700"
                    onClick={() => setShowRejectForm(!showRejectForm)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                    </svg>
                    {showRejectForm ? 'Cancel' : 'Reject Application'}
                  </button>
                  {showRejectForm && (
                    <div className="mt-4">
                      <textarea 
                        className="w-full p-2.5 bg-gray-800 text-white rounded-md mb-3"
                        rows="4"
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <button 
                        className="w-full py-2.5 px-4 text-left rounded-md transition flex items-center bg-red-600 text-white hover:bg-red-500"
                        onClick={handleRejectApplication}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                          </svg>
                        )}
                        Reject Application
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-white mb-4">Export Application Data</h3>
                  <button 
                    className="w-full py-2.5 px-4 text-left rounded-md transition flex items-center bg-gray-800 text-gray-300 hover:bg-gray-700"
                    onClick={exportToCSV}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                    </svg>
                    Export to CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;