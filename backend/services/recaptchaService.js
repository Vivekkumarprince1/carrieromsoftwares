const axios = require('axios');

class RecaptchaService {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
    this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  }

  async verifyToken(token, remoteIP = null) {
    if (!this.secretKey) {
      console.warn('reCAPTCHA secret key not configured');
      return { success: false, error: 'reCAPTCHA not configured' };
    }

    if (!token) {
      return { success: false, error: 'reCAPTCHA token is required' };
    }

    // Allow bypass for test keys in development
    if (this.secretKey === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
      console.warn('Using test reCAPTCHA key - bypassing verification for development');
      return { success: true, score: 0.9 };
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', token);
      
      if (remoteIP) {
        params.append('remoteip', remoteIP);
      }

      const response = await axios.post(this.verifyUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 second timeout
      });

      const result = response.data;
      
      if (result.success) {
        return { success: true, score: result.score };
      } else {
        console.error('reCAPTCHA verification failed:', result['error-codes']);
        return { 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: result['error-codes']
        };
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error.message);
      return { 
        success: false, 
        error: 'Failed to verify reCAPTCHA'
      };
    }
  }

  // Middleware for Express routes
  async middleware(req, res, next) {
    const token = req.body.recaptchaToken;
    const remoteIP = req.ip || req.connection.remoteAddress;

    const verification = await this.verifyToken(token, remoteIP);
    
    if (!verification.success) {
      return res.status(400).json({
        message: 'reCAPTCHA verification failed',
        error: verification.error
      });
    }

    // Attach verification result to request for further use
    req.recaptchaVerification = verification;
    next();
  }
}

module.exports = new RecaptchaService();
