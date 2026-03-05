import React, { useEffect, useState } from 'react';

const getDefaultFormData = () => ({
  name: '',
  domain: '',
  jobrole: '',
  fromDate: '',
  toDate: '',
  email: '',
  issuedBy: 'OM Softwares'
});

const IssueForm = ({ onSubmit, loading, initialData = {} }) => {
  const [formData, setFormData] = useState({
    ...getDefaultFormData(),
    ...initialData,
    issuedBy: initialData?.issuedBy || 'OM Softwares'
  });

  useEffect(() => {
    setFormData({
      ...getDefaultFormData(),
      ...initialData,
      issuedBy: initialData?.issuedBy || 'OM Softwares'
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData(getDefaultFormData());
  };

  return (
    <div className="bg-secondary-black rounded-lg shadow-md border border-dark-gray">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-5">Issue New Certificate</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter recipient name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter recipient email for certificate delivery"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                If provided, certificate will be automatically sent to this email
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-300 mb-2">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                placeholder="Enter domain (e.g., Web Development)"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="jobrole" className="block text-sm font-medium text-gray-300 mb-2">
                Job Role
              </label>
              <input
                type="text"
                id="jobrole"
                name="jobrole"
                value={formData.jobrole}
                onChange={handleChange}
                required
                placeholder="Enter job role or internship title"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="issuedBy" className="block text-sm font-medium text-gray-300 mb-2">
              Issued By
            </label>
            <input
              type="text"
              id="issuedBy"
              name="issuedBy"
              value={formData.issuedBy}
              onChange={handleChange}
              placeholder="Enter issuer name"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`px-5 py-2 bg-lime-300 hover:bg-lime-600 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Issuing Certificate...' : 'Issue Certificate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;