import React, { useState, useEffect } from 'react';

const getDefaultOfferFormData = () => ({
  candidateName: '',
  email: '',
  position: '',
  department: '',
  companyName: '',
  salary: '',
  startDate: '',
  joiningLocation: '',
  workType: 'On-site',
  benefits: '',
  reportingManager: '',
  hrContactName: '',
  hrContactEmail: '',
  hrContactPhone: '',
  validUntil: '',
  additionalNotes: ''
});

const OfferLetterForm = ({ onSubmit, loading, editData = null }) => {
  const [formData, setFormData] = useState(getDefaultOfferFormData());
  const [showForm, setShowForm] = useState(false);

  // Effect to populate form data when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        candidateName: editData.candidateName || '',
        email: editData.email || '',
        position: editData.position || '',
        department: editData.department || '',
        companyName: editData.companyName || '',
        salary: editData.salary || '',
        startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
        joiningLocation: editData.joiningLocation || '',
        workType: editData.workType || 'On-site',
        benefits: Array.isArray(editData.benefits) ? editData.benefits.join(', ') : (editData.benefits || ''),
        reportingManager: editData.reportingManager || '',
        hrContactName: editData.hrContactName || '',
        hrContactEmail: editData.hrContactEmail || '',
        hrContactPhone: editData.hrContactPhone || '',
        validUntil: editData.validUntil ? editData.validUntil.split('T')[0] : '',
        additionalNotes: editData.additionalNotes || ''
      });
      setShowForm(true);
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert benefits string to array
    const processedData = {
      ...formData,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()).filter(b => b) : [],
      salary: parseFloat(formData.salary)
    };
    await onSubmit(processedData);
    setFormData(getDefaultOfferFormData());
    setShowForm(false);
  };

  return (
    <div className="bg-secondary-black rounded-lg shadow-md border border-dark-gray">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-5">Issue Offer Letter</h3>
        
        {!showForm ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-6">Create a new offer letter for a candidate</p>
            <button 
              type="button" 
              onClick={() => setShowForm(true)}
              className="px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors"
            >
              New Offer Letter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="candidateName" className="block text-sm font-medium text-gray-300 mb-2">
                Candidate Name *
              </label>
              <input
                type="text"
                id="candidateName"
                name="candidateName"
                value={formData.candidateName}
                onChange={handleChange}
                required
                placeholder="Enter candidate name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter candidate email"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                Position *
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="Enter job position"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                Department *
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="Enter department"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Enter company name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-300 mb-2">
                Annual Salary (₹) *
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                placeholder="Enter annual salary in rupees"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="joiningLocation" className="block text-sm font-medium text-gray-300 mb-2">
                Joining Location *
              </label>
              <input
                type="text"
                id="joiningLocation"
                name="joiningLocation"
                value={formData.joiningLocation}
                onChange={handleChange}
                required
                placeholder="Enter office location"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="workType" className="block text-sm font-medium text-gray-300 mb-2">
                Work Type
              </label>
              <select
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label htmlFor="reportingManager" className="block text-sm font-medium text-gray-300 mb-2">
                Reporting Manager
              </label>
              <input
                type="text"
                id="reportingManager"
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                placeholder="Enter reporting manager name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-300 mb-2">
                Valid Until *
              </label>
              <input
                type="date"
                id="validUntil"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="benefits" className="block text-sm font-medium text-gray-300 mb-2">
              Benefits (comma-separated)
            </label>
            <input
              type="text"
              id="benefits"
              name="benefits"
              value={formData.benefits}
              onChange={handleChange}
              placeholder="e.g. Health Insurance, 401k, Flexible PTO"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div>
              <label htmlFor="hrContactName" className="block text-sm font-medium text-gray-300 mb-2">
                HR Contact Name
              </label>
              <input
                type="text"
                id="hrContactName"
                name="hrContactName"
                value={formData.hrContactName}
                onChange={handleChange}
                placeholder="Enter HR contact name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="hrContactEmail" className="block text-sm font-medium text-gray-300 mb-2">
                HR Contact Email
              </label>
              <input
                type="email"
                id="hrContactEmail"
                name="hrContactEmail"
                value={formData.hrContactEmail}
                onChange={handleChange}
                placeholder="Enter HR email"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="hrContactPhone" className="block text-sm font-medium text-gray-300 mb-2">
                HR Contact Phone
              </label>
              <input
                type="tel"
                id="hrContactPhone"
                name="hrContactPhone"
                value={formData.hrContactPhone}
                onChange={handleChange}
                placeholder="Enter HR phone"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows="4"
              placeholder="Enter any additional information for the offer letter"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            ></textarea>
          </div>

          <div className="flex space-x-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Generating Offer Letter...' : 'Generate Offer Letter'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default OfferLetterForm;