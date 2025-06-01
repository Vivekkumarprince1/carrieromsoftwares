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