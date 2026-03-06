import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion, AnimatePresence } from 'framer-motion';
import { jobService, applicationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import JobQuestionAnswer from '../components/JobQuestionAnswer';

const Apply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [jobQuestions, setJobQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const recaptchaRef = useRef(null);

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
          setFormData(prev => ({ ...prev, email: currentUser.email }));
        }

        if (currentUser.name) {
          setFormData(prev => ({ ...prev, fullName: currentUser.name }));
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

        // Check if user has already applied for this job
        try {
          const statusResponse = await applicationService.checkApplicationStatus(actualJobId);
          if (statusResponse.data.hasApplied) {
            setExistingApplication(statusResponse.data);
          }
        } catch (err) {
          console.error("Error checking application status:", err);
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

    // Special handling for phone number
    if (name === 'phone') {
      // Allow only digits and limit to 10 characters
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: phoneValue }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

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

  const handleAnswerChange = (questionId, answer, file = null) => {
    setQuestionAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      const answerIndex = newAnswers.findIndex(a => a.questionId === questionId);

      if (answerIndex >= 0) {
        newAnswers[answerIndex] = { ...newAnswers[answerIndex], answer, fileUrl: file };
      } else {
        const question = jobQuestions.find(q => q._id === questionId);
        newAnswers.push({
          questionId,
          questionText: question?.questionText || '',
          questionType: question?.questionType || 'text',
          answer,
          fileUrl: file
        });
      }

      return newAnswers;
    });

    // Clear form error for this question if it exists
    const errorKey = `question_${questionId}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    if (formErrors.recaptcha) {
      setFormErrors(prev => ({ ...prev, recaptcha: null }));
    }
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaValue(null);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateStep = (step) => {
    const errors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.resume) {
        errors.resume = 'Resume is required';
        isValid = false;
      }
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
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Phone number must be exactly 10 digits';
        isValid = false;
      }
    }

    if (step === 2) {
      // Background info is optional in this logic, but we can add more if needed
    }

    if (step === 3) {
      if (!formData.coverLetter.trim()) {
        errors.coverLetter = 'Cover letter is required';
        isValid = false;
      }
      if (!recaptchaValue) {
        errors.recaptcha = 'Please complete the reCAPTCHA';
        isValid = false;
      }

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
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (currentStep !== totalSteps) {
      nextStep();
      return;
    }

    if (!validateStep(totalSteps)) {
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
      applicationFormData.append('recaptchaToken', recaptchaValue);

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

      // Show success message
      setSuccess('Application submitted successfully! You will receive updates via email.');

      // Clear form and reset state
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        experience: '',
        education: '',
        skills: '',
        coverLetter: '',
        resume: null
      });
      setQuestionAnswers([]);
      setRecaptchaValue(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }

      // Navigate to jobs page after showing success message
      setTimeout(() => {
        navigate('/jobs', { state: { success: true, message: 'Your application has been submitted successfully!' } });
      }, 3000);
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

      // Show blur overlay and scroll to error message
      setShowErrorOverlay(true);
      const errorElement = document.querySelector('.bg-red-100');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Auto-hide error message and blur overlay after 1 second
      setTimeout(() => {
        setError('');
        setShowErrorOverlay(false);
      }, 1000);
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
      {showErrorOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all duration-300"></div>
      )}

      <div className="min-h-screen bg-primary-black text-white relative overflow-hidden font-sans">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-lime-brand/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05],
              x: [0, 50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[10%] left-[-5%] w-[35%] h-[35%] bg-lime-brand/10 rounded-full blur-[100px]"
          />
        </div>

        <section className="pt-16 pb-12 relative z-10">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Header with Glassmorphism - Compact Version */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >

              <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-brand to-lime-brand-light">{job.title}</span>
              </h1>
              <div className="flex flex-wrap gap-3 items-center justify-center">
                <div className="flex items-center bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                  <svg className="w-3.5 h-3.5 mr-2 text-lime-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-200">{job.location}</span>
                </div>
                <div className="bg-lime-brand/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-lime-brand/30 shadow-lg text-lime-brand font-bold text-xs uppercase tracking-wider">
                  {job.salary}
                </div>
              </div>
            </motion.div>

            {/* Quick Opportunity Brief Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl overflow-hidden relative group"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-lime-brand/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <div className="flex-1">
                  <h4 className="text-[10px] uppercase tracking-[0.25em] text-lime-brand font-black mb-2 flex items-center justify-center md:justify-start">
                    <span className="w-1.5 h-1.5 bg-lime-brand rounded-full mr-2"></span>
                    Mission
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                    {job.description}
                  </p>
                </div>

                <div className="w-px h-12 bg-white/10 hidden md:block self-center"></div>

                <div className="flex-[1.5]">
                  <h4 className="text-[10px] uppercase tracking-[0.25em] text-lime-brand font-black mb-2 flex items-center justify-center md:justify-start">
                    <span className="w-1.5 h-1.5 bg-lime-brand rounded-full mr-2"></span>
                    Core Prerequisites
                  </h4>
                  <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
                    {Array.isArray(job.requirements) ? (
                      job.requirements.slice(0, 3).map((req, index) => (
                        <div key={index} className="flex items-center text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                          <svg className="w-3 h-3 text-lime-brand mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {req}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-300 text-xs font-medium">{job.requirements}</p>
                    )}
                    {Array.isArray(job.requirements) && job.requirements.length > 3 && (
                      <div className="text-[10px] text-lime-brand/60 italic font-black">+ {job.requirements.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stepper Progress UI */}
            <div className="mb-10 max-w-xl mx-auto">
              <div className="relative flex justify-between items-center">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 -z-10"></div>
                <motion.div
                  className="absolute top-1/2 left-0 h-0.5 bg-lime-brand -translate-y-1/2 -z-10 origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: (currentStep - 1) / (totalSteps - 1) }}
                  transition={{ duration: 0.5 }}
                />

                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: currentStep === step ? 1.1 : 0.9,
                        backgroundColor: currentStep >= step ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
                        borderColor: currentStep >= step ? "var(--color-primary)" : "rgba(255,255,255,0.1)",
                        color: currentStep >= step ? "#000" : "#fff"
                      }}
                      className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shadow-2xl backdrop-blur-md cursor-default transition-all duration-300"
                    >
                      {currentStep > step ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step}
                    </motion.div>
                    <span className={`text-[8px] uppercase tracking-[0.2em] mt-2 font-black ${currentStep === step ? 'text-lime-brand' : 'text-gray-500'}`}>
                      {step === 1 ? 'Identity' : step === 2 ? 'Experience' : 'Submission'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 flex items-center shadow-lg backdrop-blur-md"
                >
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-sm">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-lime-brand/10 border border-lime-brand/50 rounded-2xl text-lime-brand flex items-center shadow-lg backdrop-blur-md"
                >
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-sm">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Application Form Engine - Full Width */}
            <div className="w-full">
              <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
                {/* Glassmorphism Accents */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-brand/5 rounded-full blur-3xl pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-10"
                      >
                        <div>
                          <h2 className="text-3xl font-black mb-2 tracking-tight">Personal Identity</h2>
                          <p className="text-gray-400 font-medium">Let's start with who you are.</p>
                        </div>

                        {/* Quick Resume Upload Zone */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-lime-brand tracking-[0.2em] uppercase">
                            PROFESSIONAL RESUME
                          </label>
                          <div className={`relative group cursor-pointer transition-all duration-500 border-2 border-dashed rounded-3xl p-10 hover:bg-lime-brand/5 overflow-hidden ${formErrors.resume ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-lime-brand/50'
                            }`}>
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              id="resume"
                              name="resume"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx"
                              required
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className={`mb-6 p-6 rounded-2xl shadow-xl transition-all ${formData.resume ? 'bg-lime-brand text-black' : 'bg-white/10 text-gray-400 group-hover:text-lime-brand group-hover:bg-white/20'
                                  }`}
                              >
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </motion.div>
                              <p className="text-xl font-bold text-white mb-2 tracking-tight">
                                {formData.resume ? formData.resume.name : 'Upload Credentials'}
                              </p>
                              <p className="text-sm text-gray-500 font-medium">Standard PDF or Word formats (MAX 10MB)</p>
                            </div>
                          </div>

                          {/* Parsing Intelligence Feedback */}
                          {parsing && (
                            <div className="flex items-center space-x-4 text-lime-brand bg-lime-brand/10 p-4 rounded-2xl border border-lime-brand/20 animate-pulse">
                              <div className="w-3 h-3 bg-lime-brand rounded-full"></div>
                              <span className="text-sm font-black uppercase tracking-widest">AI Extraction Active...</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label htmlFor="fullName" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">FULL NAME</label>
                            <input
                              type="text"
                              className={`w-full px-6 py-4.5 bg-white/5 border ${formErrors.fullName ? 'border-red-500/50' : 'border-white/10'} rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium`}
                              id="fullName"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleChange}
                              placeholder="E.g. Elon Musk"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <label htmlFor="email" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">EMAIL ADDRESS</label>
                            <input
                              type="email"
                              className={`w-full px-6 py-4.5 bg-white/5 border ${formErrors.email ? 'border-red-500/50' : 'border-white/10'} rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium`}
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="name@domain.com"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label htmlFor="phone" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">CONTACT NUMBER</label>
                          <input
                            type="tel"
                            className={`w-full px-6 py-4.5 bg-white/5 border ${formErrors.phone ? 'border-red-500/50' : 'border-white/10'} rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium`}
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10-digit number"
                            maxLength={10}
                            required
                          />
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-10"
                      >
                        <div>
                          <h2 className="text-3xl font-black mb-2 tracking-tight">Your Trajectory</h2>
                          <p className="text-gray-400 font-medium">Education and experience define your path.</p>
                        </div>

                        <div className="space-y-3">
                          <label htmlFor="skills" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">TECHNICAL ARSENAL</label>
                          <textarea
                            className="w-full px-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium resize-none text-sm"
                            id="skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Python, React, System Design, AI..."
                          ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label htmlFor="experience" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">CAREER MILESTONES</label>
                            <textarea
                              className="w-full px-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium resize-none text-sm"
                              id="experience"
                              name="experience"
                              value={formData.experience}
                              onChange={handleChange}
                              rows="5"
                              placeholder="Summary of previous roles..."
                            ></textarea>
                          </div>

                          <div className="space-y-3">
                            <label htmlFor="education" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">ACADEMIC FOUNDATION</label>
                            <textarea
                              className="w-full px-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium resize-none text-sm"
                              id="education"
                              name="education"
                              value={formData.education}
                              onChange={handleChange}
                              rows="5"
                              placeholder="Degrees, certifications..."
                            ></textarea>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-10"
                      >
                        <div>
                          <h2 className="text-3xl font-black mb-2 tracking-tight">Final Details</h2>
                          <p className="text-gray-400 font-medium">Add extra flavor to your application.</p>
                        </div>

                        <div className="space-y-3">
                          <label htmlFor="coverLetter" className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">WHY US? (COVER LETTER)</label>
                          <textarea
                            className={`w-full px-6 py-4.5 bg-white/5 border ${formErrors.coverLetter ? 'border-red-500/50' : 'border-white/10'} rounded-2xl text-white focus:outline-none focus:border-lime-brand/50 focus:bg-white/10 focus:ring-4 focus:ring-lime-brand/5 shadow-inner transition-all font-medium resize-none text-sm`}
                            id="coverLetter"
                            name="coverLetter"
                            value={formData.coverLetter}
                            onChange={handleChange}
                            rows="6"
                            placeholder="Tell us about your passion for this role..."
                            required
                          ></textarea>
                        </div>

                        {/* Dynamic Questions Integration */}
                        {jobQuestions.length > 0 && (
                          <div className="space-y-8 pt-6 border-t border-white/5">
                            <h3 className="text-xl font-bold tracking-tight">Specific Inquiries</h3>
                            <div className="space-y-6">
                              {jobQuestions.map(question => (
                                <JobQuestionAnswer
                                  key={question._id}
                                  question={question}
                                  onChange={handleAnswerChange}
                                  value={questionAnswers.find(a => a.questionId === question._id)}
                                  error={formErrors[`question_${question._id}`]}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* reCAPTCHA Security Zone */}
                        <div className="pt-6 border-t border-white/5">
                          <div className="inline-block p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden max-w-full">
                            <ReCAPTCHA
                              ref={recaptchaRef}
                              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                              onChange={handleRecaptchaChange}
                              onExpired={handleRecaptchaExpired}
                              theme="dark"
                            />
                          </div>
                          {formErrors.recaptcha && <p className="text-red-500 text-[10px] font-black mt-3 uppercase tracking-widest">{formErrors.recaptcha}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step Navigation Controls */}
                  <div className="mt-auto pt-12 flex flex-col sm:flex-row gap-5">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center group"
                      >
                        <svg className="w-4 h-4 mr-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-[2] py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all duration-500 ${submitting
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-lime-brand text-black hover:bg-lime-brand-light hover:-translate-y-1 shadow-glow-lime/20'
                        }`}
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-3"></div>
                          Deploying... {uploadProgress}%
                        </div>
                      ) : currentStep === totalSteps ? (
                        <>
                          Submit Final Application
                          <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Continue to {currentStep === 1 ? 'Background' : 'Submission'}
                          <svg className="w-4 h-4 ml-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </section>
      </div>
    </>
  );
};

export default Apply;