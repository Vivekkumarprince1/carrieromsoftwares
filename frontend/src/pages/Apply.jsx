import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion, AnimatePresence } from 'framer-motion';
import { jobService, applicationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, MapPin, Briefcase, ChevronRight, Check, Upload, AlertCircle, Sparkles } from 'lucide-react';
import JobQuestionAnswer from '../components/JobQuestionAnswer';

const LIQUID_VARIANTS = {
  enter: { opacity: 0, x: -20 },
  active: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

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
  const [focusedField, setFocusedField] = useState(null);
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

  const handleAnswerChange = useCallback((questionId, answer, file = null) => {
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
  }, [jobQuestions, formErrors]);

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
    return null;
  }

  if (!job) {
    return <div className="text-center p-5">Job not found.</div>;
  }

  return (
    <div className="min-h-screen bg-black selection:bg-lime-brand/30 selection:text-white grain-overlay relative overflow-x-hidden mesh-gradient-aura">
      {showErrorOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all duration-300"></div>
      )}

      {/* Dynamic Ambient Glows - Enhanced for Depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-lime-brand/15 rounded-full blur-[180px] opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-lime-brand/10 rounded-full blur-[150px] opacity-10 animate-float"></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] opacity-5"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-20">
        {/* Context Sidebar & Mobile Header */}
        <div className="lg:w-1/3 flex flex-col pt-0 lg:pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:sticky lg:top-32"
          >
            {/* Desktop Hero Header - Hidden on Mobile */}
            <div className="hidden lg:block mb-10 lg:mb-20">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-black text-lime-brand tracking-[0.5em] uppercase mb-6 lg:mb-8 block"
              >
                Protocol 07-A / Execution
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.0] mb-8 lg:mb-12 tracking-tighter"
              >
                Join the <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-lime-brand via-white to-lime-brand/50 bg-[length:200%_200%] animate-pulse">
                  Foundry
                </span>
              </motion.h1>

              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-center glass-surface p-5 rounded-3xl group hover:border-lime-brand/30 transition-all duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mr-5 group-hover:bg-lime-brand/20 transition-all duration-500 text-lime-brand shadow-inner">
                    <Briefcase className="w-5 h-5 text-lime-brand" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Position / Title</p>
                    <p className="text-base font-bold text-white tracking-tight">{job.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex items-center glass-surface p-5 rounded-3xl group hover:border-lime-brand/30 transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-lime-brand/20 transition-all duration-500 text-lime-brand">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="text-xs font-bold text-gray-200">{job.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center glass-surface p-5 rounded-3xl group hover:border-lime-brand/30 transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-lime-brand/20 transition-all duration-500 text-lime-brand">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Compensation</p>
                      <p className="text-xs font-bold text-gray-200">{job.salary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Integrated Stepper (Desktop) */}
            <div className="hidden lg:flex flex-col space-y-8 pl-4">
              {[1, 2, 3].map((step) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + step * 0.1 }}
                  className="group cursor-default"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className={`w-0.5 h-16 rounded-full transition-all duration-700 ${currentStep >= step ? 'bg-lime-brand shadow-[0_0_20px_rgba(163,198,20,0.8)]' : 'bg-white/5'}`} />
                      {currentStep === step && (
                        <motion.div
                          layoutId="stepper-orb"
                          className="absolute top-0 -left-1.5 w-3.5 h-3.5 bg-lime-brand rounded-full shadow-[0_0_15px_rgba(163,198,20,1)] z-10"
                        />
                      )}
                    </div>
                    <div className="flex flex-col pl-8">
                      <span className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${currentStep === step ? 'text-lime-brand' : 'text-white/20'}`}>
                        {step === 1 ? 'Base Index' : step === 2 ? 'Core Matrix' : 'Final Protocol'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 transition-all duration-500 ${currentStep === step ? 'text-white/40 opacity-100' : 'opacity-0'}`}>
                        {step === 1 ? 'System Identification' : step === 2 ? 'Competency Extraction' : 'Signal Transmission'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Minimal Mobile Header - Only Job Name & Location */}
            <div className="lg:hidden mt-12 mb-6 flex flex-col items-center text-center px-4">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-white tracking-tighter mb-4"
              >
                {job.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-full border border-white/5"
              >
                <MapPin className="w-4 h-4 text-lime-brand" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{job.location}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Application Engine Card */}
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="glass-panel rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 relative overflow-hidden"
          >
            {/* Visual Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-brand/5 rounded-full blur-[100px] pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col min-h-[500px]">
              <AnimatePresence>
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial="enter"
                    animate="active"
                    exit="exit"
                    variants={LIQUID_VARIANTS}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-4xl font-black mb-3 tracking-tight text-white/90">Personal Identity</h2>
                      <p className="text-gray-500 font-medium tracking-wide">Establish your core profile markers.</p>
                    </div>

                    {/* Quick Resume Upload Zone */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-lime-brand tracking-[0.2em] uppercase">
                        PROFESSIONAL RESUME
                      </label>
                      <div className={`relative group cursor-pointer transition-all duration-500 border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 hover:bg-lime-brand/5 overflow-hidden ${formErrors.resume ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-lime-brand/50'
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
                            className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl transition-all ${formData.resume ? 'bg-lime-brand text-black' : 'bg-white/10 text-gray-400 group-hover:text-lime-brand group-hover:bg-white/20'
                              }`}
                          >
                            <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
                          </motion.div>
                          <p className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                            {formData.resume ? formData.resume.name : 'Upload Credentials'}
                          </p>
                          <p className="text-[10px] sm:text-sm text-gray-500 font-medium uppercase tracking-widest">PDF, DOC, DOCX (MAX 10MB)</p>
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
                      <div className="space-y-4">
                        <label htmlFor="fullName" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                          <span className={`w-2 h-2 rounded-full ${focusedField === 'fullName' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                          Identity Label
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            className={`w-full px-8 py-5 bg-black/40 border transition-all duration-500 rounded-[1.5rem] text-white focus:outline-none font-bold placeholder:text-white/10
                                      ${focusedField === 'fullName' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Full Legal Name"
                            required
                          />
                          {focusedField === 'fullName' && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute -right-4 -top-4 bg-lime-brand text-black text-[9px] font-black px-3 py-1 rounded-full shadow-lg z-20">
                              ACTIVE SYNC
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="email" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                          <span className={`w-2 h-2 rounded-full ${focusedField === 'email' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                          Signal Link
                        </label>
                        <div className="relative group">
                          <input
                            type="email"
                            className={`w-full px-8 py-5 bg-black/40 border transition-all duration-500 rounded-[1.5rem] text-white focus:outline-none font-bold placeholder:text-white/10
                                      ${focusedField === 'email' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="communication@node.com"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label htmlFor="phone" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                        <span className={`w-2 h-2 rounded-full ${focusedField === 'phone' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                        Direct Frequency
                      </label>
                      <div className="relative group">
                        <input
                          type="tel"
                          className={`w-full px-8 py-5 bg-black/40 border transition-all duration-500 rounded-[1.5rem] text-white focus:outline-none font-bold placeholder:text-white/10
                                    ${focusedField === 'phone' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Primary contact digits"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial="enter"
                    animate="active"
                    exit="exit"
                    variants={LIQUID_VARIANTS}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-4xl font-black mb-3 tracking-tight text-white/90">Your Trajectory</h2>
                      <p className="text-gray-500 font-medium tracking-wide">The sum of your professional experience matrix.</p>
                    </div>

                    <div className="space-y-4">
                      <label htmlFor="skills" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                        <span className={`w-2 h-2 rounded-full ${focusedField === 'skills' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                        Technical Arsenal
                      </label>
                      <textarea
                        className={`w-full px-8 py-6 bg-black/40 border transition-all duration-500 rounded-[2rem] text-white focus:outline-none font-medium placeholder:text-white/10 resize-none
                                  ${focusedField === 'skills' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('skills')}
                        onBlur={() => setFocusedField(null)}
                        rows="3"
                        placeholder="Expertise parameters separated by commas..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="experience" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                          <span className={`w-2 h-2 rounded-full ${focusedField === 'experience' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                          Career Milestones
                        </label>
                        <textarea
                          className={`w-full px-8 py-6 bg-black/40 border transition-all duration-500 rounded-[2rem] text-sm text-white focus:outline-none font-medium placeholder:text-white/10 resize-none
                                    ${focusedField === 'experience' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('experience')}
                          onBlur={() => setFocusedField(null)}
                          rows="5"
                          placeholder="Brief summary of professional trajectory..."
                        ></textarea>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="education" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                          <span className={`w-2 h-2 rounded-full ${focusedField === 'education' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                          Academic Foundation
                        </label>
                        <textarea
                          className={`w-full px-8 py-6 bg-black/40 border transition-all duration-500 rounded-[2rem] text-sm text-white focus:outline-none font-medium placeholder:text-white/10 resize-none
                                    ${focusedField === 'education' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                          id="education"
                          name="education"
                          value={formData.education}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('education')}
                          onBlur={() => setFocusedField(null)}
                          rows="5"
                          placeholder="Degrees, certifications, and institutions..."
                        ></textarea>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial="enter"
                    animate="active"
                    exit="exit"
                    variants={LIQUID_VARIANTS}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-4xl font-black mb-3 tracking-tight text-white/90">Final Protocol</h2>
                      <p className="text-gray-500 font-medium tracking-wide">Finalize the synchronization of your application signal.</p>
                    </div>

                    <div className="space-y-4">
                      <label htmlFor="coverLetter" className="flex items-center gap-2 text-[11px] font-black text-lime-brand/70 tracking-[0.3em] uppercase px-1 mb-1">
                        <span className={`w-2 h-2 rounded-full ${focusedField === 'coverLetter' ? 'bg-lime-brand animate-ping' : 'bg-white/10'}`}></span>
                        Signal Resonance (Cover Letter)
                      </label>
                      <textarea
                        className={`w-full px-8 py-6 bg-black/40 border transition-all duration-500 rounded-[2rem] text-sm text-white focus:outline-none font-medium placeholder:text-white/10 resize-none
                                  ${focusedField === 'coverLetter' ? 'border-lime-brand bg-white/[0.05] shadow-[0_20px_40px_-15px_rgba(163,198,20,0.2)] ring-8 ring-lime-brand/10' : 'border-white/5 hover:border-white/10'}`}
                        id="coverLetter"
                        name="coverLetter"
                        value={formData.coverLetter}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('coverLetter')}
                        onBlur={() => setFocusedField(null)}
                        rows="6"
                        placeholder="Articulate your alignment with the Foundry mission..."
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

              {/* Step Navigation Controls - Premium Magnetic Style */}
              <div className="mt-12 sm:mt-auto pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-5">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-magnetic w-full sm:flex-1 py-5 px-8 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] border border-white/5 bg-white/0 text-gray-500 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-500 flex items-center justify-center group shadow-2xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-3 transform group-hover:-translate-x-2 transition-transform duration-500" />
                    Previous Phase
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn-magnetic w-full ${currentStep === 1 ? 'sm:w-full' : 'sm:flex-[2.5]'} py-5 px-8 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center transition-all duration-700 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${submitting
                    ? 'bg-gray-900/50 text-gray-700 cursor-not-allowed border border-white/5 backdrop-blur-md'
                    : 'bg-lime-brand text-black hover:bg-white hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin mr-3"></div>
                      Broadcasting Signal... {uploadProgress}%
                    </div>
                  ) : currentStep === totalSteps ? (
                    <>
                      Execute Final Transmission
                      <Sparkles className="w-4 h-4 ml-4 group-hover:translate-x-2 group-hover:rotate-12 transition-all duration-500" />
                    </>
                  ) : (
                    <>
                      Initiate Next Protocol
                      <ChevronRight className="w-4 h-4 ml-4 transform group-hover:translate-x-2 transition-all duration-500" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Apply;