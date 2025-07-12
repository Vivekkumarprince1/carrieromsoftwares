import React from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CareerBanner = () => {
  const navigate = useNavigate();

  const handleViewOpenings = () => {
    navigate('/jobs');
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden" 
         style={{ backgroundImage: 'url(/images/output.jpg)' }}>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
      
      {/* Main content container */}
      <div className="relative z-10 flex items-center lg:items-end justify-center lg:justify-start min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:pb-32">
        <div className="max-w-7xl w-full mx-auto">
          
          {/* Content positioned responsively */}
          <div className="text-white max-w-3xl lg:max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6">
              Career <span className="text-lime-400 block sm:inline">With OM Softwares</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl leading-relaxed opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Join the innovative team at OM Softwares, where technology meets creativity. 
              We're building the future of software solutions and looking for passionate 
              individuals who share our vision. Be part of a company that values innovation, 
              collaboration, and professional growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start justify-center lg:justify-start">
              
              <button 
                onClick={handleViewOpenings}
                className="group bg-transparent border-2 border-white hover:bg-white hover:text-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                VIEW OPENINGS
              </button>
            </div>
          </div>

          {/* Animated elements positioned responsively */}
          <div className="hidden lg:block absolute top-1/4 right-8 xl:right-16">
            {/* Paper plane animation */}
            <div className="animate-pulse">
              <div className="text-4xl xl:text-6xl opacity-80">✈️</div>
            </div>
          </div>

          {/* Mobile decorative elements */}
          <div className="lg:hidden absolute top-8 right-4">
            <div className="animate-pulse">
              <div className="text-3xl opacity-60">✈️</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom section with chairs - responsive */}
      <div className="absolute bottom-0 right-0 z-10">
        <div className="pb-2 sm:pb-4 md:pb-8">
          <img 
            src="/images/chairs.png" 
            alt="Chair" 
            className="h-20 sm:h-32 md:h-40 lg:h-52 object-contain transform hover:scale-105 transition-transform duration-300" 
          />
        </div>
      </div>
      
      {/* View Current Openings button - now integrated into main CTA on mobile */}
      
      {/* Floating elements for extra visual appeal - responsive */}
      <div className="absolute top-1/4 left-4 sm:left-8 animate-bounce delay-1000">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full opacity-70"></div>
      </div>
      <div className="absolute top-1/3 right-1/4 animate-pulse delay-500">
        <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-400 rounded-full opacity-50"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/4 animate-bounce delay-700 hidden sm:block">
        <div className="w-3 h-3 bg-red-400 rounded-full opacity-60"></div>
      </div>
      
      {/* Additional floating elements for better visual balance */}
      <div className="absolute top-1/2 left-4 animate-pulse delay-300 hidden lg:block">
        <div className="w-2 h-2 bg-lime-400 rounded-full opacity-80"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-bounce delay-1200 hidden lg:block">
        <div className="w-5 h-5 bg-purple-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default CareerBanner;