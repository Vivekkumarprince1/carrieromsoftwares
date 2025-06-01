const Application = require("../models/application");
const Job = require("../models/job");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const resumeParserService = require("../services/resumeParserService");

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
      ...(req.file && {
        resume: req.file.path,
        resumeUrl: `/uploads/resumes/${req.file.filename}`,
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

    const applicationData = {
      jobId,
      fullName,
      email,
      phone,
      experience,
      education,
      skills: skills || [],
      coverLetter,
      ...(req.file && { resume: req.file.path }),
      // Add answers
      ...(questionAnswers && { questionAnswers }),
    };

    const application = await new Application(applicationData).save();
    console.log("Saved:", application._id);

    res.status(201).json({ message: "Application submitted successfully", applicationId: application._id });
  } catch (error) {
    handleError(res, error, "submitApp");
  }
};

// Upload file for question
exports.uploadQuestionFile = async (req, res) => {
  console.log("Upload: file");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Get paths
    const filePath = req.file.path;
    const fileUrl = `/uploads/question-files/${req.file.filename}`;
    
    res.status(200).json({ 
      message: "File uploaded successfully", 
      filePath, 
      fileUrl 
    });
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
    
    // Parse
    try {
      const extractedData = await resumeParserService.parseResume(req.file.path, fileExt);
      console.log("Parsed OK");
      
      // Format data
      const formattedData = {
        fullName: extractedData.name || '',
        email: extractedData.email || '',
        phone: extractedData.phone || '',
        skills: Array.isArray(extractedData.skills?.all) 
          ? extractedData.skills.all.join(', ')
          : (extractedData.skills || ''),
        education: formatEducation(extractedData.education),
        experience: formatExperience(extractedData.experience),
        address: extractedData.address || ''
      };
      
      res.status(200).json(formattedData);
    } catch (parseError) {
      console.error("Parse issue:", parseError.message);
      
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
  } catch (error) {
    console.error("Error:", error);
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

// Format education
function formatEducation(educationData) {
  if (!educationData || !Array.isArray(educationData) || educationData.length === 0) {
    return '';
  }
  
  return educationData.map(edu => {
    const parts = [];
    if (edu.degree) parts.push(edu.degree);
    if (edu.institution) parts.push(edu.institution);
    if (edu.year) parts.push(`(${edu.year})`);
    if (edu.score) parts.push(`- ${edu.score}`);
    
    return parts.join(' ');
  }).join('\n\n');
}

// Format experience
function formatExperience(experienceData) {
  if (!experienceData || !Array.isArray(experienceData) || experienceData.length === 0) {
    return '';
  }
  
  return experienceData.map(exp => {
    const parts = [];
    if (exp.role) parts.push(exp.role);
    if (exp.company) parts.push(`at ${exp.company}`);
    if (exp.period) parts.push(`(${exp.period})`);
    
    let result = parts.join(' ');
    if (exp.description) {
      result += `\n${exp.description}`;
    }
    
    return result;
  }).join('\n\n');
}

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
      .populate("jobId", "title company location salary type description requirements questions");
    
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

// Update status
exports.updateApplicationStatus = async (req, res) => {
  console.log("Update: status", req.params.id);
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!application) return res.status(404).json({ message: "Application not found" });

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
    const { offerDetails } = req.body;

    const application = await Application.findById(applicationId).populate("jobId");
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Generate PDF in memory instead of saving to file
    const pdfBuffer = await createOfferPDFInMemory(application, offerDetails);

    application.status = "offered";
    await application.save();

    // Send email with PDF from memory
    await sendEmailWithPDFBuffer(application.email, "Job Offer", `
      <h2>Congrats ${application.fullName}!</h2>
      <p>We're excited to offer you ${application.jobId.title}.</p>
      <p>See attached offer.</p>
    `, pdfBuffer, `${application.fullName}_offer_letter.pdf`);

    console.log(`Offer letter sent to ${application.email} without permanent storage`);
    res.status(200).json({ message: "Offer letter sent successfully" });
  } catch (error) {
    handleError(res, error, "genOffer");
  }
};

// Send welcome
exports.sendWelcomeEmail = async (req, res) => {
  console.log("Send: welcome", req.params.applicationId);
  try {
    const { applicationId } = req.params;
    const { welcomeMessage } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    await sendEmail(application.email, "Welcome!", `
      <h2>Welcome ${application.fullName}!</h2>
      <p>${welcomeMessage || "We're thrilled to have you join us!"}</p>
    `);

    application.status = "hired";
    await application.save();

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

    const application = await Application.findById(applicationId);
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

    res.status(200).json({ message: "Rejection email sent" });
  } catch (error) {
    handleError(res, error, "sendReject");
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
