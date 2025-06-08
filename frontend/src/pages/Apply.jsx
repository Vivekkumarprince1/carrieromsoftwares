import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService, applicationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import JobQuestionAnswer from '../components/JobQuestionAnswer';
import { getImageUrl, getFirstLetterFallback } from '../utils/imageUtils';

const Apply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [jobQuestions, setJobQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    education: '',
    skills: '',
    coverLetter: '',
    resume: null
  });
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/apply/${jobId}` } });
      return;
    }

    const fetchJobData = async () => {
      try {
        const actualJobId = (jobId && typeof jobId === 'object' && jobId._id) ? jobId._id : jobId;
        
        const jobResponse = await jobService.getJobById(actualJobId);
        setJob(jobResponse.data);
        
        if (currentUser.email) {
          setFormData(prev => ({...prev, email: currentUser.email}));
        }
        
        if (currentUser.name) {
          setFormData(prev => ({...prev, fullName: currentUser.name}));
        }
        
        setLoadingQuestions(true);
        try {
          const questionsResponse = await jobService.getJobQuestions(actualJobId);
          const questions = questionsResponse.data;
          
          const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
          setJobQuestions(sortedQuestions);
          
          const initialAnswers = sortedQuestions.map(question => ({
            questionId: question._id,
            questionText: question.questionText,
            questionType: question.questionType,
            answer: question.questionType === 'checkbox' ? [] : ''
          }));
          setQuestionAnswers(initialAnswers);
        } catch (err) {
          console.error("Error loading job questions:", err);
        } finally {
          setLoadingQuestions(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setParseError('');
    setParseSuccess(false);

    setFormData(prev => ({ ...prev, resume: file }));
    setResumeUploaded(true);
    
    if (formErrors.resume) {
      setFormErrors(prev => ({ ...prev, resume: null }));
    }

    try {
      setParsing(true);
      const formDataForUpload = new FormData();
      formDataForUpload.append('resume', file);
      
      const response = await applicationService.parseResume(formDataForUpload);
      
      if (response.error) {
        setParseError(response.error);
        setParsing(false);
        return;
      }
      
      // Track what was successfully extracted
      const extractedFields = [];
      const updatedFormData = { ...formData, resume: file };
      
      // Only update fields that have meaningful content and don't overwrite existing user input
      if (response.data.fullName && response.data.fullName.trim() && !formData.fullName.trim()) {
        updatedFormData.fullName = response.data.fullName;
        extractedFields.push('name');
      }
      
      if (response.data.email && response.data.email.trim() && !formData.email.trim()) {
        updatedFormData.email = response.data.email;
        extractedFields.push('email');
      }
      
      if (response.data.phone && response.data.phone.trim() && !formData.phone.trim()) {
        updatedFormData.phone = response.data.phone;
        extractedFields.push('phone');
      }
      
      if (response.data.skills && response.data.skills.trim() && !formData.skills.trim()) {
        // Format skills as comma-separated if it's an array
        const skillsText = Array.isArray(response.data.skills) 
          ? response.data.skills.join(', ') 
          : response.data.skills;
        updatedFormData.skills = skillsText;
        extractedFields.push('skills');
      }
      
      if (response.data.education && response.data.education.trim() && !formData.education.trim()) {
        updatedFormData.education = response.data.education;
        extractedFields.push('education');
      }
      
      if (response.data.experience && response.data.experience.trim() && !formData.experience.trim()) {
        updatedFormData.experience = response.data.experience;
        extractedFields.push('experience');
      }
      
      setFormData(updatedFormData);
      
      // Show success message with details
      if (extractedFields.length > 0) {
        setParseSuccess(`✓ Successfully extracted: ${extractedFields.join(', ')}`);
        setTimeout(() => setParseSuccess(false), 5000);
      } else {
        setParseError('Resume uploaded but no additional data could be extracted. Please fill the form manually.');
      }
      
    } catch (err) {
      console.error('Failed to parse resume:', err);
      
      // Handle different types of parsing errors
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setParseError('Resume parsing is taking longer than expected. The file has been uploaded, but automatic data extraction timed out. Please fill the form manually.');
      } else if (err.response?.status === 413) {
        setParseError('Resume file is too large for automatic parsing. Please fill the form manually or try with a smaller file.');
      } else {
        setParseError('Could not automatically extract data from your resume. You can still fill the form manually.');
      }
    } finally {
      setParsing(false);
    }
  };

  const handleQuestionAnswerChange = (answer) => {
    setQuestionAnswers(prev => {
      const index = prev.findIndex(a => a.questionId === answer.questionId);
      if (index !== -1) {
        const updatedAnswers = [...prev];
        updatedAnswers[index] = answer;
        return updatedAnswers;
      } else {
        return [...prev, answer];
      }
    });
    
    if (formErrors[`question_${answer.questionId}`]) {
      setFormErrors(prev => ({ ...prev, [`question_${answer.questionId}`]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    }
    
    if (!formData.resume) {
      errors.resume = 'Resume is required';
      isValid = false;
    }
    
    if (!formData.coverLetter.trim()) {
      errors.coverLetter = 'Cover letter is required';
      isValid = false;
    }

    // Validate job question answers
    jobQuestions.forEach(question => {
      if (question.required) {
        const answer = questionAnswers.find(a => a.questionId === question._id);
        
        if (!answer || 
            (typeof answer.answer === 'string' && !answer.answer.trim()) ||
            (Array.isArray(answer.answer) && answer.answer.length === 0) ||
            (answer.questionType === 'file' && !answer.fileUrl)) {
          errors[`question_${question._id}`] = 'This field is required';
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const applicationFormData = new FormData();
      applicationFormData.append('jobId', jobId);
      applicationFormData.append('fullName', formData.fullName);
      applicationFormData.append('email', formData.email);
      applicationFormData.append('phone', formData.phone);
      applicationFormData.append('experience', formData.experience);
      applicationFormData.append('education', formData.education);
      applicationFormData.append('skills', formData.skills);
      applicationFormData.append('coverLetter', formData.coverLetter);
      
      // Add referral data if provided
      if (formData.isReferred) {
        applicationFormData.append('isReferred', 'true');
        applicationFormData.append('referrerEmployeeId', formData.referrerEmployeeId);
        applicationFormData.append('referrerName', formData.referrerName);
        applicationFormData.append('referrerEmail', formData.referrerEmail);
        applicationFormData.append('referralMessage', formData.referralMessage);
      }
      
      if (formData.resume) {
        applicationFormData.append('resume', formData.resume);
      }
      
      if (questionAnswers.length > 0) {
        applicationFormData.append('questionAnswers', JSON.stringify(questionAnswers));
      }
      
      // Setup progress callback
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      };
      
      await applicationService.createApplication(applicationFormData, onUploadProgress);
      navigate('/jobs', { state: { success: true, message: 'Your application has been submitted successfully!' } });
    } catch (err) {
      console.error('Application submission error:', err);
      
      // Handle different types of errors with specific messages
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload is taking longer than expected. This might be due to file size or network conditions. Please wait a moment and check if your application was submitted successfully, or try again with a smaller file.');
      } else if (err.response?.status === 413) {
        setError('Your resume file is too large. Please try with a smaller file (under 10MB).');
      } else if (err.response?.status === 500 && err.response?.data?.message?.includes('Cloudinary')) {
        setError('There was an issue uploading your resume. Please try again, or contact support if the problem persists.');
      } else {
        setError(err.response?.data?.message || 'Error submitting application. Please try again.');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return <div className="text-center p-5">Loading job details...</div>;
  }

  if (!job) {
    return <div className="text-center p-5">Job not found.</div>;
  }

  return (
    <>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded container mx-auto mt-3">{error}</div>}

      <section className="pt-20 pb-24">
        <div className="container mx-auto px-4 relative">
          {/* <div className="border-b border-gray-700 mb-10 pb-4 relative">
            <h3 className="text-3xl font-medium text-white uppercase">
              <span>JOB <br/>
              <span className="text-gray-500">APPLICATION</span></span>
            </h3>
            <span className="absolute right-0 top-0 text-gray-600">Apply Now</span>
          </div> */}
          
          {/* <div className="mb-10">
            {job.imageUrl ? (
              <img 
                src={getImageUrl(job.imageUrl)}
                alt={job.title}
                className="w-full h-60 object-cover rounded-lg"
                onError={(e) => {
                  const letterDiv = document.createElement('div');
                  letterDiv.className = "h-60 w-full flex items-center justify-center bg-gray-700 text-white text-6xl font-bold rounded-lg";
                  letterDiv.innerText = getFirstLetterFallback(job.title);
                  e.target.parentNode.replaceChild(letterDiv, e.target);
                }}
              />
            ) : (
              <div className="h-60 w-full flex items-center justify-center bg-gray-700 text-white text-6xl font-bold rounded-lg">
                {getFirstLetterFallback(job.title)}
              </div>
            )}
          </div> */}
          
          <div className="p-6 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-6">
              <h3 className="text-2xl font-medium text-white mb-4 md:mb-0">{job.title}</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <span className="text-green-400 text-xl font-medium">{job.salary}</span>
                <div>
                  <h4 className="uppercase text-gray-400 text-sm font-medium">LOCATION</h4>
                  <p className="text-white">{job.location}</p>
                </div>
                {job.department && (
                  <div>
                    <h4 className="uppercase text-gray-400 text-sm font-medium">DEPARTMENT</h4>
                    <p className="text-white">{job.department}</p>
                  </div>
                )}
                {job.position && (
                  <div>
                    <h4 className="uppercase text-gray-400 text-sm font-medium">POSITION</h4>
                    <p className="text-white">{job.position}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-gray-800 pb-6">
              <h3 className="text-xl font-medium text-white w-full md:w-1/3 mb-4 md:mb-0">Job Description</h3>
              <div className="w-full md:w-2/3">
                <p className="text-gray-300">{job.description}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-gray-800 pb-6">
              <h3 className="text-xl font-medium text-white w-full md:w-1/3 mb-4 md:mb-0">Requirements</h3>
              <div className="w-full md:w-2/3">
                {Array.isArray(job.requirements) ? (
                  <ul className="list-disc pl-6 text-gray-300">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300">{job.requirements}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between">
              <h3 className="text-xl font-medium text-white w-full md:w-1/3 mb-4 md:mb-0">Your Application</h3>
              <div className="w-full md:w-2/3 mt-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="resume" className="block font-bold text-white mb-2">
                      Resume/CV (PDF, DOC, DOCX)
                      <span className="ml-2 font-normal text-gray-400">We'll try to auto-fill the form from your resume</span>
                    </label>
                    <input
                      type="file"
                      className={`w-full px-4 py-2 bg-black border-b ${formErrors.resume ? 'border-red-500' : 'border-gray-600'} rounded text-white`}
                      id="resume"
                      name="resume"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      required
                    />
                    {formErrors.resume && <div className="text-red-500 text-sm mt-1">{formErrors.resume}</div>}
                    {parsing && (
                      <div className="flex items-center text-blue-400 mt-2">
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting data from your resume...
                      </div>
                    )}
                    {parseSuccess && (
                      <div className="text-green-500 mt-2">
                        {typeof parseSuccess === 'string' ? parseSuccess : '✓ Resume parsed successfully! Form fields have been auto-filled.'}
                      </div>
                    )}
                    {parseError && <div className="text-yellow-500 mt-2">⚠️ {parseError}</div>}
                    {resumeUploaded && !parsing && !parseError && !parseSuccess && 
                      <div className="text-green-500 mt-2">Resume uploaded successfully.</div>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block font-bold text-white mb-2">Full Name</label>
                      <input
                        type="text"
                        className={`w-full px-4 py-2 bg-black border-b ${formErrors.fullName ? 'border-red-500' : 'border-gray-600'} rounded text-white`}
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.fullName && <div className="text-red-500 text-sm mt-1">{formErrors.fullName}</div>}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block font-bold text-white mb-2">Email</label>
                      <input
                        type="email"
                        className={`w-full px-4 py-2 bg-black border-b ${formErrors.email ? 'border-red-500' : 'border-gray-600'} rounded text-white`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.email && <div className="text-red-500 text-sm mt-1">{formErrors.email}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block font-bold text-white mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-2 bg-black border-b ${formErrors.phone ? 'border-red-500' : 'border-gray-600'} rounded text-white`}
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.phone && <div className="text-red-500 text-sm mt-1">{formErrors.phone}</div>}
                  </div>
                  
                  <div>
                    <label htmlFor="skills" className="block font-bold text-white mb-2">Skills</label>
                    <textarea
                      className="w-full px-4 py-2 bg-black border-b border-gray-600 rounded text-white"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Enter skills separated by commas (e.g. JavaScript, React, Node.js)"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="experience" className="block font-bold text-white mb-2">Work Experience</label>
                    <textarea
                      className="w-full px-4 py-2 bg-black border-b border-gray-600 rounded text-white"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Describe your relevant work experience"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="education" className="block font-bold text-white mb-2">Education</label>
                    <textarea
                      className="w-full px-4 py-2 bg-black border-b border-gray-600 rounded text-white"
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      rows="3"
                      placeholder="List your educational qualifications"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="coverLetter" className="block font-bold text-white mb-2">Cover Letter</label>
                    <textarea
                      className={`w-full px-4 py-2 bg-black border-b ${formErrors.coverLetter ? 'border-red-500' : 'border-gray-600'} rounded text-white`}
                      id="coverLetter"
                      name="coverLetter"
                      value={formData.coverLetter}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Write a brief cover letter explaining why you're suitable for this position"
                      required
                    ></textarea>
                    {formErrors.coverLetter && <div className="text-red-500 text-sm mt-1">{formErrors.coverLetter}</div>}
                  </div>
                  
                  {loadingQuestions ? (
                    <div className="text-center py-6">
                      <svg className="animate-spin h-10 w-10 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-2 text-gray-400">Loading application questions...</p>
                    </div>
                  ) : jobQuestions.length > 0 ? (
                    <div>
                      <h4 className="font-bold text-white mb-4 text-lg">Additional Questions</h4>
                      {jobQuestions.map(question => (
                        <JobQuestionAnswer
                          key={question._id}
                          question={question}
                          onChange={handleQuestionAnswerChange}
                          value={questionAnswers.find(a => a.questionId === question._id)}
                          error={formErrors[`question_${question._id}`]}
                        />
                      ))}
                    </div>
                  ) : null}
                  
                  <div className="flex flex-col md:flex-row gap-4 mt-10">
                    <button 
                      type="submit" 
                      className="flex-1 inline-flex items-center bg-gray-700 justify-center px-8 py-4 font-semibold rounded-lg shadow-lg hover:bg-primary-dark hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="flex-1 md:flex-none md:w-auto inline-flex items-center justify-center px-8 py-4 bg-gray-700 text-white font-medium rounded-lg border border-gray-600 hover:bg-red-600 hover:text-gray-100 transition-all duration-300"
                      onClick={() => navigate('/jobs')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-20">
            <div className="mb-8 md:mb-0 md:max-w-lg">
              <h3 className="text-2xl font-medium text-white mb-4">Apply With Confidence!</h3>
              <p className="text-gray-300">We're looking for talented individuals to join our team. If you're passionate about what you do and want to grow with us, we encourage you to apply. Your application will be carefully reviewed by our hiring team.</p>
            </div>
            <div>
              <Link to="/jobs" className="inline-flex items-center px-6 py-3 bg-gray-800 text-white font-medium rounded hover:bg-gray-700 transition-colors">
                Browse More Jobs <span className="ml-2 inline-block w-6 h-6 bg-gray-600 rounded-full"></span>
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 -z-10 w-80 h-80 bg-primary rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>
    </>
  );
};

export default Apply;