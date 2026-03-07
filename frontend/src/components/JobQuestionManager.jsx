import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';

const JobQuestionManager = ({ jobId, onQuestionsChanged }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    required: false,
    questionType: 'text',
    options: '',
    allowFileUpload: false,
    order: 0
  });

  useEffect(() => {
    loadQuestions();
  }, [jobId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobById(jobId);
      const loadedQuestions = response.data.questions || [];
      setQuestions(loadedQuestions);
      if (onQuestionsChanged) {
        onQuestionsChanged(loadedQuestions);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error loading questions for job ID: ${jobId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuestionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewQuestion(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const addQuestion = async () => {
    if (!newQuestion.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    let formattedQuestion = { ...newQuestion };
    
    if ((newQuestion.questionType === 'multipleChoice' || newQuestion.questionType === 'checkbox') && newQuestion.options) {
      formattedQuestion.options = newQuestion.options
        .split(',')
        .map(option => option.trim())
        .filter(option => option);
      
      if (formattedQuestion.options.length === 0) {
        setError('Please provide valid comma-separated options for multiple choice questions');
        return;
      }
    } else {
      formattedQuestion.options = [];
    }

    formattedQuestion.order = questions.length;

    try {
      const updatedQuestions = [...questions, formattedQuestion];
      setQuestions(updatedQuestions);
      
      setNewQuestion({
        questionText: '',
        required: false,
        questionType: 'text',
        options: '',
        allowFileUpload: false,
        order: updatedQuestions.length
      });
      
      await jobService.updateJob(jobId, { questions: updatedQuestions });
      setSuccessMessage('Question added successfully!');
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (onQuestionsChanged) {
        onQuestionsChanged(updatedQuestions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding question');
    }
  };

  const deleteQuestion = async (index) => {
    try {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      
      updatedQuestions.forEach((q, i) => {
        q.order = i;
      });
      
      setQuestions(updatedQuestions);
      
      await jobService.updateJob(jobId, { questions: updatedQuestions });
      setSuccessMessage('Question deleted successfully!');
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (onQuestionsChanged) {
        onQuestionsChanged(updatedQuestions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting question');
    }
  };

  const moveQuestion = async (index, direction) => {
    if ((index === 0 && direction === -1) || (index === questions.length - 1 && direction === 1)) {
      return;
    }

    try {
      const updatedQuestions = [...questions];
      const temp = updatedQuestions[index];
      updatedQuestions[index] = updatedQuestions[index + direction];
      updatedQuestions[index + direction] = temp;
      
      updatedQuestions.forEach((q, i) => {
        q.order = i;
      });
      
      setQuestions(updatedQuestions);
      
      await jobService.updateJob(jobId, { questions: updatedQuestions });
      
      if (onQuestionsChanged) {
        onQuestionsChanged(updatedQuestions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error reordering questions');
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">Manage Application Questions</h3>
      
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

      <div className="mb-8">
        <h4 className="text-lg font-medium text-white mb-4">Current Questions</h4>
        
        {questions.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 text-gray-300 px-6 py-4 rounded-md text-center">
            <p>No questions have been added yet. Add questions below to include in the job application.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col sm:flex-row justify-between">
                <div className="flex-grow mb-3 sm:mb-0">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium text-white">{q.questionText}</p>
                    {q.required && (
                      <span className="inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    <p>Type: <span className="text-gray-300">{q.questionType.charAt(0).toUpperCase() + q.questionType.slice(1)}</span></p>
                    
                    {q.allowFileUpload && (
                      <p className="mt-1">Allows file upload</p>
                    )}
                    
                    {(q.questionType === 'multipleChoice' || q.questionType === 'checkbox') && q.options && q.options.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1">Options:</p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((option, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500"
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500"
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === questions.length - 1}
                    title="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    className="p-1.5 bg-red-900/60 text-red-300 rounded hover:bg-red-900/80 focus:outline-none focus:ring-1 focus:ring-red-500"
                    onClick={() => deleteQuestion(index)}
                    title="Delete question"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h4 className="text-lg font-medium text-white mb-4">Add New Question</h4>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-gray-300 mb-1">Question Text*</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
              id="questionText"
              name="questionText"
              value={newQuestion.questionText}
              onChange={handleNewQuestionChange}
              placeholder="e.g. What makes you a good fit for this role?"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionType" className="block text-sm font-medium text-gray-300 mb-1">Question Type</label>
              <select
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                id="questionType"
                name="questionType"
                value={newQuestion.questionType}
                onChange={handleNewQuestionChange}
              >
                <option value="text">Text (Short Answer)</option>
                <option value="multipleChoice">Multiple Choice</option>
                <option value="checkbox">Checkbox</option>
                <option value="file">File Upload</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {(newQuestion.questionType === 'multipleChoice' || newQuestion.questionType === 'checkbox') && (
              <div>
                <label htmlFor="options" className="block text-sm font-medium text-gray-300 mb-1">Options (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="options"
                  name="options"
                  value={newQuestion.options}
                  onChange={handleNewQuestionChange}
                  placeholder="e.g. Option 1, Option 2, Option 3"
                />
              </div>
            )}
            
            {newQuestion.questionType === 'rating' && (
              <div>
                <label htmlFor="maxRating" className="block text-sm font-medium text-gray-300 mb-1">Max Rating</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                  id="maxRating"
                  name="maxRating"
                  value={newQuestion.maxRating || 5}
                  onChange={handleNewQuestionChange}
                  min="1"
                  max="10"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
                id="required"
                name="required"
                checked={newQuestion.required}
                onChange={handleNewQuestionChange}
              />
              <label htmlFor="required" className="ml-2 block text-sm font-medium text-gray-300">
                Required Question
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
                id="allowFileUpload"
                name="allowFileUpload"
                checked={newQuestion.allowFileUpload}
                onChange={handleNewQuestionChange}
              />
              <label htmlFor="allowFileUpload" className="ml-2 block text-sm font-medium text-gray-300">
                Allow File Upload
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center"
              onClick={addQuestion}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobQuestionManager;
