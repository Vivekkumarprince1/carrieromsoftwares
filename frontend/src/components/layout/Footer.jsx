import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gray-900 text-white pb-8 px-8 mt-6 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
         


          {/* Social Media Section */}
          <div className="lg:col-span-1">
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
              SOCIAL MEDIA
            </h3>
            <div className="space-y-4">
              <a 
                href="https://www.instagram.com/om_softwares/" 
                className="block text-xl font-light hover:text-lime-400 transition-colors duration-300"
              >
                INSTAGRAM..
              </a>
              <a 
                href="https://www.facebook.com/omsoftwares1/" 
                className="block text-xl font-light hover:text-lime-400 transition-colors duration-300"
              >
                FACEBOOK..
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6 mt-6">
              USEFUL LINKS
            </h3>
            <div className="space-y-4">
              <a 
                href="https://omsoftwares.in/about" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                About Us
              </a>
              <a 
                href="https://omsoftwares.in/contact" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Contact
              </a>
              <a 
                href="https://omsoftwares.in/services" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Other Services
              </a>
              <a 
                href="https://omsoftwares.in/faq" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                FAQs
              </a>
              <a 
                href="/verify" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Verify Certificate
              </a>
            </div>
          </div>
          </div>

          {/* Contact Info & Services Section */}
          <div className="lg:col-span-1 space-y-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
                CONTACT INFO
              </h3>
              <div className="space-y-4">
                <a 
                  href="tel:+916239862469" 
                  className="block text-xl font-light hover:text-lime-400 transition-colors duration-300 cursor-pointer"
                >
                  +91 62398-62469
                </a>
                <a 
                  href="mailto:omsoftwareandtechnologies@gmail.com" 
                  className="block text-xl font-light hover:text-lime-400 transition-colors duration-300 cursor-pointer"
                >
                  <span className="hidden sm:inline">omsoftwareandtechnologies@gmail.com</span>
                  <span className="sm:hidden">Email Us</span>
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
                SERVICES
              </h3>
              <div className="space-y-4 flex flex-col">
                <a 
                  href='https://omsoftwares.in/social-media-management' 
                  className="text-lg font-light hover:text-lime-400 transition-colors duration-300"
                >
                  Social Media Management
                </a>
                <a 
                  href='https://omsoftwares.in/web-development' 
                  className="text-lg font-light hover:text-lime-400 transition-colors duration-300"
                >
                  Web Development
                </a>
                <a 
                  href='https://omsoftwares.in/visual-branding' 
                  className="text-lg font-light hover:text-lime-400 transition-colors duration-300"
                >
                  Visual Branding
                </a>
                <a 
                  href='https://omsoftwares.in/digital-marketing' 
                  className="text-lg font-light hover:text-lime-400 transition-colors duration-300"
                >
                  Digital Marketing
                </a>
              </div>
            </div>
          </div>
           {/* Logo Section */}
         
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="relative">
                <a href="https://omsoftwares.in/contact">
              <div 
                className="h-[22rem] w-[22rem] sm:h-[18rem] sm:w-[18rem] md:h-[20rem] md:w-[20rem] lg:h-[22rem] lg:w-[22rem] bg-lime-400 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-lime-400/30 hover:-translate-y-2 transform-gpu"
                onClick={scrollToTop}
              >
                <div className="text-center">
                  <div className="absolute top-16 right-10 sm:top-14 sm:right-8 md:top-16 md:right-10 lg:top-20 lg:right-12 transition-transform duration-300 hover:rotate-45">
                    <ArrowUpRight className="w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-900" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-wide">
                    PING US
                  </h2>
                </div>
              </div>
              </a>
            </div>
          </div>
        </div>
        

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              Copyright © 2020-2025 <a href="https://omsoftwares.in/" className="text-white">Om Softwares</a>. All rights reserved.
            </p>
            <div className="flex space-x-8">
              <a 
                href="https://omsoftwares.in/terms" 
                className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
              >
                Terms and Conditions
              </a>
              <a 
                href="https://omsoftwares.in/terms" 
                className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;