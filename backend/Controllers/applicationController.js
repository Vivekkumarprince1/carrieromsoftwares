const Application = require("../models/application");
const Job = require("../models/job");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const resumeParserService = require("../services/resumeParserService");
const recaptchaService = require("../services/recaptchaService");
const { uploadFile, uploadQuestionFile, deleteImage } = require('../config/cloudinary');

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// User application
exports.createApplication = async (req, res) => {
  console.log("App: auth user");
  try {
    const { 
      jobId, 
      fullName, 
      email, 
      phone, 
      experience, 
      education, 
      skills, 
      coverLetter,
      isReferred,
      referrerEmployeeId,
      referrerName,
      referrerEmail,
      referralMessage,
      recaptchaToken
    } = req.body;
    let questionAnswers = req.body.questionAnswers;
    
    // Verify reCAPTCHA
    const remoteIP = req.ip || req.connection.remoteAddress;
    const recaptchaVerification = await recaptchaService.verifyToken(recaptchaToken, remoteIP);
    
    if (!recaptchaVerification.success) {
      console.log("reCAPTCHA verification failed:", recaptchaVerification.error);
      return res.status(400).json({ 
        message: "reCAPTCHA verification failed. Please try again.",
        error: recaptchaVerification.error
      });
    }
    
    console.log("reCAPTCHA verified successfully");
    
    // Validate phone number
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }
    
    // Parse JSON answers
    if (questionAnswers && typeof questionAnswers === 'string') {
      try {
        console.log("Parsing JSON");
        questionAnswers = JSON.parse(questionAnswers);
      } catch (parseError) {
        console.error("Parse err:", parseError);
        return res.status(400).json({ message: "Invalid question answers format" });
      }
    }
    
    const job = await Job.findById(jobId);

    if (!job || !job.isActive) {
      console.log("Inactive job:", jobId);
      return res.status(404).json({ message: "Job not found or no longer active" });
    }

    // Validate referrer if referral is provided
    // if (isReferred && referrerEmployeeId) {
    //   console.log(`Application: checking referrer ${referrerEmployeeId}`);
    //   const referrer = await User.findOne({ 
    //     employeeId: referrerEmployeeId,
    //     employeeStatus: "employee"
    //   });
      
    //   if (!referrer) {
    //     console.log(`Application: invalid referrer ID ${referrerEmployeeId}`);
    //     return res.status(400).json({ 
    //       message: "Invalid employee ID. Please verify the employee ID with your referrer." 
    //     });
    //   }
      
    //   // Verify referrer name and email match if provided
    //   if (referrerName && referrer.name.toLowerCase() !== referrerName.toLowerCase()) {
    //     return res.status(400).json({ 
    //       message: "Referrer name does not match our records. Please check the details." 
    //     });
    //   }
      
    //   if (referrerEmail && referrer.email.toLowerCase() !== referrerEmail.toLowerCase()) {
    //     return res.status(400).json({ 
    //       message: "Referrer email does not match our records. Please check the details." 
    //     });
    //   }
      
    //   console.log(`Application: valid referrer found ${referrer.name}`);
    // }

    // Handle resume upload to Cloudinary
    let resumeData = {};
    if (req.file) {
      console.log("Uploading resume to Cloudinary...");
      console.log(`File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
      
      let uploadAttempt = 0;
      const maxRetries = 3;
      
      while (uploadAttempt < maxRetries) {
        try {
          // Upload directly from buffer to Cloudinary
          const cloudinaryResult = await uploadFile(
            req.file.buffer, 
            'resumes', 
            'raw', 
            req.file.originalname
          );
          
          // Store Cloudinary URL and public ID
          resumeData = {
            resumeUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id
          };
          console.log("Resume uploaded to Cloudinary:", cloudinaryResult.secure_url);
          break; // Success, exit retry loop
          
        } catch (uploadError) {
          uploadAttempt++;
          console.error(`Cloudinary upload attempt ${uploadAttempt} failed:`, uploadError.message);
          
          if (uploadAttempt >= maxRetries) {
            console.error("All upload attempts failed");
            return res.status(500).json({ 
              message: "Failed to upload resume after multiple attempts", 
              error: uploadError.message 
            });
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * uploadAttempt));
        }
      }
    }

    const applicationData = {
      jobId,
      userId: req.user.userId,
      fullName,
      email,
      phone,
      experience,
      education,
      skills: typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills,
      coverLetter,
      ...resumeData,
      // Add referral data if provided
      ...(isReferred && {
        isReferred: true,
        referrerEmployeeId,
        referrerName,
        referrerEmail,
        referralMessage
      }),
      // Add answers
      ...(questionAnswers && { questionAnswers }),
    };

    const application = await new Application(applicationData).save();
    console.log("Saved:", application._id);

    res.status(201).json({ message: "Application submitted successfully", applicationId: application._id });
  } catch (error) {
    handleError(res, error, "createApp");
  }
};

// Public application
exports.submitApplication = async (req, res) => {
  console.log("App: public");
  try {
    const { jobId, fullName, email, phone, experience, education, skills, coverLetter } = req.body;
    let questionAnswers = req.body.questionAnswers;
    
    // Parse JSON answers
    if (questionAnswers && typeof questionAnswers === 'string') {
      try {
        console.log("Parsing JSON");
        questionAnswers = JSON.parse(questionAnswers);
      } catch (parseError) {
        console.error("Parse err:", parseError);
        return res.status(400).json({ message: "Invalid question answers format" });
      }
    }
    
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      console.log("Inactive job:", jobId);
      return res.status(404).json({ message: "Job not found or no longer active" });
    }
    
    // Handle resume upload to Cloudinary
    let resumeData = {};
    if (req.file) {
      console.log("Uploading resume to Cloudinary...");
      console.log(`File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
      
      let uploadAttempt = 0;
      const maxRetries = 3;
      
      while (uploadAttempt < maxRetries) {
        try {
          // Upload directly from buffer to Cloudinary
          const cloudinaryResult = await uploadFile(
            req.file.buffer, 
            'resumes', 
            'raw', 
            req.file.originalname
          );
          
          // Store Cloudinary URL and public ID
          resumeData = {
            resumeUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id
          };
          console.log("Resume uploaded to Cloudinary:", cloudinaryResult.secure_url);
          break; // Success, exit retry loop
          
        } catch (uploadError) {
          uploadAttempt++;
          console.error(`Cloudinary upload attempt ${uploadAttempt} failed:`, uploadError.message);
          
          if (uploadAttempt >= maxRetries) {
            console.error("All upload attempts failed");
            return res.status(500).json({ 
              message: "Failed to upload resume after multiple attempts", 
              error: uploadError.message 
            });
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * uploadAttempt));
        }
      }
    }
    
    const applicationData = {
      jobId,
      fullName,
      email,
      phone,
      experience,
      education,
      skills: skills || [],
      coverLetter,
      ...resumeData,
      // Add answers
      ...(questionAnswers && { questionAnswers }),
    };
    
    const application = await new Application(applicationData).save();
    console.log("Saved:", application._id);
    
    res.status(201).json({ 
      message: "Application submitted successfully", 
      applicationId: application._id 
    });
    
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Upload file for question
exports.uploadQuestionFile = async (req, res) => {
  console.log("Upload: file");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    console.log(`Uploading question file: ${req.file.originalname}`);
    console.log(`File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
    
    let uploadAttempt = 0;
    const maxRetries = 3;
    
    while (uploadAttempt < maxRetries) {
      try {
        // Upload directly from buffer to Cloudinary using the uploadQuestionFile function
        const cloudinaryResult = await uploadQuestionFile(
          req.file.buffer,
          'question-files',
          null,
          req.file.originalname,
          req.file.mimetype
        );
        
        console.log("Question file uploaded to Cloudinary:", cloudinaryResult.secure_url);
        
        res.status(200).json({ 
          message: "File uploaded successfully", 
          fileUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          originalName: req.file.originalname
        });
        return; // Success, exit function
        
      } catch (uploadError) {
        uploadAttempt++;
        console.error(`Question file upload attempt ${uploadAttempt} failed:`, uploadError.message);
        
        if (uploadAttempt >= maxRetries) {
          console.error("All question file upload attempts failed");
          return res.status(500).json({ 
            message: "Failed to upload file after multiple attempts", 
            error: uploadError.message 
          });
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * uploadAttempt));
      }
    }
  } catch (error) {
    handleError(res, error, "uploadFile");
  }
};

// Update answers
exports.updateApplicationAnswers = async (req, res) => {
  console.log("Update: answers");
  try {
    const { applicationId } = req.params;
    const { questionAnswers } = req.body;

    if (!questionAnswers || !Array.isArray(questionAnswers)) {
      return res.status(400).json({ message: "Invalid question answers format" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update answers
    application.questionAnswers = questionAnswers;
    application.updatedAt = Date.now();
    await application.save();

    res.status(200).json({ 
      message: "Application answers updated successfully", 
      applicationId: application._id 
    });
  } catch (error) {
    handleError(res, error, "updateAnswers");
  }
};

// Parse resume
exports.parseResume = async (req, res) => {
  console.log("Parse: resume");
  try {
    if (!req.file) return res.status(400).json({ message: "No resume file provided" });

    const fileExt = path.extname(req.file.originalname).substring(1).toLowerCase();
    
    // Check format
    if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
      return res.status(400).json({ 
        message: "Unsupported file type. Please upload PDF, DOC, or DOCX files only." 
      });
    }

    // Create a temporary file path for parsing
    const tempFilePath = path.join(__dirname, '..', 'temp', `parse-${Date.now()}-${req.file.originalname}`);
    
    try {
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write buffer to temporary file for parsing
      fs.writeFileSync(tempFilePath, req.file.buffer);
    
      // Parse using buffer directly instead of file path
      try {
        const extractedData = await resumeParserService.parseResume(req.file.buffer, req.file.mimetype, req.file.originalname);
        console.log("Parsed OK");
        
        // Check if parsing was successful
        if (!extractedData.success) {
          throw new Error(extractedData.error || 'Failed to parse resume');
        }
        
        // Clean up temporary file
        fs.unlinkSync(tempFilePath);
        
        // Extract the parsed data structure
        const parsedData = extractedData.data;
        
        // Log the raw extracted data to help with debugging
        console.log("Raw extracted data types:", {
          personalInfo: typeof parsedData.personalInfo,
          education: typeof parsedData.education,
          experience: typeof parsedData.experience,
          skills: typeof parsedData.skills
        });
        
        // Format data for frontend
        const formattedData = {
          fullName: parsedData.personalInfo?.name || '',
          email: parsedData.personalInfo?.email || '',
          phone: parsedData.personalInfo?.phone || '',
          skills: Array.isArray(parsedData.skills) && parsedData.skills.length > 0 
            ? parsedData.skills.join(', ') 
            : parsedData.skillsText || '',
          education: Array.isArray(parsedData.education) && parsedData.education.length > 0
            ? formatEducationArray(parsedData.education)
            : parsedData.educationText || '',
          experience: Array.isArray(parsedData.experience) && parsedData.experience.length > 0
            ? formatExperienceArray(parsedData.experience)
            : parsedData.experienceText || '',
          address: parsedData.personalInfo?.location || '',
          yearsOfExperience: parsedData.yearsOfExperience || 0
        };
        
        // Log what was successfully extracted
        const extractedFields = [];
        if (formattedData.fullName) extractedFields.push('name');
        if (formattedData.email) extractedFields.push('email');
        if (formattedData.phone) extractedFields.push('phone');
        if (formattedData.skills) extractedFields.push('skills');
        if (formattedData.education) extractedFields.push('education');
        if (formattedData.experience) extractedFields.push('experience');
        
        console.log("Formatted data for frontend:", {
          extractedFields: extractedFields,
          phone: formattedData.phone || 'Not found',
          email: formattedData.email || 'Not found',
          skills: typeof formattedData.skills === 'string' ? 
            (formattedData.skills.length > 100 ? formattedData.skills.substring(0, 100) + '...' : formattedData.skills) : 
            'Not available',
          education: typeof formattedData.education === 'string' ? 
            (formattedData.education.length > 100 ? formattedData.education.substring(0, 100) + '...' : formattedData.education) : 
            'Not available',
          experience: typeof formattedData.experience === 'string' ? 
            (formattedData.experience.length > 100 ? formattedData.experience.substring(0, 100) + '...' : formattedData.experience) : 
            'Not available'
        });
        
        // Add metadata about what was extracted
        formattedData.extractionSummary = {
          fieldsExtracted: extractedFields,
          totalFields: extractedFields.length
        };
        
        res.status(200).json(formattedData);
      } catch (parseError) {
        console.error("Parse issue:", parseError.message);
        console.error(parseError.stack);
        
        // Clean up temporary file if it exists
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        // Return empty
        res.status(200).json({ 
          message: "Resume processed with limited success.",
          fullName: '',
          email: '',
          phone: '',
          skills: '',
          education: '',
          experience: ''
        });
      }
    } catch (fileError) {
      console.error("File handling error:", fileError);
      return res.status(500).json({ 
        message: "Failed to process resume file", 
        error: fileError.message 
      });
    }
  } catch (error) {
    console.error("Error:", error);
    console.error(error.stack);
    res.status(500).json({ 
      message: "Failed to parse resume", 
      error: error.message,
      fullName: '',
      email: '',
      phone: '',
      skills: '',
      education: '',
      experience: ''
    });
  }
};

// Format education data for frontend
const formatEducation = (education) => {
  if (!education) return '';
  
  // Handle string input (backward compatibility)
  if (typeof education === 'string') {
    // If it's already a string, check if it has content
    if (education.trim().length === 0) return '';
    
    // Log the education string for debugging
    console.log('Education string format:', education.substring(0, 100));
    return education;
  }
  
  // Handle array input
  if (Array.isArray(education)) {
    console.log('Education array format, items:', education.length);
    
    if (education.length === 0) return '';
    
    return education.map(edu => {
      let formattedEdu = '';
      
      if (edu.degree) formattedEdu += `Degree: ${edu.degree}\n`;
      if (edu.institution) formattedEdu += `Institution: ${edu.institution}\n`;
      if (edu.year) formattedEdu += `Year: ${edu.year}\n`;
      if (edu.score) formattedEdu += `Score: ${edu.score}\n`;
      
      // If we have a plain object with no recognized fields, try to extract text
      if (formattedEdu.length === 0 && typeof edu === 'object') {
        // Try to extract any text content from the object
        const values = Object.values(edu).filter(v => v && typeof v === 'string');
        formattedEdu = values.join('\n');
      }
      
      // If edu is a string, use it directly
      if (typeof edu === 'string') {
        formattedEdu = edu;
      }
      
      return formattedEdu;
    }).join('\n\n'); // Double newline for better separation
  }
  
  return '';
};

// Format experience data for frontend
const formatExperience = (experience) => {
  if (!experience) return '';
  
  // Handle string input (backward compatibility)
  if (typeof experience === 'string') {
    // If it's already a string, check if it has content
    if (experience.trim().length === 0) return '';
    
    // Log the experience string for debugging
    console.log('Experience string format:', experience.substring(0, 100));
    return experience;
  }
  
  // Handle array input
  if (Array.isArray(experience)) {
    console.log('Experience array format, items:', experience.length);
    
    if (experience.length === 0) return '';
    
    return experience.map(exp => {
      let formattedExp = '';
      
      if (exp.role) formattedExp += `Role: ${exp.role}\n`;
      if (exp.company) formattedExp += `Company: ${exp.company}\n`;
      if (exp.period) formattedExp += `Period: ${exp.period}\n`;
      if (exp.description) formattedExp += `Description: ${exp.description}\n`;
      
      // If we have a plain object with no recognized fields, try to extract text
      if (formattedExp.length === 0 && typeof exp === 'object') {
        // Try to extract any text content from the object
        const values = Object.values(exp).filter(v => v && typeof v === 'string');
        formattedExp = values.join('\n');
      }
      
      // If exp is a string, use it directly
      if (typeof exp === 'string') {
        formattedExp = exp;
      }
      
      return formattedExp;
    }).join('\n\n'); // Double newline for better separation
  }
  
  return '';
};

// Format education array for frontend
const formatEducationArray = (education) => {
  if (!Array.isArray(education) || education.length === 0) return '';
  
  return education.map(edu => {
    let formattedEdu = '';
    
    if (edu.degree) formattedEdu += `Degree: ${edu.degree}\n`;
    if (edu.institution) formattedEdu += `Institution: ${edu.institution}\n`;
    if (edu.year) formattedEdu += `Year: ${edu.year}\n`;
    if (edu.gpa) formattedEdu += `GPA: ${edu.gpa}\n`;
    
    // If we have a plain object with no recognized fields, try to extract text
    if (formattedEdu.length === 0 && typeof edu === 'object') {
      const values = Object.values(edu).filter(v => v && typeof v === 'string');
      formattedEdu = values.join('\n');
    }
    
    // If edu is a string, use it directly
    if (typeof edu === 'string') {
      formattedEdu = edu;
    }
    
    return formattedEdu.trim();
  }).filter(edu => edu.length > 0).join('\n\n');
};

// Format experience array for frontend
const formatExperienceArray = (experience) => {
  if (!Array.isArray(experience) || experience.length === 0) return '';
  
  return experience.map(exp => {
    let formattedExp = '';
    
    if (exp.title) formattedExp += `Title: ${exp.title}\n`;
    if (exp.company) formattedExp += `Company: ${exp.company}\n`;
    if (exp.duration) formattedExp += `Duration: ${exp.duration}\n`;
    if (exp.description) formattedExp += `Description: ${exp.description}\n`;
    
    // If we have a plain object with no recognized fields, try to extract text
    if (formattedExp.length === 0 && typeof exp === 'object') {
      const values = Object.values(exp).filter(v => v && typeof v === 'string');
      formattedExp = values.join('\n');
    }
    
    // If exp is a string, use it directly
    if (typeof exp === 'string') {
      formattedExp = exp;
    }
    
    return formattedExp.trim();
  }).filter(exp => exp.length > 0).join('\n\n');
};

// Get user applications
exports.getMyApplications = async (req, res) => {
  console.log("Get: my apps");
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .populate("jobId", "title company description location salary type")
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    handleError(res, error, "getMyApps");
  }
};

// Get all applications
exports.getAllApplications = async (_req, res) => {
  console.log("Get: all apps");
  try {
    const applications = await Application.find()
      .populate("jobId", "title company location salary type description requirements")
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    handleError(res, error, "getAllApps");
  }
};

// Get job applications
exports.getJobApplications = async (req, res) => {
  console.log("Get: job apps", req.params.jobId);
  try {
    // Get apps for job
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("jobId", "title company location salary type description requirements questions")
      .sort({ createdAt: -1 });
    
    console.log(`Found: ${applications.length}`);
    res.status(200).json(applications);
  } catch (error) {
    handleError(res, error, "getJobApps");
  }
};

// Get application detail
exports.getApplicationDetail = async (req, res) => {
  console.log("Get: app", req.params.id);
  try {
    const application = await Application.findById(req.params.id)
      .populate("jobId", "title company location salary type description requirements questions")
      .populate("offerLetterId");
    
    if (!application) {
      console.log(`Not found: ${req.params.id}`);
      return res.status(404).json({ message: "Application not found" });
    }
    
    console.log(`Found: ${req.params.id}`);
    res.status(200).json(application);
  } catch (error) {
    handleError(res, error, "getAppDetail");
  }
};

// Helper function to generate unique employee ID
const generateEmployeeId = async () => {
  const prefix = "EMP";
  let isUnique = false;
  let employeeId;
  
  while (!isUnique) {
    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    employeeId = `${prefix}${randomNum}`;
    
    // Check if this ID already exists
    const existingUser = await User.findOne({ employeeId });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return employeeId;
};

// Update status
exports.updateApplicationStatus = async (req, res) => {
  console.log("Update: status", req.params.id);
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('userId', 'name email employeeStatus employeeId');

    if (!application) return res.status(404).json({ message: "Application not found" });

    // Update user employeeStatus based on application status if user exists
    if (application.userId) {
      const user = application.userId;
      let newEmployeeStatus = user.employeeStatus; // Default to current status
      
      // Map application status to user employeeStatus
      switch(status) {
        case "hired":
          newEmployeeStatus = "employee";
          break;
        case "offered":
          newEmployeeStatus = "offer_recipient";
          break;
        case "pending":
        case "reviewing":
        case "shortlisted":
          newEmployeeStatus = "applicant";
          break;
        case "rejected":
          // Keep current status, don't downgrade from employee or offer_recipient
          if (user.employeeStatus === "applicant") {
            newEmployeeStatus = "applicant";
          }
          break;
      }
      
      // Only update if the status is changing
      if (user.employeeStatus !== newEmployeeStatus) {
        const updateData = {
          employeeStatus: newEmployeeStatus
        };
        
        // Generate and assign employee ID if user is becoming an employee and doesn't have an ID
        if (newEmployeeStatus === "employee" && !user.employeeId) {
          updateData.employeeId = await generateEmployeeId();
          console.log(`Generated employee ID: ${updateData.employeeId} for user: ${user.name}`);
        }
        
        await User.findByIdAndUpdate(user._id, updateData);
        console.log(`Updated user ${user.name} from ${user.employeeStatus} to ${newEmployeeStatus} status${updateData.employeeId ? ` with ID: ${updateData.employeeId}` : ''}`);
      }
    }

    res.status(200).json({ message: "Application status updated successfully", application });
  } catch (error) {
    handleError(res, error, "updateStatus");
  }
};

// Generate offer
exports.generateOfferLetter = async (req, res) => {
  console.log("Gen: offer", req.params.applicationId);
  try {
    const { applicationId } = req.params;
    const { 
      offerDetails, 
      position, 
      department, 
      salary, 
      startDate, 
      joiningLocation, 
      workType, 
      benefits, 
      reportingManager, 
      hrContactName, 
      hrContactEmail, 
      hrContactPhone, 
      validUntil, 
      additionalNotes 
    } = req.body;

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate('userId', 'name email employeeStatus');
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Import OfferLetter model
    const OfferLetter = require("../models/offerLetter");

    // Create offer letter record with application data and provided details
    const offerLetterData = {
      userId: req.user.userId, // Admin who issued the offer
      applicationId: applicationId, // Link to application
      candidateName: application.fullName,
      email: application.email,
      position: position || application.jobId.title,
      department: department || application.jobId.department || 'General',
      salary: salary || 50000, // Default salary, should be provided
      startDate: startDate ? new Date(startDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      joiningLocation: joiningLocation || 'To be determined',
      workType: workType || 'On-site',
      benefits: benefits || [],
      reportingManager: reportingManager || '',
      hrContactName: hrContactName || 'HR Team',
      hrContactEmail: hrContactEmail || process.env.EMAIL_USER,
      hrContactPhone: hrContactPhone || '',
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      additionalNotes: additionalNotes || offerDetails || '',
      acceptanceToken: crypto.randomBytes(32).toString('hex') // Generate acceptance token
    };

    const offerLetter = new OfferLetter(offerLetterData);
    const savedOfferLetter = await offerLetter.save();
    console.log(`Created offer letter: ${savedOfferLetter._id}`);

    // Link offer letter to application
    application.status = "offered";
    application.offerLetterId = savedOfferLetter._id;
    await application.save();

    // Update user employeeStatus to offer_recipient if user exists
    if (application.userId) {
      const user = application.userId;
      
      // Only update if user is not already an employee or offer_recipient
      if (user.employeeStatus !== "employee" && user.employeeStatus !== "offer_recipient") {
        await User.findByIdAndUpdate(user._id, { employeeStatus: "offer_recipient" });
        console.log(`Updated user ${user.name} from ${user.employeeStatus} to offer_recipient status`);
      }
    }

    console.log(`Offer letter created and linked to application ${applicationId}`);
    res.status(200).json({ 
      message: "Offer letter generated and stored successfully",
      offerLetterId: savedOfferLetter._id
    });
  } catch (error) {
    handleError(res, error, "genOffer");
  }
};

// Get offer letter for application
exports.getApplicationOfferLetter = async (req, res) => {
  console.log("Get application offer letter:", req.params.applicationId);
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('offerLetterId');
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (!application.offerLetterId) {
      return res.status(404).json({ message: "No offer letter found for this application" });
    }

    res.status(200).json(application.offerLetterId);
  } catch (error) {
    handleError(res, error, "getApplicationOfferLetter");
  }
};

// Get my application offer letter (for candidates)
exports.getMyApplicationOfferLetter = async (req, res) => {
  console.log("Get my application offer letter:", req.params.applicationId, "by user:", req.user.userId);
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId; // Fixed: use userId instead of id

    // Find the application and verify it belongs to the current user
    const application = await Application.findOne({ 
      _id: applicationId, 
      userId: userId 
    }).populate('offerLetterId');
    
    if (!application) {
      return res.status(404).json({ message: "Application not found or you don't have permission to access it" });
    }

    if (!application.offerLetterId) {
      return res.status(404).json({ message: "No offer letter found for this application" });
    }

    res.status(200).json(application.offerLetterId);
  } catch (error) {
    handleError(res, error, "getMyApplicationOfferLetter");
  }
};

// Send welcome
exports.sendWelcomeEmail = async (req, res) => {
  console.log("Send: welcome", req.params.applicationId);
  try {
    const { applicationId } = req.params;
    const { welcomeMessage } = req.body;

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email employeeStatus employeeId');
    if (!application) return res.status(404).json({ message: "Application not found" });

    await sendEmail(application.email, "Welcome!", `
      <h2>Welcome ${application.fullName}!</h2>
      <p>${welcomeMessage || "We're thrilled to have you join us!"}</p>
    `);

    // Update application status to hired
    application.status = "hired";
    await application.save();

    // Update user employeeStatus based on application status if user exists
    if (application.userId) {
      const user = application.userId;
      
      // Only update if user is not already an employee
      if (user.employeeStatus !== "employee") {
        const updateData = {
          employeeStatus: "employee"
        };
        
        // Generate and assign employee ID if user doesn't have one
        if (!user.employeeId) {
          updateData.employeeId = await generateEmployeeId();
          console.log(`Generated employee ID: ${updateData.employeeId} for user: ${user.name}`);
        }
        
        await User.findByIdAndUpdate(user._id, updateData);
        console.log(`Updated user ${user.name} from ${user.employeeStatus} to employee status${updateData.employeeId ? ` with ID: ${updateData.employeeId}` : ''}`);
      }
    }

    res.status(200).json({ message: "Welcome email sent" });
  } catch (error) {
    handleError(res, error, "sendWelcome");
  }
};

// Send rejection
exports.rejectApplication = async (req, res) => {
  console.log("Send: reject", req.params.applicationId);
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const application = await Application.findById(applicationId)
      .populate('userId', 'name email employeeStatus');
    if (!application) return res.status(404).json({ message: "Application not found" });

    await sendEmail(application.email, "Application Status", `
      <h2>Dear ${application.fullName},</h2>
      <p>Thank you for your interest and applying.</p>
      <p>After review, we've decided not to proceed with your application.</p>
      <p>${rejectionReason}</p>
      <p>We appreciate your interest and wish you success in your job search.</p>
      <p>Regards,<br>HR Department</p>
    `);

    application.status = "rejected";
    await application.save();

    // Note: We don't downgrade employeeStatus if the user is already an employee or offer_recipient
    // This is handled in the updateApplicationStatus method

    res.status(200).json({ message: "Rejection email sent" });
  } catch (error) {
    handleError(res, error, "sendReject");
  }
};

// Get applications available for recommendation (employee access)
exports.getApplicationsForRecommendation = async (req, res) => {
  console.log("Get: apps for recommendation");
  try {
    const currentUserId = req.user.userId || req.user._id; // Fixed: use userId instead of id
    
    // Find applications that don't have recommendations yet and are not submitted by the current user
    const applications = await Application.find({
      status: { $in: ['pending', 'under_review'] }, // Only pending/under review applications
      recommendationId: { $exists: false }, // No existing recommendation
      userId: { $ne: currentUserId } // Exclude applications submitted by the current user
    })
    .populate("jobId", "title company location department")
    .select("_id fullName email jobId status createdAt userId")
    .sort({ createdAt: -1 });
    
    console.log(`Found ${applications.length} applications available for recommendation (excluding own applications)`);
    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    handleError(res, error, "getAppsForRecommendation");
  }
};

// Parse resume and extract data
exports.parseResume = async (req, res) => {
  console.log("Resume parsing request");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    // Save the uploaded file temporarily for parsing
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    console.log(`Processing resume: ${req.file.originalname}`);
    console.log(`MIME type: ${req.file.mimetype}`);

    // Parse the resume using buffer directly
    const parseResult = await resumeParserService.parseResume(req.file.buffer, req.file.mimetype, req.file.originalname);

    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!parseResult.success) {
      console.error("Resume parsing failed:", parseResult.error);
      return res.status(500).json({ 
        message: "Failed to parse resume", 
        error: parseResult.error 
      });
    }

    console.log("Resume parsed successfully");
    
    // Return the parsed data with the correct structure
    res.status(200).json({
      message: "Resume parsed successfully",
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        originalText: parseResult.originalText,
        parsedData: parseResult.data,
        extractedInfo: {
          // Simplified extracted info for easy frontend consumption
          personalInfo: parseResult.data.personalInfo,
          skills: parseResult.data.skills,
          experience: parseResult.data.experience,
          education: parseResult.data.education,
          summary: parseResult.data.summary,
          projects: parseResult.data.projects,
          certifications: parseResult.data.certifications
        }
      }
    });

  } catch (error) {
    console.error("Error in parseResume:", error);
    
    // Clean up temp file on error
    if (req.file) {
      const tempFilePath = path.join(__dirname, "../temp", `${Date.now()}_${req.file.originalname}`);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
    
    res.status(500).json({ 
      message: "Server error during resume parsing", 
      error: error.message 
    });
  }
};

// Helper functions

async function sendEmail(to, subject, htmlContent, attachmentPath = null) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
    ...(attachmentPath && { attachments: [{ filename: "Attachment.pdf", path: attachmentPath }] }),
  };
  await transporter.sendMail(mailOptions);
}

// Create offer PDF in memory - returns Buffer instead of saving to file
async function createOfferPDFInMemory(application, offerDetails) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      // Collect PDF data in memory
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log(`PDF generated in memory for: ${application.fullName}`);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      doc.fontSize(25).text("Offer Letter", { align: "center" }).moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`).moveDown();
      doc.text(`Dear ${application.fullName},`).moveDown();
      doc.text(`We're pleased to offer you ${application.jobId.title} at OM Softwares.`).moveDown();
      doc.text(offerDetails).moveDown(2);
      doc.text("Sincerely,\nHR Department\nOM Softwares");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Send email with PDF buffer attachment
async function sendEmailWithPDFBuffer(to, subject, htmlContent, pdfBuffer, filename) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };
  await transporter.sendMail(mailOptions);
}

function handleError(res, error, funcName) {
  console.error(`Error in ${funcName}:`, error.message);
  res.status(500).json({ message: "Server error", error: error.message });
}
