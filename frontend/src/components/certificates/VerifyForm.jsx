import React, { useState } from 'react';
import { certificateService } from '../../services/api';
import { format } from 'date-fns';

const VerifyForm = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);

  const handleChange = (e) => {
    setCertificateId(e.target.value);
    // Clear previous
    setError('');
    setCertificate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certificateId.trim()) return;
    
    setLoading(true);
    setError('');
    setCertificate(null);
    
    try {
      const response = await certificateService.verifyCertificate(certificateId);
      setCertificate(response.data.certificate);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate verification failed');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary-black rounded-lg shadow-md border border-dark-gray">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Verify Certificate</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="certificateId" className="block text-sm font-medium text-gray-300 mb-2">
              Certificate ID
            </label>
            <input
              id="certificateId"
              type="text"
              placeholder="Enter certificate ID to verify"
              value={certificateId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`px-4 py-2 bg-lime-400 hover:bg-lime-400 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>

        {loading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lime-400"></div>
            <span className="sr-only">Loading...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-md text-red-400">
            {error}
          </div>
        )}

        {certificate && (
          <div className="mt-6 border border-green-500/30 rounded-md overflow-hidden">
            <div className="bg-green-900/30 px-4 py-3 border-b border-green-500/30 text-green-400">
              <div className="flex justify-between items-center">
                <h5 className="text-lg font-semibold m-0">Certificate Verified Successfully</h5>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="p-4 bg-secondary-black/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3">
                <div className="text-gray-400 font-medium md:col-span-1">Name:</div>
                <div className="text-white md:col-span-3">{certificate.name}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 mt-3">
                <div className="text-gray-400 font-medium md:col-span-1">Domain:</div>
                <div className="text-white md:col-span-3">{certificate.domain}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 mt-3">
                <div className="text-gray-400 font-medium md:col-span-1">Internship Title:</div>
                <div className="text-white md:col-span-3">{certificate.internshipTitle}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 mt-3">
                <div className="text-gray-400 font-medium md:col-span-1">Duration:</div>
                <div className="text-white md:col-span-3">
                  {format(new Date(certificate.fromDate), 'MMM dd, yyyy')} to {format(new Date(certificate.toDate), 'MMM dd, yyyy')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 mt-3">
                <div className="text-gray-400 font-medium md:col-span-1">Issued By:</div>
                <div className="text-white md:col-span-3">{certificate.issuedBy}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 mt-3">
                <div className="text-gray-400 font-medium md:col-span-1">Issued On:</div>
                <div className="text-white md:col-span-3">{format(new Date(certificate.issuedOn), 'MMM dd, yyyy')}</div>
              </div>
              <div className="mt-5">
                <button 
                  className="px-4 py-2 bg-transparent text-lime-400 border border-lime-400 hover:bg-lime-400/10 rounded-md text-sm font-medium transition-colors"
                  onClick={() => window.open(`/api/certification/download/${certificate._id}`, '_blank')}
                >
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyForm;