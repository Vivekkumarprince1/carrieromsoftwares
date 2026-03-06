const Certificate = require("../models/certificate");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("../utils/canvasAdapter");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fontManager = require("../utils/fontManager");

function resolveBackendAssetPath(...segments) {
    const candidates = [
        path.join(__dirname, "..", ...segments),
        path.join(process.cwd(), ...segments),
        path.join(process.cwd(), "backend", ...segments),
    ];

    const assetPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!assetPath) {
        throw new Error(`Asset not found: ${segments.join("/")}`);
    }

    return assetPath;
}

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
        const qrCanvasSize = 1200;
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
            const centerX = padding + (col + 3.5) * moduleSize;
            const centerY = padding + (row + 3.5) * moduleSize;
            const eyeColor = getColorAtY(row + 3.5); // consistent with gradient

            // 1. Outer Ring Circle
            dctx.fillStyle = eyeColor;
            dctx.beginPath();
            dctx.arc(centerX, centerY, 3.5 * moduleSize, 0, Math.PI * 2);
            dctx.fill();

            // 2. Black Gap Circle
            dctx.fillStyle = '#111111';
            dctx.beginPath();
            dctx.arc(centerX, centerY, 2.5 * moduleSize, 0, Math.PI * 2);
            dctx.fill();

            // 3. Inner Solid Circle
            dctx.fillStyle = eyeColor;
            dctx.beginPath();
            dctx.arc(centerX, centerY, 1.5 * moduleSize, 0, Math.PI * 2);
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

        const certificateTemplatePath = resolveBackendAssetPath("assets", "complition certificate.png");
        const templateImage = await loadImage(certificateTemplatePath);
        const regularCondensedFontPath = resolveBackendAssetPath("assets", "fonts", "OpenSansCondensed-Regular.ttf");
        const boldCondensedFontPath = resolveBackendAssetPath("assets", "fonts", "OpenSansCondensed-Bold.ttf");
        const signatureFontPath = resolveBackendAssetPath("assets", "fonts", "Allura-Regular.ttf");

        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const scale = pageWidth / 1920;

        doc.image(certificateTemplatePath, 0, 0, { width: pageWidth, height: pageHeight });

        const measureTextWidth = (text, fontPath, fontSize) => {
            doc.font(fontPath).fontSize(fontSize);
            return doc.widthOfString(text);
        };

        const drawText = (text, x, baselineY, options = {}) => {
            const {
                fontPath,
                fontSize,
                color = '#000000',
                align = 'left',
                baselineFactor = 0.78,
            } = options;

            const topY = baselineY - (fontSize * baselineFactor);
            doc.font(fontPath).fontSize(fontSize).fillColor(color);

            if (align === 'center') {
                const textWidth = measureTextWidth(text, fontPath, fontSize);
                doc.text(text, (pageWidth - textWidth) / 2, topY, { lineBreak: false });
                return;
            }

            doc.text(text, x, topY, { lineBreak: false });
        };

        const drawCenteredSegmentLine = (segments, baselineY) => {
            const widths = segments.map((segment) => measureTextWidth(segment.text, segment.fontPath, segment.fontSize));
            const totalWidth = widths.reduce((sum, width) => sum + width, 0);
            let cursorX = (pageWidth - totalWidth) / 2;

            segments.forEach((segment, index) => {
                drawText(segment.text, cursorX, baselineY, {
                    fontPath: segment.fontPath,
                    fontSize: segment.fontSize,
                    color: segment.color || '#000000',
                    baselineFactor: segment.baselineFactor,
                });
                cursorX += widths[index];
            });
        };

        const titleSize = Math.floor(46 * scale);
        const nameSize = Math.floor(180 * scale);
        const descSize = Math.floor(46 * scale);
        const dateSize = Math.floor(43 * scale);

        drawText("This is proudly presented to", 0, pageHeight * 0.44, {
            fontPath: regularCondensedFontPath,
            fontSize: titleSize,
            color: '#000000',
            align: 'center',
            baselineFactor: 0.84,
        });

        drawText(certificate.name, 0, pageHeight * 0.54, {
            fontPath: signatureFontPath,
            fontSize: nameSize,
            color: '#000000',
            align: 'center',
            baselineFactor: 0.80,
        });

        drawCenteredSegmentLine([
            {
                text: "In recognition of the successful completion of the ",
                fontPath: regularCondensedFontPath,
                fontSize: descSize,
                color: '#000000',
                baselineFactor: 0.84,
            },
            {
                text: `${certificate.jobrole}`,
                fontPath: boldCondensedFontPath,
                fontSize: descSize,
                color: '#000000',
                baselineFactor: 0.84,
            },
            {
                text: " Internship Program",
                fontPath: regularCondensedFontPath,
                fontSize: descSize,
                color: '#000000',
                baselineFactor: 0.84,
            },
        ], pageHeight * 0.61);

        drawText(
            "and in appreciation of outstanding commitment, professionalism, and dedication to both personal and professional growth.",
            0,
            pageHeight * 0.655,
            {
                fontPath: regularCondensedFontPath,
                fontSize: descSize,
                color: '#000000',
                align: 'center',
                baselineFactor: 0.84,
            }
        );

        const qrSize = Math.floor(260 * scale);
        doc.image(styledQrCodeBuffer, pageWidth * 0.065, pageHeight * 0.73, {
            width: qrSize,
            height: qrSize,
        });

        const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const drawLabelValue = (label, value, x, baselineY) => {
            const labelWidth = measureTextWidth(label, regularCondensedFontPath, dateSize);
            drawText(label, x, baselineY, {
                fontPath: regularCondensedFontPath,
                fontSize: dateSize,
                color: '#ffffff',
                baselineFactor: 0.84,
            });
            drawText(value, x + labelWidth, baselineY, {
                fontPath: regularCondensedFontPath,
                fontSize: dateSize,
                color: '#ffffff',
                baselineFactor: 0.84,
            });
        };

        drawLabelValue("Internship Start Date: ", formatDate(certificate.fromDate), pageWidth * 0.28, pageHeight * 0.83);
        drawLabelValue("Internship End Date: ", formatDate(certificate.toDate), pageWidth * 0.28, pageHeight * 0.88);
        drawLabelValue("Id: ", `${certificate._id}`, pageWidth * 0.63, pageHeight * 0.83);
        drawLabelValue("Certificate Issue Date: ", formatDate(new Date()), pageWidth * 0.63, pageHeight * 0.88);

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