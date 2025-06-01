import React, { useState } from 'react';
import { applicationService } from '../services/api';

const JobQuestionAnswer = ({ question, onChange, value, error }) => {
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focused, setFocused] = useState(false);

  const handleTextChange = (e) => {
    onChange({
      questionId: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      answer: e.target.value
    });
  };

  const handleCheckboxChange = (e) => {
    if (e.target.name === 'singleCheckbox') {
      onChange({
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        answer: e.target.checked
      });
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

    onChange({
      questionId: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      answer: selectedOptions
    });
  };

  const handleRadioChange = (e) => {
    onChange({
      questionId: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      answer: e.target.value
    });
  };

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

      onChange({
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        answer: file.name,
        fileUrl: response.data.fileUrl
      });

      setTimeout(() => {
        setFileUploading(false);
      }, 1000);
    } catch (err) {
      console.error("File upload error:", err);
      setFileUploading(false);
      
      onChange({
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        error: err.response?.data?.message || 'Error uploading file'
      });
    }
  };

  const handleRatingChange = (rating) => {
    onChange({
      questionId: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      answer: rating
    });
  };

  const renderQuestionInput = () => {
    switch (question.questionType) {
      case 'text':
        return (
          <textarea
            className={`w-full px-4 py-3 rounded-lg border-b ${focused ? 'border-blue-brand shadow-glow-lime' : 'border-gray-300 dark:border-gray-600'} 
                      bg-black dark:text-white transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-brand-light focus:border-transparent
                      ${error ? 'border-red-500 dark:border-red-500' : ''}`}
            rows="2"
            value={value?.answer || ''}
            onChange={handleTextChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={question.required}
          />
        );
        
      case 'multipleChoice':
        return (
          <div className="mt-3 space-y-2">
            {question.options.map((option, index) => (
              <div className="flex items-center space-x-3 group" key={index}>
                <div className="relative">
                  <input
                    type="radio"
                    className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                    name={`question_${question._id}`}
                    id={`option_${question._id}_${index}`}
                    value={option}
                    checked={value?.answer === option}
                    onChange={handleRadioChange}
                    required={question.required && !value?.answer}
                  />
                  <div className={`w-5 h-5 border-2 rounded-full transition-all duration-300 
                                ${value?.answer === option 
                                  ? 'border-lime-brand bg-white dark:bg-gray-800' 
                                  : 'border-gray-400 dark:border-gray-600 group-hover:border-lime-brand-light'}`}>
                    {value?.answer === option && (
                      <div className="w-3 h-3 bg-lime-brand rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                </div>
                <label className={`text-gray-800 dark:text-gray-200 cursor-pointer hover:text-lime-brand dark:hover:text-lime-brand transition-colors ${value?.answer === option ? 'font-medium text-lime-brand-dark dark:text-lime-brand-light' : ''}`} 
                       htmlFor={`option_${question._id}_${index}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="mt-3 space-y-2">
            {question.options.map((option, index) => (
              <div className="flex items-center space-x-3 group" key={index}>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                    name={`question_${question._id}_${index}`}
                    id={`option_${question._id}_${index}`}
                    value={option}
                    checked={Array.isArray(value?.answer) && value.answer.includes(option)}
                    onChange={handleCheckboxChange}
                  />
                  <div className={`w-5 h-5 border-2 rounded transition-all duration-300
                                ${Array.isArray(value?.answer) && value.answer.includes(option)
                                  ? 'border-lime-brand bg-lime-brand/10' 
                                  : 'border-gray-400 dark:border-gray-600 group-hover:border-lime-brand-light'}`}>
                    {Array.isArray(value?.answer) && value.answer.includes(option) && (
                      <svg className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lime-brand" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </div>
                </div>
                <label className={`text-gray-800 dark:text-gray-200 cursor-pointer hover:text-lime-brand dark:hover:text-lime-brand transition-colors ${Array.isArray(value?.answer) && value.answer.includes(option) ? 'font-medium text-lime-brand-dark dark:text-lime-brand-light' : ''}`} 
                       htmlFor={`option_${question._id}_${index}`}>
                  {option}
                </label>
              </div>
            ))}
            {question.required && Array.isArray(value?.answer) && value.answer.length === 0 && (
              <div className="text-red-500 text-sm mt-1 animate-fade-in">Please select at least one option</div>
            )}
          </div>
        );
        
      case 'file':
        return (
          <div>
            <div className="relative">
              <input
                type="file"
                className={`block w-full text-sm text-gray-700 dark:text-gray-300
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-lime-brand-light file:text-white
                            hover:file:bg-lime-brand-dark hover:file:cursor-pointer
                            transition duration-300
                            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                onChange={handleFileChange}
                required={question.required && !value?.fileUrl}
              />
            </div>
            
            {fileUploading && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-lime-brand h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
            
            {value?.fileUrl && (
              <div className="flex items-center mt-3 text-lime-brand">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>File uploaded: {value.answer}</span>
              </div>
            )}
          </div>
        );
        
      case 'rating':
        const maxRating = question.maxRating || 5;
        return (
          <div className="mt-3">
            <div className="flex space-x-2">
              {[...Array(maxRating)].map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition duration-300 ease-in-out
                            ${value?.answer >= index + 1 
                              ? 'bg-lime-brand-light text-white shadow-md transform scale-110' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-lime-brand-light/70 hover:text-white'}`}
                  onClick={() => handleRatingChange(index + 1)}
                  aria-label={`Rate ${index + 1} out of ${maxRating}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {value?.answer ? `Your rating: ${value.answer}/${maxRating}` : 'Click to rate'}
            </p>
            {question.required && !value?.answer && (
              <div className="text-red-500 text-sm mt-1 animate-fade-in">Rating is required</div>
            )}
          </div>
        );
        
      default:
        return <div className="text-gray-500 dark:text-gray-400 italic">Unsupported question type</div>;
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderQuestionInput()}
      {error && <div className="text-red-500 text-sm mt-1 animate-fade-in">{error}</div>}
    </div>
  );
};

export default JobQuestionAnswer;
