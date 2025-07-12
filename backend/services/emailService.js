const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log("Email init");

exports.sendOfferLetter = async (application, jobDetails, offerLetterPdf) => {
  console.log(`Offer to: ${application.email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: `Offer Letter for ${jobDetails.title}`,
      html: `<p>Dear ${application.name},</p>
             <p>Congratulations! We are pleased to offer you the position of ${jobDetails.title}.</p>
             <p>Please find attached your offer letter.</p>
             <p>Regards,<br>HR Team</p>`,
      attachments: [{
        filename: 'offer_letter.pdf',
        content: offerLetterPdf,
        contentType: 'application/pdf'
      }]
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Sent to: ${application.email} (from memory)`);
    return result;
  } catch (error) {
    console.error('Send failed:', error);
    throw error;
  }
};

exports.sendWelcomeEmail = async (candidateDetails) => {
  console.log(`Welcome to: ${candidateDetails.email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidateDetails.email,
      subject: 'Welcome to OM Softwares!',
      html: `<p>Dear ${candidateDetails.name},</p>
             <p>Welcome to OM Softwares! We're excited to have you join our team.</p>
             <p>Your onboarding process will begin shortly. Our HR team will reach out to you with further details.</p>
             <p>Regards,<br>HR Team<br>OM Softwares</p>`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Sent to: ${candidateDetails.email}`);
    return result;
  } catch (error) {
    console.error('Send failed:', error);
    throw error;
  }
};

exports.sendApplicationConfirmation = async (applicantDetails, jobTitle) => {
  console.log(`Confirm to: ${applicantDetails.email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: applicantDetails.email,
      subject: `Application Received for ${jobTitle}`,
      html: `<p>Dear ${applicantDetails.fullName},</p>
             <p>Thank you for applying for the position of ${jobTitle} at OM Softwares.</p>
             <p>We have received your application and will review it shortly. If your qualifications match our requirements, our HR team will contact you for the next steps.</p>
             <p>Regards,<br>HR Team<br>OM Softwares</p>`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Sent to: ${applicantDetails.email}`);
    return result;
  } catch (error) {
    console.error('Send failed:', error);
    throw error;
  }
};

// Contract-related email functions
exports.sendContractStatusUpdate = async (contractDetails, adminComments) => {
  console.log(`Contract status update to: ${contractDetails.email}`);
  try {
    const statusMessages = {
      'Under_Review': {
        subject: 'Contract Under Review',
        message: 'Your employment contract is currently under review by our HR team. We will notify you once the review is complete.'
      },
      'Approved': {
        subject: 'Contract Approved - Welcome to OM Softwares!',
        message: 'Congratulations! Your employment contract has been approved. Welcome to the OM Softwares team! Our HR team will contact you soon with your next steps and onboarding information.'
      },
      'Rejected': {
        subject: 'Contract Review Update',
        message: 'After reviewing your contract, we need to discuss some details with you. Please contact our HR team for further information.'
      },
      'Requires_Clarification': {
        subject: 'Contract Requires Clarification',
        message: 'We need some additional information or clarification regarding your employment contract. Please review the comments below and contact our HR team.'
      }
    };

    const statusInfo = statusMessages[contractDetails.status] || {
      subject: 'Contract Status Update',
      message: 'There has been an update to your employment contract status.'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contractDetails.email,
      subject: statusInfo.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">OM Softwares</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Human Resources Department</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">${statusInfo.subject}</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">Dear ${contractDetails.candidateName},</p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">${statusInfo.message}</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Contract Details:</h3>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Position:</strong> ${contractDetails.position}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Department:</strong> ${contractDetails.department}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Status:</strong> ${contractDetails.status.replace('_', ' ')}</p>
            </div>
            
            ${adminComments ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Comments from HR:</h3>
                <p style="color: #92400e; margin: 0; line-height: 1.6;">${adminComments}</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact our HR team at <a href="mailto:hr@omsoftwares.com" style="color: #2563eb;">hr@omsoftwares.com</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>HR Team</strong><br>
                OM Softwares
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Contract status email sent to: ${contractDetails.email}`);
    return result;
  } catch (error) {
    console.error('Failed to send contract status email:', error);
    throw error;
  }
};

exports.sendContractSubmissionConfirmation = async (contractDetails) => {
  console.log(`Contract submission confirmation to: ${contractDetails.email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contractDetails.email,
      subject: 'Contract Submitted Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">OM Softwares</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Human Resources Department</p>
            </div>
            
            <h2 style="color: #059669; margin-bottom: 20px;">✅ Contract Submitted Successfully</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">Dear ${contractDetails.candidateName},</p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Thank you for submitting your employment contract! We have successfully received all your information and documents.
            </p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
              <ul style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Our HR team will review your contract within 2-3 business days</li>
                <li>You will receive email updates on the review status</li>
                <li>Once approved, we'll send you onboarding information</li>
              </ul>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Contract Summary:</h3>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Position:</strong> ${contractDetails.position}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Department:</strong> ${contractDetails.department}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact our HR team at <a href="mailto:hr@omsoftwares.com" style="color: #2563eb;">hr@omsoftwares.com</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>HR Team</strong><br>
                OM Softwares
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Contract submission confirmation sent to: ${contractDetails.email}`);
    return result;
  } catch (error) {
    console.error('Failed to send contract submission confirmation:', error);
    throw error;
  }
};

// OTP Email Functions
exports.sendEmailVerificationOTP = async (email, otp, name) => {
  console.log(`Sending verification OTP to: ${email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - OM Softwares',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">OM Softwares</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Email Verification</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">Dear ${name || 'User'},</p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              To complete your registration, please use the following verification code:
            </p>
            
            <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <h1 style="color: #1f2937; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              This code will expire in 10 minutes for security reasons.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; line-height: 1.6;">
                <strong>Security Note:</strong> Never share this code with anyone. OM Softwares will never ask for your verification code.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>OM Softwares Team</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification OTP sent to: ${email}`);
    return result;
  } catch (error) {
    console.error('Failed to send verification OTP:', error);
    throw error;
  }
};

exports.sendPasswordResetOTP = async (email, otp, name) => {
  console.log(`Sending password reset OTP to: ${email}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - OM Softwares',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">OM Softwares</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Password Reset</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">Dear ${name || 'User'},</p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              You have requested to reset your password. Please use the following verification code:
            </p>
            
            <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <h1 style="color: #1f2937; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              This code will expire in 10 minutes for security reasons.
            </p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; line-height: 1.6;">
                <strong>Important:</strong> If you didn't request this password reset, please ignore this email and contact our support team immediately.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>OM Softwares Team</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Password reset OTP sent to: ${email}`);
    return result;
  } catch (error) {
    console.error('Failed to send password reset OTP:', error);
    throw error;
  }
};