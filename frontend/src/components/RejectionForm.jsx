import React from 'react';

const RejectionForm = ({
  applicationId,
  rejectionReason,
  setRejectionReason,
  onReject,
  isProcessing,
  isDisabled
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onReject(applicationId);
  };

  return (
    <div className="card">
      <div className="card-header bg-danger text-white">
        Reject Application
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="rejectionReason" className="form-label">Rejection Reason</label>
            <textarea 
              className="form-control" 
              id="rejectionReason" 
              rows="4" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a professional explanation for the rejection"
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="btn btn-danger"
            disabled={isProcessing || isDisabled}
          >
            {isProcessing ? 'Processing...' : 'Send Rejection'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RejectionForm;