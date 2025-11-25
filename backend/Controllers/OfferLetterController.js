const OfferLetter = require("../models/offerLetter");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Email setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.issueOfferLetter = async (req, res) => {
    console.log("OfferLetter: new");
    try {
        const { 
            candidateName, 
            email, 
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
        
        console.log(`For: ${candidateName}`);

        if (!candidateName || !email || !position || !department || !salary || !startDate || !joiningLocation || !validUntil) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        const userId = req.user.userId;
        console.log(`Issuer: ${userId}`);

        console.log("Creating offer letter");
        const offerLetter = new OfferLetter({
            userId,
            candidateName,
            email,
            position,
            department,
            salary,
            startDate: new Date(startDate),
            joiningLocation,
            workType: workType || 'On-site',
            benefits: benefits || [],
            reportingManager,
            hrContactName,
            hrContactEmail,
            hrContactPhone,
            validUntil: new Date(validUntil),
            additionalNotes
        });

        const savedOfferLetter = await offerLetter.save();
        console.log(`Saved: ${savedOfferLetter._id}`);

        res.status(201).json({
            message: "Offer letter issued successfully",
            offerLetterId: savedOfferLetter._id,
            offerLetterUrl: `/offer-letters/${savedOfferLetter._id}.pdf`
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllOfferLetters = async (req, res) => {
    console.log("OfferLetters: all");
    try {
        const offerLetters = await OfferLetter.find().populate("userId", "name email").sort({ createdAt: -1 });
        console.log(`Found: ${offerLetters.length}`);
        res.status(200).json(offerLetters);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getOfferLetterById = async (req, res) => {
    console.log(`Get offer letter: ${req.params.id}`);
    try {
        const offerLetterId = req.params.id;

        console.log(`Finding: ${offerLetterId}`);
        const offerLetter = await OfferLetter.findById(offerLetterId).populate("userId", "name email");

        if (!offerLetter) {
            console.log(`Not found: ${offerLetterId}`);
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Found: ${offerLetter.candidateName}`);
        res.status(200).json(offerLetter);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateOfferLetterStatus = async (req, res) => {
    console.log(`Update offer letter status: ${req.params.id}`);
    try {
        const { status } = req.body;
        const offerLetterId = req.params.id;

        if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const offerLetter = await OfferLetter.findByIdAndUpdate(
            offerLetterId,
            { status },
            { new: true }
        );

        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        res.status(200).json({
            message: "Offer letter status updated successfully",
            offerLetter
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.extendOfferLetter = async (req, res) => {
    console.log(`Extend offer letter: ${req.params.id}`);
    try {
        const { newValidUntil, newStartDate, additionalNotes } = req.body;
        const offerLetterId = req.params.id;

        if (!newValidUntil) {
            return res.status(400).json({ message: "New valid until date is required" });
        }

        // Find the offer letter
        const offerLetter = await OfferLetter.findById(offerLetterId);

        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        // Check if offer letter is accepted
        if (offerLetter.status !== 'Accepted') {
            return res.status(400).json({ message: "Only accepted offer letters can be extended" });
        }

        // Validate new dates
        const newValidDate = new Date(newValidUntil);
        const currentValidDate = new Date(offerLetter.validUntil);

        if (newValidDate <= currentValidDate) {
            return res.status(400).json({ message: "New valid until date must be after the current valid until date" });
        }

        // If new start date is provided, validate it
        if (newStartDate) {
            const newStartDateObj = new Date(newStartDate);
            if (newStartDateObj >= newValidDate) {
                return res.status(400).json({ message: "New start date must be before the new valid until date" });
            }
        }

        // Update the offer letter
        const updateData = {
            validUntil: newValidDate,
            updatedAt: new Date()
        };

        if (newStartDate) {
            updateData.startDate = new Date(newStartDate);
        }

        if (additionalNotes) {
            updateData.additionalNotes = additionalNotes;
        }

        const updatedOfferLetter = await OfferLetter.findByIdAndUpdate(
            offerLetterId,
            updateData,
            { new: true }
        ).populate("userId", "name email");

        console.log(`Offer letter extended successfully for: ${updatedOfferLetter.candidateName}`);

        res.status(200).json({
            message: "Offer letter extended successfully",
            offerLetter: updatedOfferLetter
        });
    } catch (error) {
        console.error("Error extending offer letter:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.downloadOfferLetter = async (req, res) => {
    console.log(`Download request for offer letter: ${req.params.id}`);
    try {
        const offerLetterId = req.params.id;
        
        const offerLetter = await OfferLetter.findById(offerLetterId);
        
        if (!offerLetter) {
            console.log(`Offer letter not found: ${offerLetterId}`);
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Generating PDF in memory for: ${offerLetter.candidateName}`);
        
        const filename = `offer-letter-${offerLetterId}.pdf`;

        // Generate PDF in memory
        const pdfBuffer = await generateOfferLetterPDFInMemory(offerLetter);

        // Send file directly from memory
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.end(pdfBuffer);
        console.log(`PDF sent directly from memory: ${filename}`);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.sendOfferLetterEmail = async (req, res) => {
    console.log(`Send offer letter email: ${req.params.id}`);
    try {
        const offerLetterId = req.params.id;
        const { recipientEmail } = req.body;
        
        const offerLetter = await OfferLetter.findById(offerLetterId);
        
        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Generating PDF in memory for email to: ${recipientEmail || offerLetter.email}`);

        // Generate acceptance token if not already exists
        if (!offerLetter.acceptanceToken) {
            offerLetter.acceptanceToken = crypto.randomBytes(32).toString('hex');
            await offerLetter.save();
        }

        const filename = `offer-letter-${offerLetterId}.pdf`;

        // Generate PDF in memory
        const pdfBuffer = await generateOfferLetterPDFInMemory(offerLetter);

        const emailRecipient = recipientEmail || offerLetter.email;
        const acceptanceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/offer-acceptance/${offerLetter.acceptanceToken}`;

        // Determine if this is an internship
        const isInternship = offerLetter.salary === 0 || 
                           (offerLetter.position && offerLetter.position.toLowerCase().includes('intern'));

        // Format date
        const formatEmailDate = (date) => {
            return new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailRecipient,
            subject: isInternship 
                ? `Internship Offer - ${offerLetter.position} at ${offerLetter.companyName || 'OM Softwares'}`
                : `Job Offer - ${offerLetter.position} at ${offerLetter.companyName || 'OM Softwares'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin-bottom: 10px;">🎉 Congratulations ${offerLetter.candidateName}!</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">We are excited to extend this ${isInternship ? 'internship' : 'job'} offer to you</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 24px;">${isInternship ? '📄 Internship Overview' : 'Job Offer Details'}</h2>
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                            <p style="margin: 5px 0;"><strong>Position:</strong> ${offerLetter.position}</p>
                            <p style="margin: 5px 0;"><strong>Department:</strong> ${offerLetter.department}</p>
                            ${isInternship 
                                ? `<p style="margin: 5px 0;"><strong>Stipend:</strong> ${offerLetter.salary === 0 ? 'Unpaid' : '$' + offerLetter.salary.toLocaleString()}</p>`
                                : `<p style="margin: 5px 0;"><strong>Annual Salary:</strong> $${offerLetter.salary.toLocaleString()}</p>`
                            }
                            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${formatEmailDate(offerLetter.startDate)}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> ${offerLetter.joiningLocation}</p>
                            <p style="margin: 5px 0;"><strong>Work Type:</strong> ${offerLetter.workType}</p>
                            ${isInternship ? '<p style="margin: 5px 0;"><strong>Certificate:</strong> Issued upon successful completion</p>' : ''}
                        </div>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong> This offer is valid until <strong>${formatEmailDate(offerLetter.validUntil)}</strong></p>
                    </div>
                    
                    ${isInternship ? `
                    <div style="background-color: #e7f3ff; border: 1px solid #b6d7ff; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="margin: 0; color: #0066cc;">By accepting this offer, you agree to our terms at omsoftwares.in/terms, including confidentiality, performance expectations, and code ownership.</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <h3 style="color: #2c3e50; margin-bottom: 20px;">📋 Next Steps</h3>
                        <p style="color: #5d6d7e; margin-bottom: 25px;">Please review the attached ${isInternship ? 'internship' : 'offer'} letter and respond using the link below:</p>
                        
                        <a href="${acceptanceUrl}" 
                           style="display: inline-block; background: linear-gradient(45deg, #56ab2f, #a8e6cf); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(86, 171, 47, 0.3); transition: transform 0.3s ease;">
                            🚀 Review & Respond to ${isInternship ? 'Internship' : 'Offer'}
                        </a>
                        
                        <p style="color: #7f8c8d; font-size: 12px; margin-top: 15px;">
                            Can't click the button? Copy and paste this link:<br>
                            <span style="word-break: break-all;">${acceptanceUrl}</span>
                        </p>
                        
                        ${isInternship ? `
                        <div style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 8px;">
                            <p style="color: #333; margin: 0;"><strong>For Internship Acceptance:</strong><br>
                            Please reply with: "I accept the offer and agree to the terms and conditions."</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
                        <h4 style="color: #2c3e50; margin-top: 0;">📞 Have Questions?</h4>
                        <p style="color: #5d6d7e; margin-bottom: 10px;">Feel free to reach out to our HR team:</p>
                        <p style="margin: 5px 0; color: #2c3e50;"><strong>Contact:</strong> ${offerLetter.hrContactName || 'HR Team'}</p>
                        ${offerLetter.hrContactEmail ? `<p style="margin: 5px 0; color: #2c3e50;"><strong>Email:</strong> ${offerLetter.hrContactEmail}</p>` : ''}
                        ${offerLetter.hrContactPhone ? `<p style="margin: 5px 0; color: #2c3e50;"><strong>Phone:</strong> ${offerLetter.hrContactPhone}</p>` : ''}
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                        <p style="color: #7f8c8d; margin: 0;">We look forward to welcoming you to our team!</p>
                        <p style="color: #2c3e50; font-weight: bold; margin: 10px 0 0 0;">
                            Warm regards,<br>
                            ${offerLetter.hrContactName || 'HR Team'}<br>
                            ${offerLetter.companyName || 'OM Softwares'}
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Offer letter emailed with acceptance link to: ${emailRecipient}`);
        
        res.status(200).json({ 
            message: "Offer letter sent successfully with acceptance link",
            sentTo: emailRecipient,
            acceptanceUrl: acceptanceUrl
        });

    } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({ message: "Error sending email", error: error.message });
    }
};

// Regenerate acceptance token for offer letter
exports.regenerateAcceptanceToken = async (req, res) => {
    console.log("Regenerate acceptance token for offer letter:", req.params.id);
    try {
        const { id } = req.params;
        
        const offerLetter = await OfferLetter.findById(id);
        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }
        
        // Generate new acceptance token
        offerLetter.acceptanceToken = crypto.randomBytes(32).toString('hex');
        await offerLetter.save();
        
        console.log(`Generated new acceptance token for offer letter ${id}`);
        
        res.status(200).json({
            message: "Acceptance token regenerated successfully",
            acceptanceToken: offerLetter.acceptanceToken
        });
        
    } catch (error) {
        console.error("Error regenerating acceptance token:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Utility function to add acceptance tokens to all offer letters that don't have them
exports.addAcceptanceTokensToExisting = async (req, res) => {
    console.log("Adding acceptance tokens to existing offer letters");
    try {
        // Find all offer letters without acceptance tokens
        const offerLettersWithoutTokens = await OfferLetter.find({
            $or: [
                { acceptanceToken: { $exists: false } },
                { acceptanceToken: null },
                { acceptanceToken: "" }
            ]
        });
        
        console.log(`Found ${offerLettersWithoutTokens.length} offer letters without acceptance tokens`);
        
        let updatedCount = 0;
        for (const offerLetter of offerLettersWithoutTokens) {
            offerLetter.acceptanceToken = crypto.randomBytes(32).toString('hex');
            await offerLetter.save();
            updatedCount++;
        }
        
        res.status(200).json({
            message: `Added acceptance tokens to ${updatedCount} offer letters`,
            updatedCount: updatedCount,
            totalFound: offerLettersWithoutTokens.length
        });
        
    } catch (error) {
        console.error("Error adding acceptance tokens:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

async function generateOfferLetterPDFInMemory(offerLetter) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 40,
                bufferPages: true 
            });
            const buffers = [];

            // Collect PDF data in memory
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`PDF generated in memory for: ${offerLetter.candidateName}`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Determine if this is an internship offer
            const isInternship = offerLetter.salary === 0 || 
                               (offerLetter.position && offerLetter.position.toLowerCase().includes('intern')) ||
                               (offerLetter.additionalNotes && offerLetter.additionalNotes.toLowerCase().includes('intern'));

            // Format date in DD-MM-YYYY format
            const formatDate = (date) => {
                const d = new Date(date);
                return d.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            };

            // Load and add the offer letter template image as background (if exists)
            const templatePath = path.join(__dirname, '../assets/offer-letter.png');
            
            try {
                if (fs.existsSync(templatePath)) {
                    console.log('Loading offer letter template image...');
                    doc.image(templatePath, 0, 0, { 
                        width: doc.page.width, 
                        height: doc.page.height 
                    });
                }
            } catch (imageError) {
                console.log('Error loading template image, using text-based layout:', imageError.message);
            }

            // Set starting position for content
            let currentY = 160;

            // Header with date
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('white')
               .text(`Date: ${formatDate(offerLetter.issuedOn || offerLetter.createdAt)}`, 50, currentY );

            currentY += 30;

            // Greeting
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(`Dear ${offerLetter.candidateName},`, 50, currentY);

            currentY += 30;

            // Company greeting
            doc.fontSize(14)
               .font('Helvetica')
               .text(`Greetings from ${offerLetter.companyName || 'Om Softwares'}!`, 50, currentY);

            currentY += 30;

            // Main offer message
            const offerMessage = `Congratulations! We're pleased to offer you the position of ${offerLetter.position} at ${offerLetter.companyName || 'Om Softwares'}. This role will provide valuable hands-on experience with real-world projects in ${offerLetter.department} development.`;
            doc.fontSize(14)
               .text(offerMessage, 50, currentY, {
                   width: 500,
                   align: 'left'
               });

            currentY += 60;

            // Internship Overview section
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('white')
               .text('Internship Overview', 50, currentY);

            currentY += 25;

            // Duration
            doc.fontSize(14)
               .font('Helvetica')
               .text(`Duration: ${offerLetter.duration || 'Until project completion or 3 months (whichever is longer)'}`, 50, currentY, {
                   width: 500,
                   align: 'left'
               });
            currentY += 25;

            // Stipend
            const stipendText = offerLetter.salary === 0 ? 'Unpaid' : `₹${offerLetter.salary.toLocaleString()}`;
            doc.text(`Stipend: ${stipendText}`, 50, currentY);
            currentY += 25;

            // Mode
            doc.text(`Mode: ${offerLetter.workType || 'Work from Home'}`, 50, currentY);
            currentY += 25;

            // Certificate
            doc.text('Certificate: Issued upon successful completion', 50, currentY);
            currentY += 40;

            // Terms and conditions section
           
                doc.fontSize(14)
                   .font('Helvetica')
                   .text(`By accepting this offer, you agree to our terms at omsoftwares.in/terms,`, 50, currentY, {
                       width: 500,
                       align: 'left'
                   });
                currentY += 18;
                
                doc.text(`including confidentiality, performance expectations, and code ownership.`, 50, currentY, {
                    width: 500,
                    align: 'left'
                });
                currentY += 35;

                // Acceptance instruction
                doc.fontSize(14)
                   .font('Helvetica')
                   .text('Please confirm your acceptance by replying:', 50, currentY);
                currentY += 20;

                doc.fontSize(14)
                   .font('Helvetica')
                   .fillColor('white')
                   .text('"I accept the offer and agree to the terms and conditions."', 50, currentY, {
                       width: 500,
                       align: 'left'
                   });
                currentY += 40;

            // // Additional notes
            // if (offerLetter.additionalNotes && !isInternship) {
            //     doc.fontSize(12)
            //        .font('Helvetica-Bold')
            //        .text('Additional Information:', 50, currentY);
                
            //     currentY += 20;
            //     doc.fontSize(10)
            //        .font('Helvetica')
            //        .text(offerLetter.additionalNotes, 50, currentY, {
            //            width: 500,
            //            align: 'left'
            //        });
            //     currentY += 40;
            // }

            // Validity information
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('white')
               .text(`Valid until: ${formatDate(offerLetter.validUntil)}`, 50, currentY);
            currentY += 30;

            // Reset color
            doc.fillColor('white');

            // Closing message
            doc.fontSize(14)
               .font('Helvetica')
               .text(`We're excited to have you on board!`, 50, currentY);
            currentY += 25;

            // Signature section
            doc.fontSize(14)
               .font('Helvetica')
               .text('Warm regards,', 50, currentY);
            currentY += 20;

            // doc.fontSize(12)
            //    .font('Helvetica-Bold')
            //    .text(offerLetter.hrContactName || 'Pratika Rai', 50, currentY);
            // currentY += 20;

            doc.fontSize(14)
               .font('Helvetica')
               .text(`HR Team, ${offerLetter.companyName || 'Om Softwares'}`, 50, currentY);

            // HR Contact information (if available)
            // if (offerLetter.hrContactEmail || offerLetter.hrContactPhone) {
            //     currentY += 30;
            //     doc.fontSize(11)
            //        .font('Helvetica-Bold')
            //        .text('Contact Information:', 50, currentY);
                
            //     currentY += 20;
            //     if (offerLetter.hrContactEmail) {
            //         doc.fontSize(10)
            //            .font('Helvetica')
            //            .text(`Email: ${offerLetter.hrContactEmail}`, 50, currentY);
            //         currentY += 15;
            //     }
                
            //     if (offerLetter.hrContactPhone) {
            //         doc.text(`Phone: ${offerLetter.hrContactPhone}`, 50, currentY);
            //         currentY += 15;
            //     }
            // }

            // Add a QR code for acceptance link if acceptance token exists
            // if (offerLetter.acceptanceToken) {
            //     try {
            //         const acceptanceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/offer-acceptance/${offerLetter.acceptanceToken}`;
            //         const qrCodeDataUrl = await QRCode.toDataURL(acceptanceUrl, {
            //             width: 100,
            //             margin: 1,
            //             color: {
            //                 dark: '#000000',
            //                 light: '#FFFFFF'
            //             }
            //         });
                    
            //         // Convert data URL to buffer
            //         const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
                    
            //         // Add QR code to bottom right
            //         doc.image(qrBuffer, doc.page.width - 120, doc.page.height - 120, { 
            //             width: 80, 
            //             height: 80 
            //         });
                    
            //         // Add QR code label
            //         doc.fontSize(8)
            //            .text('Scan to respond', doc.page.width - 120, doc.page.height - 35, { 
            //                width: 80, 
            //                align: 'center' 
            //            });
            //     } catch (qrError) {
            //         console.log('Error generating QR code:', qrError.message);
            //     }
            // }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}