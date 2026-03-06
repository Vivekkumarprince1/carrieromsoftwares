import React, { useState, useCallback, memo } from 'react';
import { applicationService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const JobQuestionAnswer = memo(({ question, onChange, value, error }) => {
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focused, setFocused] = useState(false);

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
          <textarea
            className={`w-full px-6 py-4.5 bg-white/5 border ${focused ? 'border-lime-brand/50 bg-white/10 ring-4 ring-lime-brand/5' : 'border-white/10'} 
                      rounded-2xl text-white transition-all duration-300 shadow-inner font-medium resize-none text-sm
                      focus:outline-none ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
            rows="3"
            value={value?.answer || ''}
            onChange={handleTextChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={question.required}
            placeholder="Type your response here..."
          />
        );

      case 'multipleChoice':
        return (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${value?.answer === option
                    ? 'bg-lime-brand/10 border-lime-brand/50 shadow-glow-lime/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="radio"
                    className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                    name={`question_${question._id}`}
                    value={option}
                    checked={value?.answer === option}
                    onChange={handleRadioChange}
                    required={question.required && !value?.answer}
                  />
                  <div className={`w-6 h-6 border-2 rounded-full transition-all flex items-center justify-center ${value?.answer === option ? 'border-lime-brand' : 'border-white/20 group-hover:border-white/40'
                    }`}>
                    {value?.answer === option && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 bg-lime-brand rounded-full shadow-glow-lime"
                      />
                    )}
                  </div>
                </div>
                <span className={`ml-4 text-sm font-bold transition-colors ${value?.answer === option ? 'text-lime-brand' : 'text-gray-400 group-hover:text-white'}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              const checked = Array.isArray(value?.answer) && value.answer.includes(option);
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${checked
                      ? 'bg-lime-brand/10 border-lime-brand/50 shadow-glow-lime/10'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                      value={option}
                      checked={checked}
                      onChange={handleCheckboxChange}
                    />
                    <div className={`w-6 h-6 border-2 rounded-lg transition-all flex items-center justify-center ${checked ? 'border-lime-brand bg-lime-brand/20' : 'border-white/20 group-hover:border-white/40'
                      }`}>
                      {checked && (
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-4 h-4 text-lime-brand"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-4 text-sm font-bold transition-colors ${checked ? 'text-lime-brand' : 'text-gray-400 group-hover:text-white'}`}>
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
            <div className={`relative group cursor-pointer transition-all duration-500 border-2 border-dashed rounded-2xl p-6 hover:bg-lime-brand/5 ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-lime-brand/50 bg-white/5'
              }`}>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                required={question.required && !value?.fileUrl}
              />
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-xl transition-all ${value?.fileUrl ? 'bg-lime-brand text-black' : 'bg-white/10 text-gray-400 group-hover:text-lime-brand'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">
                    {value?.fileUrl ? value.answer : 'Attach Supporting Document'}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    {value?.fileUrl ? 'Click to replace' : 'PDF, DOC, DOCX (Max 10MB)'}
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
          <div className="mt-4">
            <div className="flex flex-wrap gap-3">
              {[...Array(maxRating)].map((_, index) => {
                const ratingValue = index + 1;
                const isActive = value?.answer >= ratingValue;
                return (
                  <motion.button
                    key={index}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all duration-300
                              ${isActive
                        ? 'bg-lime-brand text-black shadow-glow-lime/20'
                        : 'bg-white/5 text-gray-500 border border-white/5 hover:border-lime-brand/30 hover:text-lime-brand'}`}
                    onClick={() => handleRatingChange(ratingValue)}
                    aria-label={`Rate ${ratingValue} out of ${maxRating}`}
                  >
                    {ratingValue}
                  </motion.button>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
              {value?.answer ? `Currently selected: ${value.answer} / ${maxRating}` : 'Select your proficiency level'}
            </p>
          </div>
        );

      default:
        return <div className="text-gray-500 italic text-sm">Question type not supported in this interface</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-8 p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden relative group ${focused ? 'bg-white/10 border-lime-brand/30' : 'bg-white/5 border-white/5 hover:border-white/10'
        }`}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-brand/5 rounded-full blur-3xl pointer-events-none group-hover:bg-lime-brand/10 transition-all duration-700"></div>

      <label className="block mb-6 relative z-10">
        <span className="text-[10px] font-black text-lime-brand tracking-[0.2em] uppercase mb-2 block">
          Question Inquiry
        </span>
        <span className="text-lg md:text-xl font-bold text-white leading-tight">
          {question.questionText}
          {question.required && <span className="text-lime-brand ml-2 text-2xl leading-none">*</span>}
        </span>
      </label>

      <div className="relative z-10">
        {renderQuestionInput()}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-[10px] font-black mt-4 uppercase tracking-widest flex items-center bg-red-500/10 p-3 rounded-xl border border-red-500/20"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error: {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default JobQuestionAnswer;
