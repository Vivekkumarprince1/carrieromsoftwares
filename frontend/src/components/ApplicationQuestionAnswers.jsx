import React from 'react';

const ApplicationQuestionAnswers = ({ questionAnswers }) => {
  if (!questionAnswers || questionAnswers.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h5 className="text-lg font-medium text-white mb-3">Application Questions</h5>
      <div className="space-y-3">
        {questionAnswers.map((qa, index) => (
          <div key={index} className="bg-secondary-black/70 border border-dark-gray rounded-md p-4">
            <h6 className="text-primary-yellow font-medium mb-2">{qa.questionText}</h6>
            {qa.questionType === 'file' ? (
              qa.fileUrl ? (
                <a href={qa.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-primary-yellow text-primary-yellow hover:bg-primary-yellow/10 font-medium rounded-md text-sm transition-colors">
                  View Uploaded File
                </a>
              ) : (
                <p className="text-gray-400">No file uploaded</p>
              )
            ) : (
              <p className="text-gray-300">{Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationQuestionAnswers;