import React, { useState } from 'react';

const ExtendOfferModal = ({ isOpen, onClose, offerLetter, onExtend }) => {
  const [formData, setFormData] = useState({
    newValidUntil: '',
    newStartDate: '',
    additionalNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Set minimum dates
  const today = new Date().toISOString().split('T')[0];
  const currentValidUntil = offerLetter ? new Date(offerLetter.validUntil).toISOString().split('T')[0] : today;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newValidUntil) {
      newErrors.newValidUntil = 'New valid until date is required';
    } else if (formData.newValidUntil <= currentValidUntil) {
      newErrors.newValidUntil = 'New valid until date must be after the current valid until date';
    }

    if (formData.newStartDate && formData.newValidUntil) {
      if (formData.newStartDate >= formData.newValidUntil) {
        newErrors.newStartDate = 'New start date must be before the new valid until date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onExtend(offerLetter._id, formData);
      onClose();
      // Reset form
      setFormData({
        newValidUntil: '',
        newStartDate: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error extending offer letter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      newValidUntil: '',
      newStartDate: '',
      additionalNotes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen || !offerLetter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary-black rounded-lg border border-dark-gray max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Extend Offer Letter</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Offer Letter Info */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-white font-medium mb-2">{offerLetter.candidateName}</h3>
            <p className="text-gray-400 text-sm">{offerLetter.position} • {offerLetter.department}</p>
            <p className="text-gray-400 text-sm mt-1">
              Current Valid Until: {new Date(offerLetter.validUntil).toLocaleDateString()}
            </p>
            <p className="text-gray-400 text-sm">
              Current Start Date: {new Date(offerLetter.startDate).toLocaleDateString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Valid Until Date */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                New Valid Until Date *
              </label>
              <input
                type="date"
                name="newValidUntil"
                value={formData.newValidUntil}
                onChange={handleChange}
                min={new Date(new Date(currentValidUntil).getTime() + 24*60*60*1000).toISOString().split('T')[0]} // At least one day after current
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                required
              />
              {errors.newValidUntil && (
                <p className="text-red-400 text-sm mt-1">{errors.newValidUntil}</p>
              )}
            </div>

            {/* New Start Date (Optional) */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                New Start Date (Optional)
              </label>
              <input
                type="date"
                name="newStartDate"
                value={formData.newStartDate}
                onChange={handleChange}
                min={today}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
              {errors.newStartDate && (
                <p className="text-red-400 text-sm mt-1">{errors.newStartDate}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Leave empty to keep the current start date
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none"
                placeholder="Add any notes about the extension..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Extending...' : 'Extend Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExtendOfferModal;
