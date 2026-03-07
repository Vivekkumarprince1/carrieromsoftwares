import React, { useState, useCallback, memo } from 'react';
import { applicationService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Target, CheckCircle, FileText, Layers, Star } from 'lucide-react';

const JobQuestionAnswer = memo(({ question, onChange, value, error }) => {
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focused, setFocused] = useState(false);

  const getQuestionIcon = () => {
    const iconClass = "w-5 h-5";
    switch (question.questionType) {
      case 'text': return <MessageSquare className={iconClass} />;
      case 'multipleChoice': return <Target className={iconClass} />;
      case 'checkbox': return <Layers className={iconClass} />;
      case 'file': return <FileText className={iconClass} />;
      case 'rating': return <Star className={iconClass} />;
      default: return <CheckCircle className={iconClass} />;
    }
  };

  const handleTextChange = useCallback((e) => {
    onChange(question._id, e.target.value);
  }, [onChange, question._id]);

  const handleCheckboxChange = useCallback((e) => {
    if (e.target.name === 'singleCheckbox') {
      onChange(question._id, e.target.checked);
      return;
    }

    let selectedOptions = Array.isArray(value?.answer) ? [...value.answer] : [];
    const option = e.target.value;

    if (e.target.checked) {
      if (!selectedOptions.includes(option)) {
        selectedOptions.push(option);
      }
    } else {
      selectedOptions = selectedOptions.filter(item => item !== option);
    }

    onChange(question._id, selectedOptions);
  }, [onChange, question._id, value?.answer]);

  const handleRadioChange = useCallback((e) => {
    onChange(question._id, e.target.value);
  }, [onChange, question._id]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploading(true);
    setUploadProgress(0);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          return newProgress;
        });
      }, 300);

      const response = await applicationService.uploadQuestionFile(file);
      clearInterval(interval);
      setUploadProgress(100);

      onChange(question._id, file.name, response.data.fileUrl);

      setTimeout(() => {
        setFileUploading(false);
      }, 1000);
    } catch (err) {
      console.error("File upload error:", err);
      setFileUploading(false);
    }
  };

  const handleRatingChange = (rating) => {
    onChange(question._id, rating);
  };

  const renderQuestionInput = () => {
    switch (question.questionType) {
      case 'text':
        return (
          <div className="relative group">
            <textarea
              className={`w-full px-6 py-5 sm:px-8 sm:py-7 bg-black/40 border-2 ${focused ? 'border-lime-brand/50 bg-lime-brand/[0.02] shadow-[0_0_50px_rgba(163,198,20,0.15)]' : 'border-white/5'} 
                        rounded-[2rem] sm:rounded-[2.5rem] text-sm sm:text-base text-white transition-all duration-700 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] font-medium resize-none
                        focus:outline-none placeholder:text-white/10 ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
              rows="5"
              value={value?.answer || ''}
              onChange={handleTextChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required={question.required}
              placeholder="Deep dive into your response..."
            />
            <div className={`absolute bottom-6 right-8 text-[10px] font-black uppercase tracking-widest transition-opacity duration-500 ${focused ? 'opacity-40 text-lime-brand' : 'opacity-0'}`}>
              Syncing Input...
            </div>
          </div>
        );

      case 'multipleChoice':
        return (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border cursor-pointer transition-all duration-700 group relative overflow-hidden glass-surface-interactive ${value?.answer === option
                  ? 'bg-lime-brand/10 border-lime-brand/50 shadow-[0_20px_50px_rgba(163,198,20,0.2)] scale-[1.03]'
                  : 'border-white/[0.05] hover:border-white/20'
                  }`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-brand/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative flex-shrink-0 z-20">
                  <input
                    type="radio"
                    className="peer absolute opacity-0 w-8 h-8 cursor-pointer"
                    name={`question_${question._id}`}
                    value={option}
                    checked={value?.answer === option}
                    onChange={handleRadioChange}
                    required={question.required && !value?.answer}
                  />
                  <div className={`w-8 h-8 border-2 rounded-full transition-all duration-500 flex items-center justify-center ${value?.answer === option ? 'border-lime-brand bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/10 group-hover:border-white/30'
                    }`}>
                    {value?.answer === option && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3.5 h-3.5 bg-black rounded-full"
                      />
                    )}
                  </div>
                </div>
                <span className={`ml-4 sm:ml-6 text-sm sm:text-lg font-black tracking-tight transition-colors relative z-20 ${value?.answer === option ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {question.options.map((option, index) => {
              const checked = Array.isArray(value?.answer) && value.answer.includes(option);
              return (
                <label
                  key={index}
                  className={`flex items-center p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] border cursor-pointer transition-all duration-700 group relative overflow-hidden glass-surface-interactive ${checked
                    ? 'bg-lime-brand/10 border-lime-brand/40 shadow-[0_15px_40px_rgba(163,198,20,0.15)] scale-[1.02]'
                    : 'border-white/[0.05] hover:border-white/20'
                    }`}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-lime-brand/5 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex-shrink-0 z-20">
                    <input
                      type="checkbox"
                      className="peer absolute opacity-0 w-8 h-8 cursor-pointer"
                      value={option}
                      checked={checked}
                      onChange={handleCheckboxChange}
                    />
                    <div className={`w-8 h-8 border-2 rounded-2xl transition-all duration-500 flex items-center justify-center ${checked ? 'border-lime-brand bg-white' : 'border-white/10 group-hover:border-white/30'
                      }`}>
                      {checked && (
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-5 h-5 text-black"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-4 sm:ml-6 text-sm sm:text-base font-black tracking-tight transition-colors relative z-20 ${checked ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case 'file':
        return (
          <div>
            <div className={`relative group cursor-pointer transition-all duration-700 border-2 border-dashed rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 hover:bg-lime-brand/5 ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 hover:border-lime-brand/30 bg-black/40 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]'
              }`}>
              <div className="absolute inset-0 bg-lime-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                required={question.required && !value?.fileUrl}
              />
              <div className="flex flex-col items-center justify-center text-center relative z-20">
                <div className={`mb-6 p-7 rounded-3xl transition-all duration-500 shadow-2xl ${value?.fileUrl ? 'bg-lime-brand text-black scale-110' : 'bg-white/5 text-gray-500 group-hover:bg-lime-brand group-hover:text-black group-hover:rotate-12'}`}>
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-black text-white mb-2 tracking-tight uppercase">
                    {value?.fileUrl ? value.answer : 'Transmission Interface'}
                  </p>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black group-hover:text-lime-brand transition-colors">
                    {value?.fileUrl ? 'Signal Received / Re-upload to overwrite' : 'Supporting Evidence Protocol / Max 10MB'}
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {fileUploading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 space-y-2"
                >
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-lime-brand h-full shadow-glow-lime"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-lime-brand font-black uppercase tracking-widest text-right">
                    Transmitting... {uploadProgress}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'rating':
        const maxRating = question.maxRating || 5;
        return (
          <div className="mt-8">
            <div className="flex flex-wrap gap-5">
              {[...Array(maxRating)].map((_, index) => {
                const ratingValue = index + 1;
                const isActive = value?.answer >= ratingValue;
                const isSelected = value?.answer === ratingValue;
                return (
                  <motion.button
                    key={index}
                    type="button"
                    whileHover={{ scale: 1.15, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 sm:w-20 sm:h-20 flex flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] font-black transition-all duration-700 relative overflow-hidden group
                              ${isActive
                        ? 'bg-lime-brand text-black shadow-[0_20px_40px_rgba(163,198,20,0.3)]'
                        : 'bg-white/[0.02] text-white/20 border-2 border-white/[0.03] hover:border-lime-brand/30 hover:text-white/60 hover:bg-white/[0.05]'}`}
                    onClick={() => handleRatingChange(ratingValue)}
                    aria-label={`Rate ${ratingValue} out of ${maxRating}`}
                  >
                    <span className={`text-lg sm:text-2xl relative z-10 ${isActive ? 'opacity-100' : 'opacity-40'}`}>{ratingValue}</span>
                    {isSelected && (
                      <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-white/20 blur-xl rounded-full"
                      />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute bottom-2"
                      >
                        <div className="w-1.5 h-1.5 bg-black rounded-full opacity-40" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-10 flex items-center p-5 glass-surface rounded-[2rem] inline-flex border border-white/5">
              <Sparkles className="w-4 h-4 text-lime-brand mr-4 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                {value?.answer ? `Intelligence Index established at: ${value.answer} / ${maxRating}` : 'Awaiting manual proficiency calibration'}
              </p>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500 italic text-sm">Question type not supported in this interface</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-6 sm:mb-10 lg:mb-16 p-6 sm:p-10 lg:p-14 rounded-[2rem] sm:rounded-[4rem] border transition-all duration-700 overflow-hidden relative group ${focused ? 'bg-white/[0.05] border-lime-brand/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/20'
        }`}
    >
      {/* Premium Decorative Depth Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-lime-brand/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-lime-brand/15 transition-all duration-[2000ms]"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-start mb-8 sm:mb-12">
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl mr-4 sm:mr-8 transition-all duration-700 ${focused ? 'bg-lime-brand text-black shadow-[0_0_40px_rgba(163,198,20,0.5)] rotate-6 scale-110' : 'bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white/40'}`}>
            {getQuestionIcon()}
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-black tracking-[0.4em] text-lime-brand uppercase mb-4 block opacity-60">
              Diagnostic Metric
            </span>
            <label className="block">
              <span className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter block max-w-2xl">
                {question.questionText}
                {question.required && <span className="text-lime-brand ml-2 animate-pulse">*</span>}
              </span>
            </label>
          </div>
        </div>

        <div className="pl-0 lg:pl-20">
          {renderQuestionInput()}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 md:ml-20"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            Validation Failed: {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default JobQuestionAnswer;
