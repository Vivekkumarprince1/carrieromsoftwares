import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import HeroSection from '../components/hero/HeroSection';

// Animation imports
import { motion } from 'framer-motion';

const Home = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        setLoading(true);
        const response = await jobService.getFeatured();
        setFeaturedJobs(response.data);
      } catch (err) {
        console.error('Error fetching featured jobs:', err);
        setError('Failed to load featured jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <HeroSection />

      {/* Career Journey Section */}
      <section className="relative py-16 md:py-20">
      
        {/* Enhanced Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80"></div>
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-20 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-40 -left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
          ></motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-10">
            {/* Image with enhanced styling */}
            <motion.div 
              className="w-full md:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative">
                <div className="absolute -bottom-5 -left-5 right-10 top-10 bg-gradient-to-tr from-lime-400 via-emerald-500 to-teal-600 rounded-2xl transform rotate-3 opacity-90"></div>
                <img
                  src="/images/s_image_text.svg"
                  alt="Career professional"
                  className="relative z-10 w-full rounded-2xl shadow-2xl"
                />
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-lime-500/50 rounded-full blur-md"></div>
                <div className="absolute bottom-10 -right-6 w-16 h-16 bg-blue-500/30 rounded-full blur-md"></div>
              </div>
            </motion.div>

            {/* Content with improved styling */}
            <motion.div 
              className="w-full md:w-1/2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Step into a <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-green-500">New Career</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Our platform connects talented professionals with top companies worldwide. 
                We provide tools and resources to help you find the perfect job match and 
                advance your career with confidence.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                {[
                  "Personalized job matches",
                  "Resume building tools",
                ].map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    viewport={{ once: true }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-lime-400 to-green-500 mr-3 flex-shrink-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-200 font-medium">{item}</p>
                  </motion.div>
                ))}
              </div>
              <Link to="/jobs">
                <button 
                  variant="primary" 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black px-8 py-3.5 rounded-xl text-lg font-semibold shadow-lg shadow-lime-500/20 transition-all duration-300 transform hover:scale-105"
                >
                  Explore Jobs
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="relative py-16 md:py-20">
        {/* Enhanced background with subtle gradients */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Animated background elements with improved animation */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-20 right-20 w-96 h-96 bg-lime-600/10 rounded-full blur-3xl"
            animate={{ 
              y: [0, -20, 0], 
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-40 left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"
            animate={{ 
              y: [0, 20, 0], 
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
          ></motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Featured <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-green-500">Opportunities</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover handpicked job positions from leading companies across industries
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-lime-500/20"></div>
                <p className="mt-6 text-lime-400 text-lg font-medium">Loading opportunities...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center p-8">
              <div className="p-8 bg-red-900/20 rounded-xl border border-red-500/50 max-w-md shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 text-center font-medium text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredJobs.slice(0, 6).map((job, index) => (
                <motion.div
                  key={job._id}
                  className="group relative h-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl transform group-hover:scale-[1.03] transition-all duration-300 shadow-xl"></div>
                  <div className="relative bg-gray-900 rounded-xl p-6 h-full z-10 transform translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300 flex flex-col">
                    {/* Decorative element */}
                    <div className="absolute top-2 right-2 w-20 h-20 bg-lime-500/5 rounded-full blur-xl"></div>
                    
                    <div className="flex items-center mb-5">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center mr-4 border-2 border-lime-500/20 shadow-md">
                        <span className="text-xl font-bold text-white">{job.company?.charAt(0) || 'J'}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-lime-400 transition-colors">{job.title}</h3>
                        <p className="text-gray-400">{job.company}</p>
                      </div>
                    </div>
                    
                    <div className="mb-5 pb-4 border-b border-gray-800/70">
                      <div className="flex items-center text-gray-400 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-lime-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{job.location || 'Remote'}</span>
                      </div>
                      
                      {job.salary && (
                        <div className="flex items-center text-lime-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{job.salary}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      {job.skills?.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-800 text-xs px-3 py-1.5 rounded-full text-gray-300 font-medium border border-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <Link 
                        to={`/apply/${job._id}`} 
                        className="inline-flex w-full items-center justify-center bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-lime-500/20 transform hover:translate-y-[-2px]"
                      >
                        Apply Now
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* View All Jobs Card */}
              <motion.div 
                className="group relative h-full"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl transform group-hover:scale-[1.03] transition-all duration-300 shadow-xl"></div>
                <div className="relative bg-gray-900 rounded-xl p-6 h-full z-10 transform translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6 border-2 border-lime-500/20 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-lime-400 transition-colors">Explore More Opportunities</h3>
                  <p className="text-gray-400 mb-8 text-center">Discover hundreds of job openings matching your skills and career goals</p>
                  <Link 
                    to="/jobs" 
                    className="inline-flex items-center justify-center bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-medium py-3 px-6 rounded-lg transition-all duration-300 w-full shadow-lg shadow-lime-500/20 transform hover:translate-y-[-2px]"
                  >
                    View All Jobs
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-black relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-40 right-0 w-96 h-96 bg-lime-600/10 rounded-full blur-3xl"
            animate={{ 
              y: [0, -10, 0], 
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
          <motion.div 
            className="absolute -bottom-20 left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"
            animate={{ 
              y: [0, 15, 0], 
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-green-500">Works</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Our streamlined process makes job hunting and application tracking simple and efficient
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: "Find Jobs",
                description: "Browse through thousands of job listings filtered to match your skills and preferences."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Easy Apply",
                description: "Submit your application with just a few clicks using our streamlined application process."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                title: "Track Progress",
                description: "Monitor all your job applications in one place with real-time status updates."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden p-8 bg-gray-900/60 rounded-xl backdrop-blur-sm border border-gray-800/50 hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] hover:border-lime-500/30"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {/* Enhanced visual elements */}
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br from-lime-400/10 to-green-400/10 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Enhanced icon */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-lime-400 to-green-600 rounded-2xl flex items-center justify-center text-black mb-8 shadow-lg group-hover:shadow-lime-500/20 transition-all duration-300 transform group-hover:scale-110">
                  <div className="absolute inset-0.5 bg-gray-900 rounded-xl flex items-center justify-center">
                    <div className="text-lime-400 group-hover:text-lime-300 transition-colors">
                      {step.icon}
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-lime-400 transition-colors">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
                
                {/* <div className="mt-6 pt-4">
                  <div className="w-8 h-8 rounded-full bg-gray-800 group-hover:bg-lime-500/20 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lime-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div> */}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-16 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-950 to-transparent"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-lime-600/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Success <span className="text-lime-400">Stories</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Hear from professionals who found their dream jobs through our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                position: "Senior Software Engineer",
                company: "TechGlobal Inc.",
                quote: "The personalized job recommendations were spot on. I found my dream job at a tech giant within just three weeks!"
              },
              {
                name: "Michael Rodriguez",
                position: "Marketing Director",
                company: "CreativeMinds Agency",
                quote: "The interview preparation resources gave me the confidence I needed. The mock interviews helped me ace my actual interviews."
              },
              {
                name: "Aisha Patel",
                position: "Product Manager",
                company: "InnovateTech",
                quote: "I was able to showcase my skills with digital certificates that employers could verify instantly. This definitely gave me an edge."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 shadow-lg border border-gray-800"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {/* Quote symbol */}
                <div className="text-lime-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 9 7.558V11a1 1 0 0 0 1 1h2Zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 3 7.558V11a1 1 0 0 0 1 1h2Z" />
                  </svg>
                </div>

                <div className="mb-6">
                  {/* Star rating */}
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                      </svg>
                    ))}
                  </div>

                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                </div>

                <div className="flex items-center border-t border-gray-700 pt-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-600 rounded-full flex items-center justify-center mr-4 text-xl font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.position}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;