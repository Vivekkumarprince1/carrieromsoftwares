import React from 'react';

const OfferForm = ({ 
  applicationId, 
  offerDetails, 
  setOfferDetails, 
  onAccept, 
  isProcessing, 
  isDisabled 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAccept(applicationId);
  };

  return (
    <div className="card">
      <div className="card-header bg-success text-white">
        Accept Application
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="offerDetails" className="form-label">Offer Details</label>
            <textarea 
              className="form-control" 
              id="offerDetails" 
              rows="4" 
              value={offerDetails}
              onChange={(e) => setOfferDetails(e.target.value)}
              placeholder="Include position, salary, start date, and any other relevant details"
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={isProcessing || isDisabled}
          >
            {isProcessing ? 'Processing...' : 'Send Offer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OfferForm;