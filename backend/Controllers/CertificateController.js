const Certificate = require("../models/certificate");
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

exports.issue = async (req, res) => {
    console.log("Cert: new");
    try {
        const { name, domain, jobrole, fromDate, toDate, issuedBy } = req.body;
        console.log(`For: ${name}`);

        if (!name || !domain || !jobrole || !fromDate || !toDate) {
            console.log("Missing fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        // Set issuer
        const userId = req.user.userId;
        console.log(`Issuer: ${userId}`);

        console.log("Creating cert");
        const certificate = new Certificate({
            userId,
            name,
            domain,
            jobrole,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            issuedBy: issuedBy || "OM Softwares",
        });        const savedCertificate = await certificate.save();
        console.log(`Saved: ${savedCertificate._id}`);

        // Don't generate PDF immediately - generate only when needed
        res.status(201).json({
            message: "Certificate issued successfully",
            certificateId: savedCertificate._id,
            certificateUrl: `/certificates/${savedCertificate._id}.pdf`
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.verifyCertificate = async (req, res) => {
    console.log(`Verify: ${req.params.id}`);
    try {
        const certId = req.params.id;

        console.log(`Finding: ${certId}`);
        const certificate = await Certificate.findById(certId).populate("userId", "name email");

        if (!certificate) {
            console.log(`Not found: ${certId}`);
            return res.status(404).json({ message: "Certificate not found" });
        }

        console.log(`Verified: ${certificate.name}`);
        res.status(200).json({
            message: "Certificate verified successfully",
            certificate
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllCertificates = async (req, res) => {
    console.log("Certs: all");
    try {
        const certificates = await Certificate.find().populate("userId", "name email").sort({ createdAt: -1 });
        console.log(`Found: ${certificates.length}`);
        res.status(200).json(certificates);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.downloadCertificate = async (req, res) => {
    console.log(`Download request for certificate: ${req.params.id}`);
    try {
        const certId = req.params.id;
        
        const certificate = await Certificate.findById(certId);
        if (!certificate) {
            console.log(`Certificate with ID ${certId} not found in database`);
            return res.status(404).json({ message: "Certificate not found in database" });
        }
        
        const certificatePath = path.join(__dirname, `../uploads/certificates/${certId}.pdf`);
        
        console.log(`Checking file at: ${certificatePath}`);
        if (!fs.existsSync(certificatePath)) {
            console.log(`PDF file not found. Generating on-demand for: ${certId}`);
            try {
                await generateCertificatePDF(certificate);
                console.log(`Certificate PDF generated successfully for ID: ${certId}`);
            } catch (genError) {
                console.error(`Error generating PDF: ${genError}`);
                return res.status(500).json({ message: "Failed to generate certificate PDF" });
            }
        }
        
        console.log(`Starting download of: ${certificatePath}`);
        
        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${certId}.pdf"`);
        
        const fileStream = fs.createReadStream(certificatePath);
          // Handle stream errors
        fileStream.on('error', (error) => {
            console.error("File stream error:", error);
            res.status(500).json({ message: "Error streaming certificate file", error: error.message });
        });

        // Clean up PDF after download completes
        fileStream.on('end', () => {
            console.log(`Download completed for: ${certId}. Cleaning up...`);
            setTimeout(() => {
                try {
                    if (fs.existsSync(certificatePath)) {
                        fs.unlinkSync(certificatePath);
                        console.log(`PDF deleted after download: ${certId}`);
                    }
                } catch (cleanupError) {
                    console.error(`Cleanup error after download: ${cleanupError}`);
                }
            }, 1000); // Small delay to ensure download completes
        });
        
        fileStream.pipe(res);
    } catch (error) {
        console.error("Error downloading certificate:", error);
        res.status(500).json({ message: "Error downloading certificate", error: error.message });
    }
};


exports.generateCertificate = async (req, res) => {
    console.log(`Generate cert`);
    try {
        const { certificateId } = req.body;
        console.log(`ID: ${certificateId}`);

        if (!certificateId) {
            console.log("No ID");
            return res.status(400).json({ message: "Certificate ID is required" });
        }

        console.log(`Finding cert`);
        const certificate = await Certificate.findById(certificateId);
        
        if (!certificate) {
            console.log(`Not found`);
            return res.status(404).json({ message: "Certificate not found" });
        }

        // Gen PDF
        console.log(`Creating PDF`);
        const pdfPath = await generateCertificatePDF(certificate);
        console.log(`PDF done`);

        res.status(200).json({
            message: "Certificate generated successfully",
            certificateId: certificate._id,
            certificateUrl: `/certificates/${certificate._id}.pdf`
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Gen PDF helper
async function generateCertificatePDF(certificate) {
    console.log(`PDF for: ${certificate._id}`);
    try {
 
        const certDir = path.join(__dirname, "../uploads/certificates");
        if (!fs.existsSync(certDir)) {
            console.log(`Create dir`);
            fs.mkdirSync(certDir, { recursive: true });
        }
        
        const outputPath = path.join(certDir, `${certificate._id}.pdf`);
        console.log(`Output: ${outputPath}`);
        
        // QR code
        console.log(`Gen QR`);
        const qrCodePath = path.join(certDir, `${certificate._id}_qr.png`);
        const verifyUrl = `https://careers.omsoftwares.in/verify/${certificate._id}`;
        await QRCode.toFile(qrCodePath, verifyUrl);
        console.log(`QR done`);
        
        console.log(`Init canvas`);
        
        const canvas = createCanvas(842, 595);
        const ctx = canvas.getContext("2d");
        
        
        console.log(`Draw bg`);
        const bgImagePath = path.join(__dirname, "../assets/certificate for om softwares.jpg");
        const bgImage = await loadImage(bgImagePath);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        

        const logoPath = path.join(__dirname, "../assets/logo.png");
        const logo = await loadImage(logoPath);
        const logoWidth = 140; // Wider logo
        const logoHeight = 80; // Less high
        ctx.drawImage(logo, (canvas.width / 2) - (logoWidth / 2), 25, logoWidth, logoHeight);
 
        ctx.fillStyle = "#c5f019"; 
        ctx.font = "bold 50px Arial"; 
        ctx.textAlign = "center";
        ctx.fillText(`Certificate`, canvas.width / 2, 150);
        
      
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Arial";
        ctx.fillText(`Of Achievement`, canvas.width / 2, 190); 
        
        ctx.font = "25px Arial";
        ctx.fillText(`Proudly Presented To`, canvas.width / 2, 240);
        
       
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(certificate.name, canvas.width / 2, 300);
        
      
        ctx.beginPath();
        ctx.strokeStyle = "#84cc16";
        ctx.lineWidth = 3;
        ctx.moveTo(canvas.width / 2 - 200, 330);
        ctx.lineTo(canvas.width / 2 + 200, 330);
        ctx.stroke();
        
       
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "25px Arial";
        ctx.fillText(`for completing ${certificate.jobrole} internship at om softwares`, canvas.width / 2, 380);
        
       
        ctx.font = "25px Arial";
        ctx.fillText(`from ${new Date(certificate.fromDate).toLocaleDateString()} to ${new Date(certificate.toDate).toLocaleDateString()}`, canvas.width / 2, 420);
        
       
        ctx.font = "20px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        
        
        const rowY = 480;
         
        const leftColumnX = canvas.width / 4;
        ctx.fillText(new Date().toLocaleDateString(), leftColumnX, rowY);
        ctx.beginPath();
        ctx.moveTo(leftColumnX - 100, rowY + 20);
        ctx.lineTo(leftColumnX + 100, rowY + 20);
        ctx.stroke();
        ctx.fillText("Date", leftColumnX, rowY + 50); 
        
        
        const rightColumnX = (canvas.width * 3) / 4;
        ctx.fillText(certificate.issuedBy, rightColumnX, rowY);
        ctx.beginPath();
        ctx.moveTo(rightColumnX - 100, rowY + 20);
        ctx.lineTo(rightColumnX + 100, rowY + 20);
        ctx.stroke();
        ctx.fillText("Signature", rightColumnX, rowY + 50); 
       
        console.log(`Add QR`);
        const qrCode = await loadImage(qrCodePath);
        const qrSize = 90; // Smaller QR code
        const middleColumnX = canvas.width / 2;
       
        ctx.drawImage(qrCode, middleColumnX - (qrSize / 2), canvas.height - qrSize - 46, qrSize, qrSize);
        
        
        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(`Certificate ID: ${certificate._id}`, canvas.width / 2, canvas.height - 20);
        
        
        console.log(`Create buffer`);
        const certificateImage = canvas.toBuffer("image/png");
        const certificateImagePath = path.join(certDir, `${certificate._id}_cert.png`);
        fs.writeFileSync(certificateImagePath, certificateImage);
        console.log(`Image saved`);
        
        console.log(`Create PDF`);
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        
       
        doc.image(certificateImagePath, 0, 0, { width: 842 }); 
        doc.end();
          // Wait for PDF to be written before returning
        return new Promise((resolve, reject) => {
            writeStream.on("finish", () => {
                console.log(`PDF creation completed`);
                try {
                    // Clean up temporary files but keep the PDF
                    fs.unlinkSync(qrCodePath);
                    fs.unlinkSync(certificateImagePath);
                    console.log(`Temporary files cleaned up`);
                    resolve(outputPath);
                } catch (cleanupError) {
                    console.error(`Cleanup error: ${cleanupError}`);
                    // Still resolve since PDF was created successfully
                    resolve(outputPath);
                }
            });
            
            writeStream.on("error", (error) => {
                console.error(`PDF write error: ${error}`);
                reject(error);
            });
        });
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

exports.sendCertificateEmail = async (req, res) => {
    console.log(`Send email`);
    try {
        const { id } = req.params;
        const { recipientEmail, subject, message } = req.body;

        if (!recipientEmail) {
            console.log(`No email`);
            return res.status(400).json({ message: "Recipient email is required" });
        }

        const certificate = await Certificate.findById(id);
        if (!certificate) {
            console.log(`Cert not found: ${id}`);
            return res.status(404).json({ message: "Certificate not found" });
        }        // Use existing PDF path for email (use stored PDF)
        const certificatePath = path.join(__dirname, "../uploads/certificates", `${certificate._id}.pdf`);
        
        // Generate PDF if it doesn't exist
        if (!fs.existsSync(certificatePath)) {
            console.log(`PDF not found, generating for email: ${id}`);
            await generateCertificatePDF(certificate);
        }

        // Send email
        await sendCertificateByEmail(
            recipientEmail, 
            subject || `Certificate: ${certificate.jobrole}`, 
            message || `Congrats on completing your internship in ${certificate.domain}!`,
            certificate.name,
            certificatePath
        );

        console.log(`Email sent: ${recipientEmail}`);
        res.status(200).json({
            message: "Certificate emailed successfully",
            certificateId: certificate._id
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Email helper
async function sendCertificateByEmail(to, subject, message, recipientName, certificatePath) {
    console.log(`Email to: ${to}`);
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Certificate of Completion</h2>
                    <p>Dear ${recipientName},</p>
                    <p>${message}</p>
                    <p>Please find your certificate attached.</p>
                    <p>This certificate can be verified online.</p>
                    <p>Regards,<br>OM Softwares</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${recipientName.replace(/\s+/g, '_')}_certificate.pdf`,
                    path: certificatePath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Error:`, error);
        throw error;
    }
}

// Offer letter
exports.issueOfferLetter = async (req, res) => {
    console.log("New offer");
    try {
        const { name, position, email, startDate, additionalDetails, issuedBy } = req.body;
        console.log(`For: ${name}, ${position}`);

        if (!name || !position || !email) {
            console.log("Missing fields");
            return res.status(400).json({ message: "Name, position, and email are required" });
        }

        // Generate PDF in memory
        console.log(`Generate PDF in memory`);
        const pdfBuffer = await generateOfferLetterPDFInMemory({
            name,
            position,
            startDate: startDate ? new Date(startDate) : new Date(),
            additionalDetails,
            issuedBy: issuedBy || "OM Softwares",
            issuedOn: new Date()
        });

        // Send email with PDF attachment from memory
        console.log(`Send to: ${email}`);
        await sendOfferLetterByEmailFromMemory(
            email,
            `Offer: ${position}`,
            `We're pleased to offer you the ${position} position at OM Softwares.`,
            name,
            pdfBuffer
        );

        console.log(`Offer letter sent successfully without storing permanently`);

        res.status(201).json({
            message: "Offer letter sent",
            recipientEmail: email
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Offer PDF helper - Generate in memory
async function generateOfferLetterPDFInMemory(offerData) {
    console.log(`Generate offer PDF in memory`);    try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        // Collect PDF data in memory
        doc.on('data', buffers.push.bind(buffers));
          // Header
        doc.fontSize(20).font('Helvetica-Bold').text('OM SOFTWARES', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('JOB OFFER LETTER', { align: 'center' });
        doc.moveDown(2);
        
        // Date
        doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);
        
        // Name
        doc.fontSize(12).font('Helvetica').text(`Dear ${offerData.name},`, { align: 'left' });
        doc.moveDown();
        
        // Content
        doc.fontSize(12).font('Helvetica').text(
            `We're pleased to offer you the ${offerData.position} position at OM Softwares. ` +
            `Start date: ${offerData.startDate.toLocaleDateString()}.`, 
            { align: 'left' }
        );
        doc.moveDown();
        
        // Details
        if (offerData.additionalDetails) {
            doc.fontSize(12).font('Helvetica').text(offerData.additionalDetails, { align: 'left' });
            doc.moveDown();
        }
        
        // Terms
        doc.fontSize(12).font('Helvetica').text(
            'This offer depends on your acceptance of our policies. ' +
            'Please sign and return to HR.', 
            { align: 'left' }
        );
        doc.moveDown(2);
        
        // Signature
        doc.fontSize(12).font('Helvetica').text('Sincerely,', { align: 'left' });
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text(offerData.issuedBy, { align: 'left' });
        doc.fontSize(12).font('Helvetica').text('Director', { align: 'left' });
        
        // Acceptance
        doc.moveDown(4);
        doc.fontSize(12).font('Helvetica-Bold').text('Acceptance:', { align: 'left' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(
            'I accept this offer.', 
            { align: 'left' }
        );
        doc.moveDown(2);
        
        // Signature lines
        doc.fontSize(12).font('Helvetica').text('Signature: _______________________', { align: 'left' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Name: ${offerData.name}`, { align: 'left' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text('Date: _______________________', { align: 'left' });
          // Finalize
        doc.end();
        
        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`PDF generated in memory for: ${offerData.name}`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
        });
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

// Offer email helper - Send from memory
async function sendOfferLetterByEmailFromMemory(to, subject, message, recipientName, pdfBuffer) {
    console.log(`Email to: ${to}`);
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Offer Letter</h2>
                    <p>Dear ${recipientName},</p>
                    <p>${message}</p>
                    <p>Please find your offer letter attached.</p>
                    <p>Sign and return to HR to accept.</p>
                    <p>Regards,<br>OM Softwares</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${recipientName.replace(/\s+/g, '_')}_offer.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Error:`, error);
        throw error;
    }
}

// Original file-based offer email helper (kept for backwards compatibility if needed)
async function sendOfferLetterByEmail(to, subject, message, recipientName, offerLetterPath) {
    console.log(`Email to: ${to}`);
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Offer Letter</h2>
                    <p>Dear ${recipientName},</p>
                    <p>${message}</p>
                    <p>Please find your offer letter attached.</p>
                    <p>Sign and return to HR to accept.</p>
                    <p>Regards,<br>OM Softwares</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${recipientName.replace(/\s+/g, '_')}_offer.pdf`,
                    path: offerLetterPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Error:`, error);
        throw error;
    }
}

// Utility function to clean up old PDFs (can be called manually if needed)
exports.cleanupOldPDFs = async () => {
    console.log('Starting PDF cleanup...');
    try {
        const certDir = path.join(__dirname, "../uploads/certificates");
        const offerDir = path.join(__dirname, "../uploads/offers");
        
        const cleanupDir = (dirPath, filePrefix = '') => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                
                files.forEach(file => {
                    if (file.endsWith('.pdf') && file.startsWith(filePrefix)) {
                        const filePath = path.join(dirPath, file);
                        fs.unlinkSync(filePath);
                        console.log(`Cleaned up PDF: ${file}`);
                    }
                });
            }
        };
        
        cleanupDir(certDir);
        cleanupDir(offerDir, 'offer_');
        
        console.log('PDF cleanup completed');
    } catch (error) {
        console.error('Error during PDF cleanup:', error);
    }
};