import { useState } from 'react';
import { contactService } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await contactService.submitContactForm(formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-12">
      {/* Contact Information Section */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="w-full h-64 bg-gray-900/50 rounded-lg shadow-lg flex items-center justify-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center">CONTACT US</h1>
        </div>

        {/* Contact Information Grid */}
        <div className="bg-gray-900/30 rounded-lg p-8 mb-12">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-800 pb-6">
              <h2 className="text-lg font-medium mb-2 md:mb-0 text-lime-400">LOCATION</h2>
              <p className="text-gray-300 text-right md:text-left md:max-w-md">
                #51, BHAKRA ROAD, NANGAL, PUNJAB-140124
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-800 pb-6">
              <h2 className="text-lg font-medium mb-2 md:mb-0 text-lime-400">CONTACT</h2>
              <div className="text-gray-300 text-right md:text-left">
                <p>omsoftwareandtechnologies@gmail.com</p>
                <p>+91 62398-62469</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <h2 className="text-lg font-medium mb-2 md:mb-0 text-lime-400">SOCIAL</h2>
              <div className="text-gray-300 text-right md:text-left">
                <p>INSTAGRAM • FACEBOOK</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Section */}
        <div className="text-center mb-12">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg md:text-xl font-medium leading-relaxed text-gray-200">
              SHARE YOUR CREATIVE IDEAS WITH US, AND<br />
              RECEIVE DESIGNS THAT CAPTIVATE AND INSPIRE ENGAGEMENT.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gray-900/30 rounded-lg p-8">
          {success && (
            <div className="mb-8 bg-green-900/30 border border-green-500 text-green-400 px-6 py-4 rounded-md">
              <p className="font-medium text-center">Your message has been sent successfully. We'll get back to you soon!</p>
            </div>
          )}
          
          {error && (
            <div className="mb-8 bg-red-900/30 border border-red-500 text-red-400 px-6 py-4 rounded-md">
              <p className="font-medium text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col space-y-2">
                <label htmlFor="name" className="text-lg font-medium">YOUR NAME</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-transparent border-b-2 border-gray-700 focus:border-lime-400 py-3 outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-lg font-medium ">EMAIL</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-transparent border-b-2 border-gray-700 focus:border-lime-400 py-3 outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="phone" className="text-lg font-medium ">SKYPE/PHONE</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-transparent border-b-2 border-gray-700 focus:border-lime-400 py-3 outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="Your phone number or Skype ID"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="company" className="text-lg font-medium ">COMPANY</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="bg-transparent border-b-2 border-gray-700 focus:border-lime-400 py-3 outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="Your company name"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label htmlFor="message" className="text-lg font-medium ">YOUR MESSAGE</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                className="bg-transparent border-b-2 border-gray-700 focus:border-lime-400 py-3 outline-none transition-colors resize-none text-white placeholder-gray-500"
                placeholder="Hello, can you help me with..."
              ></textarea>
            </div>

            <div className="flex justify-end mt-12">
              <button
                type="submit"
                disabled={loading}
                className="bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-full w-28 h-28 flex items-center justify-center transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
              >
                <span className="text-sm font-bold">
                  {loading ? 'SENDING...' : 'SEND'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;