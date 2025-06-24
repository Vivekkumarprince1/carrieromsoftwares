import React, { useState, useEffect } from 'react';
import { certificateService, offerLetterService } from '../services/api';
import IssueForm from '../components/certificates/IssueForm';
import CertificateList from '../components/certificates/CertificateList';
import VerifyForm from '../components/certificates/VerifyForm';
import OfferLetterForm from '../components/certificates/OfferLetterForm';
import OfferLetterList from '../components/certificates/OfferLetterList';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Certificates = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'issue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [offerLetters, setOfferLetters] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login', { state: { message: "You must be an admin to access this page" } });
      return;
    }
    
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const response = await certificateService.getAllCertificates();
        setCertificates(response.data);
      } catch (err) {
        setError('Failed to fetch certificates');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchOfferLetters = async () => {
      try {
        const response = await offerLetterService.getAllOfferLetters();
        setOfferLetters(response.data);
      } catch (err) {
        console.error('Error fetching offer letters:', err);
      }
    };

    fetchCertificates();
    fetchOfferLetters();
  }, [navigate, currentUser]);

  // Handle tab parameter changes
  useEffect(() => {
    if (tabParam && ['issue', 'offer', 'all', 'alloffers', 'verify'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleIssue = async (certificateData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Issuing certificate with data:', certificateData);
      const response = await certificateService.issueCertificate(certificateData);
      setSuccess('Certificate issued successfully!');
      
      if (certificateData.email) {
        console.log('Sending certificate email to:', certificateData.email);
        await certificateService.sendCertificateEmail(response.data.certificateId, {
          recipientEmail: certificateData.email,
          subject: `Certificate for ${certificateData.jobrole}`,
          message: `Congratulations on completing your internship in ${certificateData.domain}!`
        });
        setSuccess('Certificate issued and emailed successfully!');
      }
      
      const updatedCerts = await certificateService.getAllCertificates();
      setCertificates(updatedCerts.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailCertificate = async (id, email) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const cert = certificates.find(c => c._id === id);
      if (!cert) throw new Error('Certificate not found');
      
      console.log('Sending certificate email to:', email);
      await certificateService.sendCertificateEmail(id, {
        recipientEmail: email,
        subject: `Certificate for ${cert.jobrole}`,
        message: `Congratulations on completing your internship in ${cert.domain}!`
      });
      
      setSuccess('Certificate emailed successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to email certificate');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferLetterGeneration = async (offerData) => {
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
      
      // Refresh offer letters list
      const updatedOfferLetters = await offerLetterService.getAllOfferLetters();
      setOfferLetters(updatedOfferLetters.data);
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
      const updatedOfferLetters = await offerLetterService.getAllOfferLetters();
      setOfferLetters(updatedOfferLetters.data);
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
      const updatedOfferLetters = await offerLetterService.getAllOfferLetters();
      setOfferLetters(updatedOfferLetters.data);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 pt-8 text-white"></h1>
      
      {error && <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded mb-6">{success}</div>}
      
      <div className="mb-6 border-b border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('issue')}
              className={`inline-block py-4 px-4 text-sm font-medium ${
                activeTab === 'issue'
                  ? 'border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              Issue Certificate
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('offer')}
              className={`inline-block py-4 px-4 text-sm font-medium ${
                activeTab === 'offer'
                  ? 'border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              Issue Offer Letter
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`inline-block py-4 px-4 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              All Certificates
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('alloffers')}
              className={`inline-block py-4 px-4 text-sm font-medium ${
                activeTab === 'alloffers'
                  ? 'border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              All Offer Letters
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('verify')}
              className={`inline-block py-4 px-4 text-sm font-medium ${
                activeTab === 'verify'
                  ? ' border-b-2 border-lime-400'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              Verify Certificate
            </button>
          </li>
        </ul>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        {activeTab === 'issue' && (
          <IssueForm onSubmit={handleIssue} loading={loading} />
        )}
        
        {activeTab === 'offer' && (
          <OfferLetterForm onSubmit={handleOfferLetterGeneration} loading={loading} />
        )}
        
        {activeTab === 'all' && (
          <CertificateList 
            certificates={certificates} 
            loading={loading} 
            onEmailCertificate={handleEmailCertificate} 
          />
        )}
        
        {activeTab === 'alloffers' && (
          <OfferLetterList 
            offerLetters={offerLetters}
            loading={loading}
            onDownload={handleDownloadOfferLetter}
            onSendEmail={handleSendOfferLetterEmail}
            onUpdateStatus={handleUpdateOfferLetterStatus}
            onExtend={handleExtendOfferLetter}
            currentUser={currentUser}
          />
        )}
        
        {activeTab === 'verify' && (
          <VerifyForm />
        )}
      </div>
    </div>
  );
};

export default Certificates;