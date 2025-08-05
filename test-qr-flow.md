# QR Code Certificate Verification Flow Test

## Changes Made:

### 1. Updated PDF Service (pdfService.js)
- Changed QR code URL from: `careers.omsoftwares.in/verify/#${certificateData.certificateId}`
- To: `https://careers.omsoftwares.in/verify/${certificateData.certificateId}`

### 2. Updated VerifyCertificate Page
- Added support for route parameter extraction using `useParams()`
- Added backward compatibility for hash-based URLs using `useLocation()`
- Passes certificate ID as prop to VerifyForm component

### 3. Updated VerifyForm Component
- Added `certificateId` prop support
- Added auto-verification when certificate ID is provided via props
- Added visual feedback when certificate ID is detected from QR code
- Refactored verification logic to be reusable

## Testing Flow:

1. **QR Code Generation**: 
   - New certificates will generate QR codes with URL: `https://careers.omsoftwares.in/verify/{certificate_id}`

2. **QR Code Scanning**:
   - User scans QR code → redirects to `/verify/{certificate_id}`
   - VerifyCertificate page extracts `certificate_id` from URL parameter
   - Passes certificate ID to VerifyForm as prop

3. **Auto-Verification**:
   - VerifyForm receives certificate ID as prop
   - Auto-fills the input field with certificate ID
   - Automatically calls verification API
   - Shows blue info banner indicating QR code detection
   - Displays verification results

4. **Backward Compatibility**:
   - Old QR codes with hash format (`/verify#certificate_id`) still work
   - Page checks both route parameter and hash fragment

## Expected User Experience:

1. User scans QR code on certificate
2. Browser opens verification page
3. Blue banner shows "Certificate ID detected from QR code. Verifying automatically..."
4. Input field is pre-filled with certificate ID
5. Verification happens automatically
6. Results are displayed immediately (success or error)

## Manual Testing:

1. Visit: `https://careers.omsoftwares.in/verify/TEST123`
2. Should auto-fill "TEST123" and verify automatically

3. Visit: `https://careers.omsoftwares.in/verify#TEST456` 
4. Should auto-fill "TEST456" and verify automatically (backward compatibility)

5. Visit: `https://careers.omsoftwares.in/verify`
6. Should show empty form for manual entry
