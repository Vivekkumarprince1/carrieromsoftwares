const Contract = require("../models/offerContract");
const OfferLetter = require("../models/offerLetter");
const User = require("../models/user");
const { uploadFile, deleteImage } = require('../config/cloudinary');
const emailService = require('../services/emailService');

// Get offer letter for acceptance (public route)
const getOfferForAcceptance = async (req, res) => {
  console.log("Get offer for acceptance:", req.params.token);
  try {
    const { token } = req.params;
    
    const offerLetter = await OfferLetter.findOne({ 
      acceptanceToken: token,
      status: 'Pending'
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        message: "Offer not found or already processed",
        error: "OFFER_NOT_FOUND"
      });
    }
    
    console.log("Found offer letter:", offerLetter._id);
    
    // Check if offer is still valid
    if (new Date() > new Date(offerLetter.validUntil)) {
      return res.status(400).json({ 
        message: "This offer has expired",
        error: "OFFER_EXPIRED"
      });
    }
    
    // Check if contract already exists for this offer
    const existingContract = await Contract.findOne({ 
      offerLetterId: offerLetter._id 
    });
    
    res.status(200).json({
      offerLetter: {
        _id: offerLetter._id,
        candidateName: offerLetter.candidateName,
        email: offerLetter.email,
        position: offerLetter.position,
        department: offerLetter.department,
        salary: offerLetter.salary,
        startDate: offerLetter.startDate,
        joiningLocation: offerLetter.joiningLocation,
        workType: offerLetter.workType,
        benefits: offerLetter.benefits,
        reportingManager: offerLetter.reportingManager,
        validUntil: offerLetter.validUntil,
        companyName: offerLetter.companyName
      },
      hasExistingContract: !!existingContract,
      existingContract: existingContract
    });
    
  } catch (error) {
    console.error("Error getting offer for acceptance:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Accept offer and submit contract information
const acceptOffer = async (req, res) => {
  console.log("Accept offer:", req.params.token);
  try {
    const { token } = req.params;
    const contractData = req.body;
    
    const offerLetter = await OfferLetter.findOne({ 
      acceptanceToken: token,
      status: 'Pending'
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        message: "Offer not found or already processed" 
      });
    }
    
    // Check if offer is still valid
    if (new Date() > new Date(offerLetter.validUntil)) {
      return res.status(400).json({ 
        message: "This offer has expired" 
      });
    }
    
    // Create contract record with submitted data
    try {
      const contract = new Contract({
        offerLetterId: offerLetter._id,
        applicationId: offerLetter.applicationId,
        candidateName: offerLetter.candidateName,
        email: offerLetter.email,
        phone: contractData.phone,
        personalInfo: contractData.personalInfo,
        bankingInfo: contractData.bankingInfo,
        employmentDetails: {
          position: offerLetter.position,
          department: offerLetter.department,
          salary: offerLetter.salary,
          startDate: offerLetter.startDate,
          joiningLocation: offerLetter.joiningLocation,
          workType: offerLetter.workType,
          reportingManager: offerLetter.reportingManager
        },
        workflowStatus: {
          currentStage: 'submitted',
          submittedAt: new Date(),
          stages: {
            submitted: {
              completedAt: new Date(),
              completedBy: contractData.email
            }
          }
        },
        acceptanceComments: contractData.acceptanceComments,
        agreementTerms: contractData.agreementTerms
      });
      
      const savedContract = await contract.save();
      console.log("Created contract:", savedContract._id);
      
      // Link contract to offer letter
      offerLetter.contractId = savedContract._id;
      
    } catch (contractError) {
      console.error("Error creating contract:", contractError);
      // Continue with offer acceptance even if contract creation fails
    }
    
    // Update offer letter status
    offerLetter.status = 'Accepted';
    offerLetter.acceptedAt = new Date();
    await offerLetter.save();
    
    // Update user status if user exists
    const user = await User.findOne({ email: offerLetter.email });
    if (user && user.employeeStatus !== 'employee') {
      user.employeeStatus = 'offer_recipient';
      await user.save();
    }
    
    // Send confirmation email
    try {
      await emailService.sendContractSubmissionConfirmation({
        candidateName: offerLetter.candidateName,
        email: offerLetter.email,
        position: offerLetter.position,
        department: offerLetter.department,
        contractId: 'temp-' + Date.now() // Temporary ID
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the contract submission if email fails
    }
    
    res.status(201).json({
      message: "Offer accepted and contract submitted successfully!",
      contractId: savedContract._id,
      status: 'Accepted'
    });
    
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Reject offer
const rejectOffer = async (req, res) => {
  console.log("Reject offer:", req.params.token);
  try {
    const { token } = req.params;
    const { rejectionReason } = req.body;
    
    const offerLetter = await OfferLetter.findOne({ 
      acceptanceToken: token,
      status: 'Pending'
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        message: "Offer not found or already processed" 
      });
    }
    
    // Update offer letter status
    offerLetter.status = 'Rejected';
    offerLetter.rejectedAt = new Date();
    offerLetter.acceptanceComments = rejectionReason;
    await offerLetter.save();
    
    res.status(200).json({
      message: "Offer rejected successfully"
    });
    
  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Upload document for contract
const uploadContractDocument = async (req, res) => {
  console.log("Upload contract document:", req.params.contractId);
  try {
    const { contractId } = req.params;
    const { documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    
    // Upload file to Cloudinary
    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname);
    
    // Add document to contract
    contract.documents.push({
      documentType,
      fileName: req.file.originalname,
      fileUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId
    });
    
    await contract.save();
    
    res.status(200).json({
      message: "Document uploaded successfully",
      document: contract.documents[contract.documents.length - 1]
    });
    
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin: Get all contracts
const getAllContracts = async (req, res) => {
  console.log("Get all contracts");
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'employmentDetails.position': { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const contracts = await Contract.find(query)
      .populate('offerLetterId', 'companyName hrContactName hrContactEmail')
      .populate('reviewedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Contract.countDocuments(query);
    
    res.status(200).json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error("Error getting contracts:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin: Get contract by ID
const getContractById = async (req, res) => {
  console.log("Get contract by ID:", req.params.contractId);
  try {
    const { contractId } = req.params;
    
    const contract = await Contract.findById(contractId)
      .populate('offerLetterId')
      .populate('reviewedBy', 'name email');
    
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    
    res.status(200).json(contract);
    
  } catch (error) {
    console.error("Error getting contract:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin: Get contract by application ID
const getContractByApplicationId = async (req, res) => {
  console.log("Get contract by application ID:", req.params.applicationId);
  try {
    const { applicationId } = req.params;
    
    // Find offer letter by application ID
    const offerLetter = await OfferLetter.findOne({ applicationId });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        message: "No offer letter found for this application" 
      });
    }
    
    // Find contract by offer letter ID
    const contract = await Contract.findOne({ offerLetterId: offerLetter._id })
      .populate('offerLetterId');
    
    if (!contract) {
      return res.status(404).json({ 
        message: "No contract found for this application",
        offerLetter: offerLetter // Return the complete offer letter object
      });
    }
    
    res.status(200).json({
      contract,
      offerLetter: offerLetter // Return the complete offer letter object instead of just selected fields
    });
    
  } catch (error) {
    console.error("Error getting contract by application ID:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin: Update contract status
const updateContractStatus = async (req, res) => {
  console.log("Update contract status:", req.params.contractId);
  try {
    const { contractId } = req.params;
    const { status, adminComments } = req.body;
    
    const contract = await Contract.findById(contractId)
      .populate('offerLetterId');
    
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    
    const oldStatus = contract.status;
    contract.status = status;
    contract.adminComments = adminComments;
    contract.reviewedBy = req.user.userId;
    contract.reviewedAt = new Date();
    
    await contract.save();
    
    // Send status update email
    try {
      await emailService.sendContractStatusUpdate({
        candidateName: contract.candidateName,
        email: contract.email,
        position: contract.employmentDetails.position,
        department: contract.employmentDetails.department,
        status: status,
        contractId: contract._id
      }, adminComments);
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }
    
    // If approved, update user status to employee
    if (status === 'Approved' && oldStatus !== 'Approved') {
      const user = await User.findOne({ email: contract.email });
      if (user) {
        user.employeeStatus = 'employee';
        
        // Generate employee ID if not exists
        if (!user.employeeId) {
          const employeeCount = await User.countDocuments({ 
            employeeStatus: 'employee',
            employeeId: { $exists: true, $ne: null }
          });
          user.employeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`;
        }
        
        user.department = contract.employmentDetails.department;
        user.position = contract.employmentDetails.position;
        
        await user.save();
      }
    }
    
    res.status(200).json({
      message: "Contract status updated successfully",
      contract
    });
    
  } catch (error) {
    console.error("Error updating contract status:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Generate contract PDF
const generateContractPDF = async (req, res) => {
  console.log("Generate contract PDF:", req.params.contractId);
  try {
    const { contractId } = req.params;
    
    const contract = await Contract.findById(contractId)
      .populate('offerLetterId');
    
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    
    // Here you would implement PDF generation logic similar to offer letters
    // For now, return success
    res.status(200).json({
      message: "Contract PDF generation not yet implemented"
    });
    
  } catch (error) {
    console.error("Error generating contract PDF:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

module.exports = {
  getOfferForAcceptance,
  acceptOffer,
  rejectOffer,
  uploadContractDocument,
  getAllContracts,
  getContractById,
  getContractByApplicationId,
  updateContractStatus,
  generateContractPDF
};
