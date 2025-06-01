const OfferLetter = require("../models/offerLetter");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

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

        const filename = `offer-letter-${offerLetterId}.pdf`;

        // Generate PDF in memory
        const pdfBuffer = await generateOfferLetterPDFInMemory(offerLetter);

        const emailRecipient = recipientEmail || offerLetter.email;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailRecipient,
            subject: `Job Offer - ${offerLetter.position} at ${offerLetter.companyName || 'OM Softwares'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Congratulations ${offerLetter.candidateName}!</h2>
                    <p>We are pleased to offer you the position of <strong>${offerLetter.position}</strong> at ${offerLetter.companyName || 'OM Softwares'}.</p>
                    <p>Please find your official offer letter attached to this email.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Offer Details:</h3>
                        <p><strong>Position:</strong> ${offerLetter.position}</p>
                        <p><strong>Department:</strong> ${offerLetter.department}</p>
                        <p><strong>Start Date:</strong> ${new Date(offerLetter.startDate).toLocaleDateString()}</p>
                        <p><strong>Location:</strong> ${offerLetter.joiningLocation}</p>
                        <p><strong>Work Type:</strong> ${offerLetter.workType}</p>
                    </div>
                    
                    <p>This offer is valid until <strong>${new Date(offerLetter.validUntil).toLocaleDateString()}</strong>.</p>
                    <p>Please review the attached offer letter and let us know your decision.</p>
                    
                    <p>Best regards,<br>
                    ${offerLetter.hrContactName || 'HR Team'}<br>
                    ${offerLetter.companyName || 'OM Softwares'}</p>
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
        console.log(`Offer letter emailed directly from memory to: ${emailRecipient}`);
        
        res.status(200).json({ 
            message: "Offer letter sent successfully",
            sentTo: emailRecipient 
        });

    } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({ message: "Error sending email", error: error.message });
    }
};

async function generateOfferLetterPDFInMemory(offerLetter) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            // Collect PDF data in memory
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`PDF generated in memory for: ${offerLetter.candidateName}`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text(offerLetter.companyName || 'OM Softwares', { align: 'center' });
            doc.fontSize(16).text('Job Offer Letter', { align: 'center' });
            doc.moveDown(2);

            // Date
            doc.fontSize(12).text(`Date: ${new Date(offerLetter.issuedOn || offerLetter.createdAt).toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(1);

            // Candidate details
            doc.text(`Dear ${offerLetter.candidateName},`);
            doc.moveDown(1);

            // Offer content
            doc.text(`We are pleased to offer you the position of ${offerLetter.position} in our ${offerLetter.department} department at ${offerLetter.companyName || 'OM Softwares'}.`);
            doc.moveDown(1);

            // Position details
            doc.text('Position Details:', { underline: true });
            doc.text(`Position: ${offerLetter.position}`);
            doc.text(`Department: ${offerLetter.department}`);
            doc.text(`Annual Salary: $${offerLetter.salary.toLocaleString()}`);
            doc.text(`Start Date: ${new Date(offerLetter.startDate).toLocaleDateString()}`);
            doc.text(`Work Location: ${offerLetter.joiningLocation}`);
            doc.text(`Work Type: ${offerLetter.workType}`);
            
            if (offerLetter.reportingManager) {
                doc.text(`Reporting Manager: ${offerLetter.reportingManager}`);
            }
            doc.moveDown(1);

            // Benefits
            if (offerLetter.benefits && offerLetter.benefits.length > 0) {
                doc.text('Benefits:', { underline: true });
                offerLetter.benefits.forEach(benefit => {
                    doc.text(`• ${benefit}`);
                });
                doc.moveDown(1);
            }

            // Additional notes
            if (offerLetter.additionalNotes) {
                doc.text('Additional Information:', { underline: true });
                doc.text(offerLetter.additionalNotes);
                doc.moveDown(1);
            }

            // Validity
            doc.text(`This offer is valid until ${new Date(offerLetter.validUntil).toLocaleDateString()}.`);
            doc.moveDown(1);

            // HR Contact
            if (offerLetter.hrContactName || offerLetter.hrContactEmail || offerLetter.hrContactPhone) {
                doc.text('For any questions, please contact:', { underline: true });
                if (offerLetter.hrContactName) doc.text(`Name: ${offerLetter.hrContactName}`);
                if (offerLetter.hrContactEmail) doc.text(`Email: ${offerLetter.hrContactEmail}`);
                if (offerLetter.hrContactPhone) doc.text(`Phone: ${offerLetter.hrContactPhone}`);
                doc.moveDown(1);
            }

            // Closing
            doc.text('We look forward to welcoming you to our team!');
            doc.moveDown(2);

            doc.text('Sincerely,');
            doc.text(`${offerLetter.companyName || 'OM Softwares'} HR Team`);

            // Generate QR code for verification
            try {
                const qrCodeData = `Offer Letter ID: ${offerLetter._id}\nCandidate: ${offerLetter.candidateName}\nPosition: ${offerLetter.position}`;
                const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);
                const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                
                doc.moveDown(2);
                doc.image(qrCodeBuffer, doc.page.width - 150, doc.y, { width: 100 });
                doc.text('Scan for verification', doc.page.width - 150, doc.y + 105, { width: 100, align: 'center' });
            } catch (qrError) {
                console.warn('Could not generate QR code:', qrError.message);
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}