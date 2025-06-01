import React, { useState, useEffect } from 'react';
import { offerLetterService } from '../services/api';
import OfferLetterForm from '../components/certificates/OfferLetterForm';
import OfferLetterList from '../components/certificates/OfferLetterList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OfferLetters = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offerLetters, setOfferLetters] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login', { state: { message: "You must be an admin to access this page" } });
      return;
    }
    
    fetchOfferLetters();
  }, [navigate, currentUser]);

  const fetchOfferLetters = async () => {
    setLoading(true);
    try {
      const response = await offerLetterService.getAllOfferLetters();
      setOfferLetters(response.data);
    } catch (err) {
      setError('Failed to fetch offer letters');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueOfferLetter = async (offerData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Issuing offer letter with data:', offerData);
      const response = await offerLetterService.issueOfferLetter(offerData);
      setSuccess('Offer letter issued successfully!');
      
      // Send email automatically
      if (offerData.email) {
        console.log('Sending offer letter email to:', offerData.email);
        await offerLetterService.sendOfferLetterEmail(response.data.offerLetterId, {
          recipientEmail: offerData.email
        });
        setSuccess('Offer letter issued and emailed successfully!');
      }
      
      // Refresh the list
      await fetchOfferLetters();
      
      // Switch to list tab to show the new offer letter
      setActiveTab('list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue offer letter');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOfferLetter = async (id) => {
    try {
      console.log('Downloading offer letter:', id);
      const response = await offerLetterService.downloadOfferLetter(id);
      
      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offer-letter-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Offer letter downloaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download offer letter');
      console.error('Error:', err);
    }
  };

  const handleSendOfferLetterEmail = async (id, email) => {
    try {
      console.log('Sending offer letter email:', id, email);
      await offerLetterService.sendOfferLetterEmail(id, {
        recipientEmail: email
      });
      setSuccess('Offer letter emailed successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to email offer letter');
      console.error('Error:', err);
    }
  };

  const handleUpdateOfferLetterStatus = async (id, status) => {
    try {
      console.log('Updating offer letter status:', id, status);
      await offerLetterService.updateOfferLetterStatus(id, status);
      setSuccess(`Offer letter marked as ${status.toLowerCase()}!`);
      
      // Refresh the list
      await fetchOfferLetters();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update offer letter status');
      console.error('Error:', err);
    }
  };

  const handleExtendOfferLetter = async (id, extensionData) => {
    try {
      console.log('Extending offer letter:', id, extensionData);
      await offerLetterService.extendOfferLetter(id, extensionData);
      setSuccess('Offer letter extended successfully!');
      
      // Refresh the list
      await fetchOfferLetters();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extend offer letter');
      console.error('Error:', err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-primary-black text-white">
      <div className="container mx-auto pt-12 py-8">
        <div className="mb-8">
          {/* <h1 className="text-3xl font-bold mb-4">Offer Letter Management</h1> */}
          {/* <p className="text-gray-400">Issue and manage job offer letters for candidates</p> */}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex justify-between items-center">
            <span className="text-red-200">{error}</span>
            <button 
              onClick={clearMessages}
              className="text-red-200 hover:text-white ml-4"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg flex justify-between items-center">
            <span className="text-green-200">{success}</span>
            <button 
              onClick={clearMessages}
              className="text-green-200 hover:text-white ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Offer Letters
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'issue'
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Issue New Offer Letter
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'list' && (
            <OfferLetterList 
              offerLetters={offerLetters}
              loading={loading}
              onDownload={handleDownloadOfferLetter}
              onSendEmail={handleSendOfferLetterEmail}
              onUpdateStatus={handleUpdateOfferLetterStatus}
              currentUser={currentUser}
              onExtend={handleExtendOfferLetter}
            />
          )}

          {activeTab === 'issue' && (
            <OfferLetterForm 
              onSubmit={handleIssueOfferLetter}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferLetters;
