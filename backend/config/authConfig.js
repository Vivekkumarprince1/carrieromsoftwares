// Backend configuration for JWT and authentication settings
require('dotenv').config();

const authConfig = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecretKey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtCookieExpiresInDays: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4001, // Changed from 4000 to 4001 to avoid port conflict
  
  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/careers',
  
  // Email Configuration
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};

// Helper functions
const isDevelopment = () => authConfig.nodeEnv === 'development';
const isProduction = () => authConfig.nodeEnv === 'production';

// Convert JWT expiry string to milliseconds for consistency
const parseJWTExpiryToMs = (expiryString) => {
  if (!expiryString) return 24 * 60 * 60 * 1000; // Default 1 day
  
  const unit = expiryString.slice(-1).toLowerCase();
  const value = parseInt(expiryString.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000; // Default 1 day
  }
};

// Get cookie max age in milliseconds
const getCookieMaxAge = () => {
  return authConfig.jwtCookieExpiresInDays * 24 * 60 * 60 * 1000;
};

// Get JWT expiry in milliseconds
const getJWTExpiryMs = () => {
  return parseJWTExpiryToMs(authConfig.jwtExpiresIn);
};

// Validate configuration
const validateConfig = () => {
  const required = [
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET, sensitive: true },
    { key: 'MONGO_URI', value: process.env.MONGO_URI },
  ];
  
  const missing = required.filter(item => !item.value);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(item => {
      console.error(`   - ${item.key}`);
    });
    process.exit(1);
  }
  
  if (isDevelopment()) {
    console.log('🔧 Authentication Configuration:');
    console.log(`   - JWT Expires In: ${authConfig.jwtExpiresIn}`);
    console.log(`   - Cookie Expires In: ${authConfig.jwtCookieExpiresInDays} days`);
    console.log(`   - Environment: ${authConfig.nodeEnv}`);
    console.log(`   - Port: ${authConfig.port}`);
  }
};

module.exports = {
  authConfig,
  isDevelopment,
  isProduction,
  getCookieMaxAge,
  getJWTExpiryMs,
  validateConfig,
  parseJWTExpiryToMs,
};
