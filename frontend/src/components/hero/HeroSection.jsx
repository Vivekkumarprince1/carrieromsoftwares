import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, threshold: 0.1 });
  
  // Track mouse movement for parallax effect with improved performance
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Throttle the mouse movement updates for better performance
      window.requestAnimationFrame(() => {
        setMousePosition({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        });
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Trigger the counter animation after component mounts with a staggered effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // Enhanced particle configuration with more variety
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 10 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.3,
    color: [
      'rgba(255, 255, 255, 0.8)',
      'rgba(163, 230, 53, 0.7)',
      'rgba(134, 239, 172, 0.7)',
      'rgba(250, 204, 21, 0.7)',
      'rgba(96, 165, 250, 0.7)'
    ][Math.floor(Math.random() * 5)]
  }));

  // Animated counter hook with improved smoothness
  const useCounter = (end, duration = 2.5) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!isVisible) return;
      
      let startTime;
      const startValue = 0;
      
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        // Use easeOutExpo for smoother counting effect
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        const value = Math.floor(easeOutExpo * (end - startValue) + startValue);
        
        setCount(value);
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    }, [end, duration, isVisible]);
    
    return count;
  };

  const activeJobsCount = useCounter(10000);
  const companiesCount = useCounter(2500);
  const successRateCount = useCounter(85);

  // Text animation variants
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  return (
    <div ref={ref} className="relative w-full h-screen overflow-hidden min-h-[650px]">
      {/* Enhanced Background Image with Advanced Parallax Effect */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: "url('/images/istockphoto-973718370-612x612.webp')",
          backgroundPosition: `${50 + mousePosition.x * 15}% ${50 + mousePosition.y * 15}%`
        }}
        initial={{ scale: 1.3, filter: "blur(8px)" }}
        animate={{ 
          scale: 1, 
          filter: "blur(0px)",
          x: mousePosition.x * -25,
          y: mousePosition.y * -25
        }}
        transition={{ 
          scale: { duration: 2, ease: "easeOut" },
          filter: { duration: 2.2, ease: "easeOut" },
          x: { duration: 0.2, ease: "linear" },
          y: { duration: 0.2, ease: "linear" }
        }}
      />
      
      {/* Enhanced Background Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/90 z-5"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-transparent z-6"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-emerald-900/20 to-transparent z-6"></div>
      
      {/* Animated Particles with enhanced effects */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full z-7"
          style={{ 
            width: `${particle.size}px`, 
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.size/2}px ${particle.color}`
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, particle.id % 2 === 0 ? 20 : -20, 0],
            opacity: [0, particle.opacity, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Enhanced Decorative Shapes with more dynamic animations */}
      <motion.div 
        className="absolute bottom-[15%] left-[5%] w-[180px] h-[180px] bg-gradient-to-br from-lime-400 to-green-500 bg-opacity-70 backdrop-blur-3xl rounded-[50%_60%_70%_40%_/_40%_50%_60%_50%] z-10 md:w-[200px] md:h-[200px] sm:w-[100px] sm:h-[100px]"
        style={{ boxShadow: "0 0 60px rgba(163, 230, 53, 0.6)" }}
        animate={{ 
          y: [0, -30, 0],
          rotate: [0, 8, 0],
          scale: [1, 1.08, 1],
          borderRadius: ['50% 60% 70% 40% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '50% 60% 70% 40% / 40% 50% 60% 50%']
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute top-[15%] right-[8%] w-[140px] h-[140px] bg-gradient-to-tr from-lime-400 to-emerald-500 bg-opacity-70 backdrop-blur-3xl rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] z-10 md:w-[160px] md:h-[160px] sm:w-[80px] sm:h-[80px]"
        style={{ boxShadow: "0 0 50px rgba(163, 230, 53, 0.6)" }}
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, -12, 0],
          scale: [1, 1.15, 1],
          borderRadius: ['60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 40% 70% 30% 60%', '60% 40% 30% 70% / 60% 30% 70% 40%']
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Enhanced floating elements with more dynamic movements */}
      <motion.div 
        className="absolute top-[35%] left-[15%] w-[60px] h-[60px] bg-gradient-to-r from-yellow-400 to-amber-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block"
        style={{ boxShadow: "0 0 30px rgba(250, 204, 21, 0.7)" }}
        animate={{ 
          y: [0, -25, 0],
          x: [0, 15, 0],
          scale: [1, 0.85, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.div 
        className="absolute bottom-[30%] right-[20%] w-[40px] h-[40px] bg-gradient-to-r from-blue-400 to-sky-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block"
        style={{ boxShadow: "0 0 25px rgba(96, 165, 250, 0.7)" }}
        animate={{ 
          y: [0, 25, 0],
          x: [0, -15, 0],
          scale: [1, 1.2, 1],
          rotate: [0, -180, -360]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      />
      
      {/* Added more floating elements with enhanced animations */}
      <motion.div 
        className="absolute top-[60%] right-[30%] w-[25px] h-[25px] bg-gradient-to-r from-purple-400 to-violet-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block"
        style={{ boxShadow: "0 0 20px rgba(167, 139, 250, 0.7)" }}
        animate={{ 
          y: [0, -15, 0],
          x: [0, -10, 0],
          scale: [1, 1.3, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      <motion.div 
        className="absolute top-[20%] left-[35%] w-[15px] h-[15px] bg-gradient-to-r from-pink-400 to-rose-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block"
        style={{ boxShadow: "0 0 15px rgba(251, 113, 133, 0.7)" }}
        animate={{ 
          y: [0, 12, 0],
          x: [0, 12, 0],
          scale: [1, 1.4, 1],
          rotate: [0, 45, 0]
        }}
        transition={{ 
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Additional floating elements for more visual interest */}
      <motion.div 
        className="absolute top-[45%] right-[15%] w-[20px] h-[20px] bg-gradient-to-r from-teal-400 to-cyan-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block hidden sm:block"
        style={{ boxShadow: "0 0 18px rgba(45, 212, 191, 0.7)" }}
        animate={{ 
          y: [0, -18, 0],
          x: [0, 8, 0],
          scale: [1, 1.25, 1],
          rotate: [0, 60, 0]
        }}
        transition={{ 
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
      
      <motion.div 
        className="absolute bottom-[40%] left-[25%] w-[30px] h-[30px] bg-gradient-to-r from-orange-400 to-red-500 bg-opacity-70 backdrop-blur-xl rounded-full z-10 md:block hidden sm:block"
        style={{ boxShadow: "0 0 22px rgba(251, 146, 60, 0.7)" }}
        animate={{ 
          y: [0, 20, 0],
          x: [0, -10, 0],
          scale: [1, 0.9, 1],
          rotate: [0, -120, 0]
        }}
        transition={{ 
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2
        }}
      />
      
      {/* Content with enhanced animations */}
      <div className="relative z-20 flex items-center justify-center h-full">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatePresence>
              {isInView && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 1, 
                    delay: 0.3,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="space-y-6"
                >
                  <motion.h1 
                    className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 text-white leading-tight"
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-green-300 to-emerald-500 animate-text-shimmer">Dream Career</span> Today
                  </motion.h1>
                  
                  {/* <motion.p 
                    className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto"
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    Connect with thousands of employers looking for talented professionals just like you
                  </motion.p> */}
                </motion.div>
              )}
            </AnimatePresence>
            
            
            
            {/* Enhanced Stats Counter with animations */}
            <motion.div 
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.9,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <motion.div 
                className="text-center p-5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                  borderColor: "rgba(163, 230, 53, 0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                <h3 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-lime-400 via-green-300 to-emerald-500 bg-clip-text text-transparent">
                  {activeJobsCount.toLocaleString()}+
                </h3>
                <p className="text-white text-sm md:text-base mt-2">Active Jobs</p>
              </motion.div>
              
              <motion.div 
                className="text-center p-5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                  borderColor: "rgba(163, 230, 53, 0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                <h3 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-lime-400 via-green-300 to-emerald-500 bg-clip-text text-transparent">
                  {companiesCount.toLocaleString()}+
                </h3>
                <p className="text-white text-sm md:text-base mt-2">Companies</p>
              </motion.div>
              
              <motion.div 
                className="text-center p-5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                  borderColor: "rgba(163, 230, 53, 0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                <h3 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-lime-400 via-green-300 to-emerald-500 bg-clip-text text-transparent">
                  {successRateCount}%
                </h3>
                <p className="text-white text-sm md:text-base mt-2">Success Rate</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Add subtle light rays effect */}
      <div className="absolute inset-0 z-4 overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-gradient-radial from-lime-300/20 via-transparent to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroSection;