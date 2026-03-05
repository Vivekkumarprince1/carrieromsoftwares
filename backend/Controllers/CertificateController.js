const Certificate = require("../models/certificate");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("../utils/canvasAdapter");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fontManager = require("../utils/fontManager");

// Initialize fonts
fontManager.registerAllFonts();

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
        const { name, domain, jobrole, fromDate, toDate, issuedBy, email } = req.body;
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
            recipientEmail: email || null,
            domain,
            jobrole,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            issuedBy: issuedBy || "OM Softwares",
        }); const savedCertificate = await certificate.save();
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

        console.log(`Generating PDF in memory for: ${certId}`);

        // Generate PDF directly in memory and stream to response
        const pdfBuffer = await generateCertificatePDFBuffer(certificate);

        console.log(`Starting download of: ${certId}`);

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${certId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send the PDF buffer directly
        res.send(pdfBuffer);

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

        // Generate PDF in memory (no file system operations)
        console.log(`Creating PDF in memory`);
        const pdfBuffer = await generateCertificatePDFBuffer(certificate);
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

// New memory-based PDF generation for serverless compatibility
async function generateCertificatePDFBuffer(certificate) {
    console.log(`Generating styled certificate for: ${certificate.name}`);
    try {
        const frontendBaseUrl = (process.env.FRONTEND_URL || "https://careers.omsoftwares.in").replace(/\/+$/, "");
        const verifyUrl = `${frontendBaseUrl}/verify/${certificate._id}`;
        
        // Manual QR Code generation for high customization to match the provided image
        const qrCodeData = QRCode.create(verifyUrl, { errorCorrectionLevel: 'H' });
        const moduleCount = qrCodeData.modules.size;
        const qrCanvasSize = 600; 
        const dotCanvas = createCanvas(qrCanvasSize, qrCanvasSize);
        const dctx = dotCanvas.getContext('2d');
        
        // Add a small padding (quiet zone) for better scannability
        const padding = 30;
        const effectiveSize = qrCanvasSize - (padding * 2);
        const moduleSize = effectiveSize / moduleCount;

        // Background
        dctx.fillStyle = '#111111'; // Pure black background
        dctx.fillRect(0, 0, qrCanvasSize, qrCanvasSize);

        // Gradient Colors
        const topColor = { r: 214, g: 243, b: 0 }; // Lime green
        const bottomColor = { r: 255, g: 255, b: 255 }; // White

        const getColorAtY = (yIndex) => {
            const t = yIndex / (moduleCount - 1);
            const r = Math.round(topColor.r * (1 - t) + bottomColor.r * t);
            const g = Math.round(topColor.g * (1 - t) + bottomColor.g * t);
            const b = Math.round(topColor.b * (1 - t) + bottomColor.b * t);
            return `rgb(${r},${g},${b})`;
        };

        // Helper for custom finder patterns (Eyes) - Improved for scannability
        const drawFinderPattern = (row, col) => {
            const centerX = padding + col * moduleSize + (7 * moduleSize) / 2;
            const centerY = padding + row * moduleSize + (7 * moduleSize) / 2;
            const color = getColorAtY(row + 3); // Use color from the middle of the eye
            
            // 1. Outer Ring (3 modules thick equivalent but rounded)
            dctx.fillStyle = color;
            dctx.beginPath();
            dctx.roundRect(padding + col * moduleSize, padding + row * moduleSize, 7 * moduleSize, 7 * moduleSize, moduleSize * 1.5);
            dctx.fill();

            // 2. Black Gap
            dctx.fillStyle = '#111111';
            dctx.beginPath();
            dctx.roundRect(padding + (col + 1) * moduleSize, padding + (row + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize, moduleSize);
            dctx.fill();

            // 3. Inner Solid Block
            dctx.fillStyle = color;
            dctx.beginPath();
            dctx.roundRect(padding + (col + 2) * moduleSize, padding + (row + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize, moduleSize * 0.7);
            dctx.fill();
        };

        // Draw all modules
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qrCodeData.modules.get(row, col)) {
                    // Check if it's a finder pattern
                    const isTopLeft = row < 7 && col < 7;
                    const isTopRight = row < 7 && col >= moduleCount - 7;
                    const isBottomLeft = row >= moduleCount - 7 && col < 7;

                    if (isTopLeft || isTopRight || isBottomLeft) {
                        // Skip individual modules; we'll draw the whole pattern once
                        if (row === 0 && col === 0) drawFinderPattern(0, 0);
                        if (row === 0 && col === moduleCount - 7) drawFinderPattern(0, moduleCount - 7);
                        if (row === moduleCount - 7 && col === 0) drawFinderPattern(moduleCount - 7, 0);
                        continue;
                    }

                    // Regular module: draw a smooth dot
                    dctx.fillStyle = getColorAtY(row);
                    dctx.beginPath();
                    const centerX = padding + col * moduleSize + moduleSize / 2;
                    const centerY = padding + row * moduleSize + moduleSize / 2;
                    // Slightly larger dots (0.9 vs 0.85) to ensure they overlap/touch enough for scanners
                    const radius = (moduleSize / 2) * 0.95; 
                    dctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    dctx.fill();
                }
            }
        }

        const styledQrCodeBuffer = dotCanvas.toBuffer('image/png');

        // Load the certificate background image
        const certificateTemplatePath = path.join(__dirname, "../assets/complition certificate.png");
        const templateImage = await loadImage(certificateTemplatePath);

        // Create canvas with the same dimensions as the template image
        const canvas = createCanvas(templateImage.width, templateImage.height);
        const ctx = canvas.getContext("2d");

        // Draw the background certificate template
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

        // ==== DYNAMIC CONTENT OVERLAY ====

        // Position the recipient name in the green section (main focus) - Increased size
        // Try elegant fonts first, fallback to Britannic, then system fonts
        if (fontManager.isFontRegistered('Allura')) {
            ctx.font = fontManager.getFontString(180, 'Allura', 'normal', 'cursive');
        } else if (fontManager.isFontRegistered('Great Vibes')) {
            ctx.font = fontManager.getFontString(180, 'Great Vibes', 'normal', 'cursive');
        } else if (fontManager.isFontRegistered('Britannic')) {
            ctx.font = fontManager.getFontString(180, 'Britannic', 'bold', 'Georgia, serif');
        } else {
            ctx.font = "bold 180px 'Georgia', serif"; // Fallback system font with increased size
        }

        ctx.fillStyle = "#000"; // Black text on the green background
        ctx.textAlign = "center";
        ctx.fillText(certificate.name, canvas.width / 2, canvas.height * 0.56); // Centered in green area

        // Description paragraph: Montserrat Regular, 32 pt
        const descriptionFont = fontManager.isFontRegistered('Montserrat', 'normal')
            ? fontManager.getFontString(32, 'Montserrat', 'normal', 'Arial, sans-serif')
            : "32px Arial, sans-serif";

        ctx.font = descriptionFont;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";

        // First line of description
        const baseText = "In recognition of the successful completion of the ";
        const jobroleText = `${certificate.jobrole}`;
        const internship = " Internship Program";

        // Bold job role text: Montserrat SemiBold, 32 pt
        const jobroleFont = fontManager.isFontRegistered('Montserrat', '600')
            ? fontManager.getFontString(32, 'Montserrat', '600', 'Arial, sans-serif')
            : "600 32px Arial, sans-serif";
        const baseFont = descriptionFont;

        // Measure widths with the same fonts used during rendering to avoid visible spacing gaps
        ctx.font = baseFont;
        const baseWidth = ctx.measureText(baseText).width;
        const internshipWidth = ctx.measureText(internship).width;
        ctx.font = jobroleFont;
        const jobroleWidth = ctx.measureText(jobroleText).width;

        // Calculate positions for proper alignment
        const totalWidth = baseWidth + jobroleWidth + internshipWidth;
        let startX = canvas.width / 2 - totalWidth / 2;

        // Draw the base text with FontManager
        ctx.font = baseFont;
        ctx.fillText(baseText, startX + baseWidth / 2, canvas.height * 0.63);

        // Draw the jobrole text in bold with increased size
        ctx.font = jobroleFont;
        ctx.fillText(jobroleText, startX + baseWidth + jobroleWidth / 2, canvas.height * 0.63);

        // Draw the internship text after jobrole text
        ctx.font = baseFont;
        ctx.fillText(internship, startX + baseWidth + jobroleWidth + internshipWidth / 2, canvas.height * 0.63);



        // Second line: Montserrat Regular, 18 pt
        const secondLineFont = descriptionFont;
        ctx.font = secondLineFont;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        const description = "and in appreciation of outstanding commitment, professionalism, and dedication to both personal and professional growth.";
        ctx.fillText(description, canvas.width / 2, canvas.height * 0.67);

        // Add domain information if available
        // if (certificate.domain) {
        //     ctx.font = "18px Arial";
        //     ctx.fillStyle = "#000";
        //     ctx.fillText(`Domain: ${certificate.domain}`, canvas.width / 2, canvas.height * 0.65);
        // }


        // ==== QR CODE (bottom-left) ====
        const qrCode = await loadImage(styledQrCodeBuffer);
        const qrSize = 240;
        const qrX = 145;
        const qrY = canvas.height - qrSize - 130;
        ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);

        // ==== DATES & ID (positioned in the template's designated areas) ====
        // Internship dates, ID and issue date: Montserrat Medium, 30 pt
        const dateFont = fontManager.isFontRegistered('Montserrat', '500')
            ? fontManager.getFontString(32, 'Montserrat', '500', 'Arial, sans-serif')
            : "500 32px Arial, sans-serif";
        ctx.font = dateFont;
        ctx.fillStyle = "#fff";

        // Left side - Internship dates
        ctx.textAlign = "left";
        const leftX = 1000;
        const leftY = canvas.height - 245;
        // ctx.fillText(`Internship Start Date:`, leftX, leftY);
        ctx.fillText(new Date(certificate.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), leftX, leftY + 13);

        // ctx.fillText(`Internship End Date:`, leftX, leftY + 50);
        ctx.fillText(new Date(certificate.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), leftX - 5, leftY + 73);

        // Right side - Certificate details
        const rightX = canvas.width - 400;
        // ctx.fillText(`Id:`, rightX, leftY);
        ctx.fillText(`${certificate._id}`, rightX - 210, leftY + 13);

        // ctx.fillText(`Certificate Issue Date:`, rightX, leftY + 50);
        ctx.fillText(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), rightX + 105, leftY + 73);

        // Bottom note: Montserrat Light, 12 pt
        // const bottomNoteFont = fontManager.isFontRegistered('Montserrat', '300')
        //     ? fontManager.getFontString(12, 'Montserrat', '300', 'Arial, sans-serif')
        //     : "300 12px Arial, sans-serif";
        // ctx.font = bottomNoteFont;
        // ctx.fillStyle = "#fff";
        // ctx.textAlign = "center";
        // ctx.fillText("Scan the QR code to verify this certificate online.", canvas.width / 2, canvas.height - 42);


        // ==== CONVERT TO PDF ====
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));

        const certImageBuffer = canvas.toBuffer("image/png");
        doc.image(certImageBuffer, 0, 0, { width: 842 }); // scale to A4 landscape
        doc.end();

        return new Promise((resolve, reject) => {
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);
        });
    } catch (error) {
        console.error("Error generating styled certificate:", error);
        throw error;
    }
}

exports.sendCertificateEmail = async (req, res) => {
    console.log(`Send email`);
    try {
        const { id } = req.params;
        const { recipientEmail, subject, message } = req.body;

        const certificate = await Certificate.findById(id);
        if (!certificate) {
            console.log(`Cert not found: ${id}`);
            return res.status(404).json({ message: "Certificate not found" });
        }

        const emailToSend = recipientEmail || certificate.recipientEmail;
        if (!emailToSend) {
            console.log(`No email`);
            return res.status(400).json({ message: "Recipient email is required" });
        }

        if (recipientEmail && recipientEmail !== certificate.recipientEmail) {
            certificate.recipientEmail = recipientEmail;
            await certificate.save();
        }

        // Generate PDF in memory for email
        console.log(`Generating PDF for email: ${id}`);
        const pdfBuffer = await generateCertificatePDFBuffer(certificate);

        // Send email with buffer attachment
        await sendCertificateByEmailBuffer(
            emailToSend,
            subject || `Certificate: ${certificate.jobrole}`,
            message || `Congrats on completing your internship in ${certificate.domain}!`,
            certificate.name,
            pdfBuffer,
            `certificate-${certificate._id}.pdf`
        );

        console.log(`Email sent: ${emailToSend}`);
        res.status(200).json({
            message: "Certificate emailed successfully",
            certificateId: certificate._id,
            sentTo: emailToSend
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Email helper
// async function sendCertificateByEmail(to, subject, message, recipientName, certificatePath) {
//     console.log(`Email to: ${to}`);
//     try {
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to,
//             subject,
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <h2>Certificate of Completion</h2>
//                     <p>Dear ${recipientName},</p>
//                     <p>${message}</p>
//                     <p>Please find your certificate attached.</p>
//                     <p>This certificate can be verified online.</p>
//                     <p>Regards,<br>OM Softwares</p>
//                 </div>
//             `,
//             attachments: [
//                 {
//                     filename: `${recipientName.replace(/\s+/g, '_')}_certificate.pdf`,
//                     path: certificatePath
//                 }
//             ]
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`Sent: ${info.messageId}`);
//         return info;
//     } catch (error) {
//         console.error(`Error:`, error);
//         throw error;
//     }
// }

// New buffer-based email function for serverless compatibility
async function sendCertificateByEmailBuffer(to, subject, message, recipientName, pdfBuffer, filename) {
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
                    filename: filename,
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

// Offer letter
// exports.issueOfferLetter = async (req, res) => {
//     console.log("New offer");
//     try {
//         const { name, position, email, startDate, additionalDetails, issuedBy } = req.body;
//         console.log(`For: ${name}, ${position}`);

//         if (!name || !position || !email) {
//             console.log("Missing fields");
//             return res.status(400).json({ message: "Name, position, and email are required" });
//         }

//         // Generate PDF in memory
//         console.log(`Generate PDF in memory`);
//         const pdfBuffer = await generateOfferLetterPDFInMemory({
//             name,
//             position,
//             startDate: startDate ? new Date(startDate) : new Date(),
//             additionalDetails,
//             issuedBy: issuedBy || "OM Softwares",
//             issuedOn: new Date()
//         });

//         // Send email with PDF attachment from memory
//         console.log(`Send to: ${email}`);
//         await sendOfferLetterByEmailFromMemory(
//             email,
//             `Offer: ${position}`,
//             `We're pleased to offer you the ${position} position at OM Softwares.`,
//             name,
//             pdfBuffer
//         );

//         console.log(`Offer letter sent successfully without storing permanently`);

//         res.status(201).json({
//             message: "Offer letter sent",
//             recipientEmail: email
//         });

//     } catch (error) {
//         console.error("Error:", error.message);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// // Offer PDF helper - Generate in memory
// async function generateOfferLetterPDFInMemory(offerData) {
//     console.log(`Generate offer PDF in memory`);    try {
//         const doc = new PDFDocument({ margin: 50 });
//         const buffers = [];

//         // Collect PDF data in memory
//         doc.on('data', buffers.push.bind(buffers));
//           // Header
//         doc.fontSize(20).font('Helvetica-Bold').text('OM SOFTWARES', { align: 'center' });
//         doc.moveDown();
//         doc.fontSize(16).font('Helvetica-Bold').text('JOB OFFER LETTER', { align: 'center' });
//         doc.moveDown(2);

//         // Date
//         doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
//         doc.moveDown(2);

//         // Name
//         doc.fontSize(12).font('Helvetica').text(`Dear ${offerData.name},`, { align: 'left' });
//         doc.moveDown();

//         // Content
//         doc.fontSize(12).font('Helvetica').text(
//             `We're pleased to offer you the ${offerData.position} position at OM Softwares. ` +
//             `Start date: ${offerData.startDate.toLocaleDateString()}.`, 
//             { align: 'left' }
//         );
//         doc.moveDown();

//         // Details
//         if (offerData.additionalDetails) {
//             doc.fontSize(12).font('Helvetica').text(offerData.additionalDetails, { align: 'left' });
//             doc.moveDown();
//         }

//         // Terms
//         doc.fontSize(12).font('Helvetica').text(
//             'This offer depends on your acceptance of our policies. ' +
//             'Please sign and return to HR.', 
//             { align: 'left' }
//         );
//         doc.moveDown(2);

//         // Signature
//         doc.fontSize(12).font('Helvetica').text('Sincerely,', { align: 'left' });
//         doc.moveDown(2);
//         doc.fontSize(12).font('Helvetica-Bold').text(offerData.issuedBy, { align: 'left' });
//         doc.fontSize(12).font('Helvetica').text('Director', { align: 'left' });

//         // Acceptance
//         doc.moveDown(4);
//         doc.fontSize(12).font('Helvetica-Bold').text('Acceptance:', { align: 'left' });
//         doc.moveDown();
//         doc.fontSize(12).font('Helvetica').text(
//             'I accept this offer.', 
//             { align: 'left' }
//         );
//         doc.moveDown(2);

//         // Signature lines
//         doc.fontSize(12).font('Helvetica').text('Signature: _______________________', { align: 'left' });
//         doc.moveDown();
//         doc.fontSize(12).font('Helvetica').text(`Name: ${offerData.name}`, { align: 'left' });
//         doc.moveDown();
//         doc.fontSize(12).font('Helvetica').text('Date: _______________________', { align: 'left' });
//           // Finalize
//         doc.end();

//         return new Promise((resolve, reject) => {
//             doc.on('end', () => {
//                 const pdfBuffer = Buffer.concat(buffers);
//                 console.log(`PDF generated in memory for: ${offerData.name}`);
//                 resolve(pdfBuffer);
//             });
//             doc.on('error', reject);
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         throw error;
//     }
// }

// // Offer email helper - Send from memory
// async function sendOfferLetterByEmailFromMemory(to, subject, message, recipientName, pdfBuffer) {
//     console.log(`Email to: ${to}`);
//     try {
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to,
//             subject,
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <h2>Offer Letter</h2>
//                     <p>Dear ${recipientName},</p>
//                     <p>${message}</p>
//                     <p>Please find your offer letter attached.</p>
//                     <p>Sign and return to HR to accept.</p>
//                     <p>Regards,<br>OM Softwares</p>
//                 </div>
//             `,
//             attachments: [
//                 {
//                     filename: `${recipientName.replace(/\s+/g, '_')}_offer.pdf`,
//                     content: pdfBuffer,
//                     contentType: 'application/pdf'
//                 }
//             ]
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`Sent: ${info.messageId}`);
//         return info;
//     } catch (error) {
//         console.error(`Error:`, error);
//         throw error;
//     }
// }

// // Original file-based offer email helper (kept for backwards compatibility if needed)
// async function sendOfferLetterByEmail(to, subject, message, recipientName, offerLetterPath) {
//     console.log(`Email to: ${to}`);
//     try {
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to,
//             subject,
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <h2>Offer Letter</h2>
//                     <p>Dear ${recipientName},</p>
//                     <p>${message}</p>
//                     <p>Please find your offer letter attached.</p>
//                     <p>Sign and return to HR to accept.</p>
//                     <p>Regards,<br>OM Softwares</p>
//                 </div>
//             `,
//             attachments: [
//                 {
//                     filename: `${recipientName.replace(/\s+/g, '_')}_offer.pdf`,
//                     path: offerLetterPath
//                 }
//             ]
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`Sent: ${info.messageId}`);
//         return info;
//     } catch (error) {
//         console.error(`Error:`, error);
//         throw error;
//     }
// }

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