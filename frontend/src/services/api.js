import axios from 'axios';
import { isTokenExpired } from '../utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiry or unauthorized access
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch custom event to notify AuthContext about token expiry
      window.dispatchEvent(new CustomEvent('tokenExpired'));
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?message=Session expired. Please login again.';
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isTokenExpired: () => {
    const token = localStorage.getItem('token');
    return isTokenExpired(token);
  },
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('tokenExpired'));
  }
};

// Job services
export const jobService = {
  getAllJobs: () => api.get('/api/jobs'),
  getJobById: (id) => api.get(`/api/jobs/${id}`),
  createJob: (jobData) => {
    // Check if jobData contains an image file
    if (jobData.image && jobData.image instanceof File) {
      const formData = new FormData();
      
      // Append image file
      formData.append('image', jobData.image);
      
      // Append all other job data fields
      Object.keys(jobData).forEach(key => {
        if (key !== 'image' && key !== 'questions') {
          formData.append(key, jobData[key]);
        }
      });
      
      // Handle questions array specifically (convert to JSON string)
      if (jobData.questions && Array.isArray(jobData.questions)) {
        formData.append('questions', JSON.stringify(jobData.questions));
      }
      
      return api.post('/api/jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
    }
    
    // If no image, proceed with regular JSON request
    return api.post('/api/jobs', jobData);
  },
  updateJob: (id, jobData) => {
    // Check if jobData contains an image file
    if (jobData.image && jobData.image instanceof File) {
      const formData = new FormData();
      
      // Append image file
      formData.append('image', jobData.image);
      
      // Append all other job data fields
      Object.keys(jobData).forEach(key => {
        if (key !== 'image' && key !== 'questions') {
          formData.append(key, jobData[key]);
        }
      });
      
      // Handle questions array specifically (convert to JSON string)
      if (jobData.questions && Array.isArray(jobData.questions)) {
        formData.append('questions', JSON.stringify(jobData.questions));
      }
      
      return api.put(`/api/jobs/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
    }
    
    // If no image, proceed with regular JSON request
    return api.put(`/api/jobs/${id}`, jobData);
  },
  deleteJob: (id) => api.delete(`/api/jobs/${id}`),
  getFeatured: () => api.get('api/jobs/featured'),
  
  // New question-related endpoints
  getJobQuestions: (jobId) => api.get(`/api/jobs/${jobId}/questions`),
  addJobQuestion: (jobId, questionData) => api.post(`/api/jobs/${jobId}/questions`, questionData),
  updateJobQuestion: (jobId, questionId, questionData) => api.put(`/api/jobs/${jobId}/questions/${questionId}`, questionData),
  deleteJobQuestion: (jobId, questionId) => api.delete(`/api/jobs/${jobId}/questions/${questionId}`),
  reorderJobQuestions: (jobId, questionOrder) => api.put(`/api/jobs/${jobId}/questions-reorder`, { questionOrder }),
  
  // Get applications for a specific job - using correct route
  getJobApplications: (jobId) => api.get(`/api/applications/job/${jobId}`),
};

// Application services
export const applicationService = {
  getAllApplications: () => api.get('/api/applications'),
  getMyApplications: () => api.get('/api/applications/my'),
  getApplicationById: (id) => api.get(`/api/applications/${id}/detail`),
  createApplication: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/api/applications', formData, config);
  },
  updateApplication: (id, applicationData) => api.put(`/api/applications/${id}`, applicationData),
  deleteApplication: (id) => api.delete(`/api/applications/${id}`),
  
  // Application status management
  updateApplicationStatus: (id, statusData) => api.put(`/api/applications/${id}/status`, statusData),
  generateOfferLetter: (applicationId, offerDetails) => api.post(`/api/applications/${applicationId}/offer`, offerDetails),
  rejectApplication: (applicationId, rejectionData) => api.post(`/api/applications/${applicationId}/reject`, rejectionData),
  sendWelcomeEmail: (applicationId, welcomeData) => api.post(`/api/applications/${applicationId}/welcome`, welcomeData),
  
  parseResume: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Increased timeout for large resume files
    };
    return api.post('/api/applications/parse-resume', formData, config)
      .then(response => {
        // Process the API response data
        const data = response.data || {};
        
        // Return standardized data structure for form filling
        return {
          data: {
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            skills: data.skills || '',
            education: data.education || '',
            experience: data.experience || '',
            address: data.address || ''
          }
        };
      })
      .catch(error => {
        console.error('Resume parsing error:', error);
        // Return empty data instead of throwing to avoid breaking the form
        return {
          data: {
            fullName: '',
            email: '',
            phone: '',
            skills: '',
            education: '',
            experience: '',
            address: ''
          },
          error: error.response?.data?.message || error.message || 'Resume parsing failed'
        };
      });
  },
  
  // New methods for question handling
  uploadQuestionFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/applications/upload-question-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  updateApplicationAnswers: (applicationId, answers) => 
    api.put(`/api/applications/${applicationId}/answers`, { questionAnswers: answers }),
};

// Certificate services
export const certificateService = {
  getAllCertificates: () => api.get('/api/certification'),
  getCertificateById: (id) => api.get(`/api/certification/${id}`),
  updateCertificate: (id, certificateData) => api.put(`/api/certification/${id}`, certificateData),
  deleteCertificate: (id) => api.delete(`/api/certification/${id}`),
  
  // Download certificate as a blob
  downloadCertificate: (id) => {
    // Using direct fetch to avoid issues with axios interceptors
    return fetch(`${API_URL}/api/certification/download/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob().then(blobData => {
        return {
          data: blobData,
          status: response.status,
          headers: {
            'content-type': response.headers.get('content-type')
          }
        };
      });
    });
  },
  
  // Certificate issuance routes
  issueCertificate: (certData) => api.post('/api/certification/issue', certData),
  verifyCertificate: (id) => api.get(`/api/certification/verify/${id}`),
  // Send certificate via email
  sendCertificateEmail: (id, emailData) => api.post(`/api/certification/${id}/send-email`, emailData),
};

// Offer Letter services
export const offerLetterService = {
  // Get all offer letters from certificate route
  getAllOfferLetters: () => api.get('/api/certification/offer-letters'),
  getOfferLetterById: (id) => api.get(`/api/certification/offer-letters/${id}`),
  // Issue offer letter from certificate route (existing endpoint)
  issueOfferLetter: (offerData) => api.post('/api/certification/issue-offer', offerData),
  // Alternative endpoints from dedicated offer letter routes
  getAllOfferLettersAlt: () => api.get('/api/offer-letters'),
  updateOfferLetterStatus: (id, status) => api.patch(`/api/certification/offer-letters/${id}/status`, { status }),
  extendOfferLetter: (id, extensionData) => api.patch(`/api/certification/offer-letters/${id}/extend`, extensionData),
  sendOfferLetterEmail: (id, emailData) => api.post(`/api/certification/offer-letters/${id}/send-email`, emailData),
  
  // Download offer letter as a blob
  downloadOfferLetter: (id) => {
    return fetch(`${API_URL}/api/certification/offer-letters/${id}/download`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob().then(blobData => {
        return {
          data: blobData,
          status: response.status,
          headers: {
            'content-type': response.headers.get('content-type')
          }
        };
      });
    });
  },
};

export default api;