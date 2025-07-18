# reCAPTCHA Setup Guide

The application is currently using test reCAPTCHA keys which don't work in production. Follow these steps to set up proper reCAPTCHA integration.

## Current Issue
- **Error**: "reCAPTCHA not configured"
- **Cause**: Using Google's test keys that don't work in production environments
- **Impact**: Job applications cannot be submitted successfully

## Quick Fix (Temporary)
The system has been temporarily modified to bypass reCAPTCHA validation when using test keys for development purposes.

## Proper Setup (Production)

### 1. Get Real reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Fill in the form:
   - **Label**: Your site name (e.g., "OM Softwares Careers")
   - **reCAPTCHA type**: Choose "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `your-domain.com` (your production domain)
     - `careers.omsoftwares.in` (if this is your production domain)
4. Accept the Terms of Service
5. Click "Submit"

### 2. Get Your Keys

After creating the site, you'll get:
- **Site Key** (starts with `6Le...`): Used in frontend
- **Secret Key** (starts with `6Le...`): Used in backend

### 3. Update Environment Variables

#### Backend (.env file)
```bash
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_actual_secret_key_here
```

#### Frontend (.env file)
```bash
# reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your_actual_site_key_here
```

### 4. Restart Your Application

After updating the environment variables:
1. Stop your development servers
2. Restart both backend and frontend
3. Test the application form

## Testing

1. Go to your application form
2. Fill out the form completely
3. Complete the reCAPTCHA challenge
4. Submit the application
5. You should see: "Application submitted successfully!"

## Current Test Keys (TO BE REPLACED)

**These are Google's universal test keys and should NOT be used in production:**

- Site Key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret Key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

## Troubleshooting

### Common Issues:

1. **"reCAPTCHA not configured"**
   - Check that `RECAPTCHA_SECRET_KEY` is set in backend/.env
   - Ensure you're not using the test key in production

2. **"Invalid site key"**
   - Verify `VITE_RECAPTCHA_SITE_KEY` in frontend/.env
   - Check that your domain is added to the reCAPTCHA site configuration

3. **"Invalid domain"**
   - Add your domain to the reCAPTCHA site configuration
   - For localhost development, make sure "localhost" is in the domains list

4. **reCAPTCHA not loading**
   - Check browser console for JavaScript errors
   - Verify internet connection
   - Try clearing browser cache

### Verification Commands:

```bash
# Check if environment variables are loaded (backend)
node -e "console.log('Secret Key:', process.env.RECAPTCHA_SECRET_KEY)"

# Check if environment variables are loaded (frontend - during build)
npm run build
```

## Security Notes

- Never commit actual reCAPTCHA keys to version control
- Use different keys for development and production environments
- Regularly rotate your secret keys if needed
- Monitor reCAPTCHA usage in Google Admin Console

## Support

If you continue to have issues:
1. Check the browser console for errors
2. Check server logs for reCAPTCHA verification errors
3. Verify your keys are correctly set in the environment files
4. Ensure both frontend and backend servers are restarted after updating environment variables
