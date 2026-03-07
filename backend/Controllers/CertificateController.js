const Certificate = require("../models/certificate");
const User = require("../models/user");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

function normalizeCertificateLookupId(rawCertificateId = "") {
    const normalizedCertificateId = String(rawCertificateId).trim().replace(/^OM[-\s]*/i, "");
    return normalizedCertificateId;
}

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
            certificateId: `OM-${savedCertificate._id}`,
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
        const certId = normalizeCertificateLookupId(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(certId)) {
            return res.status(400).json({ message: "Invalid certificate ID" });
        }

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
            certificateId: `OM-${certificate._id}`,
            certificateUrl: `/certificates/${certificate._id}.pdf`
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ============================================================
// PDFKit-native certificate generation (no canvas dependency)
// ============================================================
async function generateCertificatePDFBuffer(certificate) {
    console.log(`Generating styled certificate for: ${certificate.name}`);
    try {
        const frontendBaseUrl = (process.env.FRONTEND_URL || "https://careers.omsoftwares.in").replace(/\/+$/, "");
        const verifyUrl = `${frontendBaseUrl}/verify/${certificate._id}`;

        // Resolve asset paths
        const templatePath = resolveBackendAssetPath("assets", "complition certificate.png");
        const alluraFontPath = resolveBackendAssetPath("assets", "fonts", "Allura-Regular.ttf");
        const openSansPath = resolveBackendAssetPath("assets", "fonts", "OpenSans_Condensed-Regular.ttf");
        const openSansBoldPath = resolveBackendAssetPath("assets", "fonts", "OpenSans_Condensed-Bold.ttf");

        // A4 landscape dimensions in points (72 points per inch)
        const pageW = 841.89;
        const pageH = 595.28;

        // Create PDF document — A4 landscape, no margins (we draw everything ourselves)
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));

        // 1. Draw background image (fills entire page)
        doc.image(templatePath, 0, 0, { width: pageW, height: pageH });

        // 2. Register custom fonts
        doc.registerFont('Allura', alluraFontPath);
        doc.registerFont('OpenSans', openSansPath);
        doc.registerFont('OpenSansBold', openSansBoldPath);

        // 3. Draw text overlays
        // All positions are relative fractions of page dimensions (matching original canvas layout)

        // "This is proudly presented to"
        doc.font('OpenSans')
            .fontSize(20)
            .fillColor('#000000');
        const titleText = "This is proudly presented to";
        const titleW = doc.widthOfString(titleText);
        doc.text(titleText, (pageW - titleW) / 2, pageH * 0.38, { lineBreak: false });

        // Candidate Name (Allura cursive)
        doc.font('Allura')
            .fontSize(79)
            .fillColor('#000000');
        const nameW = doc.widthOfString(certificate.name);
        doc.text(certificate.name, (pageW - nameW) / 2, pageH * 0.425, { lineBreak: false });

        // Description line 1: "In recognition of the successful completion of the [JOBROLE] Internship Program"
        const descFontSize = 19.45;
        const descY = pageH * 0.58;

        const baseText = "In recognition of the successful completion of the ";
        const jobroleText = `${certificate.jobrole}`;
        const internship = " Internship Program";

        // Measure widths to center the composite line
        doc.font('OpenSans').fontSize(descFontSize);
        const baseW = doc.widthOfString(baseText);
        const internW = doc.widthOfString(internship);
        doc.font('OpenSansBold').fontSize(descFontSize);
        const jobW = doc.widthOfString(jobroleText);

        const totalLineW = baseW + jobW + internW;
        let cursorX = (pageW - totalLineW) / 2;

        doc.font('OpenSans').fontSize(descFontSize).fillColor('#000000');
        doc.text(baseText, cursorX, descY, { lineBreak: false });
        cursorX += baseW;

        doc.font('OpenSansBold').fontSize(descFontSize).fillColor('#000000');
        doc.text(jobroleText, cursorX, descY, { lineBreak: false });
        cursorX += jobW;

        doc.font('OpenSans').fontSize(descFontSize).fillColor('#000000');
        doc.text(internship, cursorX, descY, { lineBreak: false });

        // Description line 2
        doc.font('OpenSans').fontSize(descFontSize).fillColor('#000000');
        const line2 = "and in appreciation of outstanding commitment, professionalism, and dedication to both personal and professional growth.";
        const line2W = doc.widthOfString(line2);
        doc.text(line2, (pageW - line2W) / 2, pageH * 0.625, { lineBreak: false });

        // 4. Draw Styled Vector QR Code directly to PDF (bottom-left area)
        // Original canvas size was 260 * (canvas.width / 1920) => PDF points ≈ 114
        const qrSizePDF = 114;
        const qrX = pageW * 0.065;
        const qrY = pageH * 0.73;

        const qrCodeData = QRCode.create(verifyUrl, { errorCorrectionLevel: 'H' });
        const moduleCount = qrCodeData.modules.size;

        // Settings matching the old canvas proportional design mathematically
        const paddingRatio = 30 / 1200; // 0.025 padding on each edge
        const paddingPDF = qrSizePDF * paddingRatio;
        const effectiveSizePDF = qrSizePDF - (paddingPDF * 2);
        const moduleSizePDF = effectiveSizePDF / moduleCount;

        // Black Base Background for QR
        doc.rect(qrX, qrY, qrSizePDF, qrSizePDF).fill('#000000');

        // Gradient Colors for dots (Lime Green to White)
        const topColor = { r: 214, g: 243, b: 0 };
        const bottomColor = { r: 255, g: 255, b: 255 };

        const getColorAtY = (yIndex) => {
            const t = yIndex / (moduleCount - 1);
            const r = Math.round(topColor.r * (1 - t) + bottomColor.r * t);
            const g = Math.round(topColor.g * (1 - t) + bottomColor.g * t);
            const b = Math.round(topColor.b * (1 - t) + bottomColor.b * t);
            return [r, g, b]; // PDFKit native true-color array format
        };

        const drawFinderPatternPDF = (row, col) => {
            const centerX = qrX + paddingPDF + (col + 3.5) * moduleSizePDF;
            const centerY = qrY + paddingPDF + (row + 3.5) * moduleSizePDF;
            const eyeColor = getColorAtY(row + 3.5);

            // Outer ring
            doc.circle(centerX, centerY, 3.5 * moduleSizePDF).fill(eyeColor);
            // Middle black ring
            doc.circle(centerX, centerY, 2.5 * moduleSizePDF).fill('#111111');
            // Inner eye
            doc.circle(centerX, centerY, 1.5 * moduleSizePDF).fill(eyeColor);
        };

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qrCodeData.modules.get(row, col)) {
                    const isTopLeft = row < 7 && col < 7;
                    const isTopRight = row < 7 && col >= moduleCount - 7;
                    const isBottomLeft = row >= moduleCount - 7 && col < 7;

                    if (isTopLeft || isTopRight || isBottomLeft) {
                        if (row === 0 && col === 0) drawFinderPatternPDF(0, 0);
                        if (row === 0 && col === moduleCount - 7) drawFinderPatternPDF(0, moduleCount - 7);
                        if (row === moduleCount - 7 && col === 0) drawFinderPatternPDF(moduleCount - 7, 0);
                        continue;
                    }

                    const centerX = qrX + paddingPDF + col * moduleSizePDF + moduleSizePDF / 2;
                    const centerY = qrY + paddingPDF + row * moduleSizePDF + moduleSizePDF / 2;
                    const radius = (moduleSizePDF / 2) * 0.95;
                    const dotColor = getColorAtY(row);

                    doc.circle(centerX, centerY, radius).fill(dotColor);
                }
            }
        }

        // 5. Date labels and values (bottom section)
        const dateFontSize = 19;
        const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

        const leftColX = pageW * 0.28;
        const rightColX = pageW * 0.63;
        const topRowY = pageH * 0.78;
        const bottomRowY = pageH * 0.83;

        const drawLabelValue = (label, value, x, y) => {
            doc.font('OpenSans').fontSize(dateFontSize).fillColor('#ffffff');
            doc.text(label, x, y, { lineBreak: false, continued: true });
            doc.text(value, { lineBreak: false });
        };

        drawLabelValue("Internship Start Date: ", formatDate(certificate.fromDate), leftColX, topRowY);
        drawLabelValue("Internship End Date: ", formatDate(certificate.toDate), leftColX, bottomRowY);
        drawLabelValue("Id: ", `OM-${certificate._id}`, rightColX, topRowY);
        drawLabelValue("Certificate Issue Date: ", formatDate(new Date()), rightColX, bottomRowY);

        // Finalize PDF
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