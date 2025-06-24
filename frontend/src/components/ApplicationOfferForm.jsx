import React, { useState } from 'react';

const ApplicationOfferForm = ({ application, job, onSubmit, loading, onCancel }) => {
  const [formData, setFormData] = useState({
    position: job?.title || '',
    department: job?.department || 'General',
    salary: '',
    startDate: '',
    joiningLocation: '',
    workType: 'On-site',
    benefits: '',
    reportingManager: '',
    hrContactName: 'HR Team',
    hrContactEmail: '',
    hrContactPhone: '',
    validUntil: '',
    additionalNotes: ''
  });

  React.useEffect(() => {
    // Set default dates
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() + 30)); // 30 days from now
    const validUntil = new Date(today.setDate(today.getDate() + 14)); // 14 days from start date
    
    setFormData(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0]
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert benefits string to array
    const processedData = {
      ...formData,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()).filter(b => b) : [],
      salary: parseFloat(formData.salary)
    };
    onSubmit(processedData);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mt-4">
      <h3 className="text-lg font-medium text-white mb-4">Generate Offer Letter</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-300 mb-2">
              Annual Salary (USD) *
            </label>
            <input
              type="number"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              required
              placeholder="Enter annual salary"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div>
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

        <div className="flex space-x-4 pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-5 py-2 bg-lime-400 hover:bg-lime-600 text-black font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Generating Offer Letter...' : 'Generate Offer Letter'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationOfferForm;
