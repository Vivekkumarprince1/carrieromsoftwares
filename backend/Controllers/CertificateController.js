const Certificate = require("../models/certificate");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fontManager = require("../utils/fontManager");

// Initialize fonts using @napi-rs/canvas
fontManager.registerAllFonts(GlobalFonts);

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

// Gen PDF helper
// async function generateCertificatePDF(certificate) {
//     console.log(`PDF for: ${certificate._id}`);
//     try {
 
//         const certDir = path.join(__dirname, "../uploads/certificates");
//         if (!fs.existsSync(certDir)) {
//             console.log(`Create dir`);
//             fs.mkdirSync(certDir, { recursive: true });
//         }
        
//         const outputPath = path.join(certDir, `${certificate._id}.pdf`);
//         console.log(`Output: ${outputPath}`);
        
//         // QR code
//         console.log(`Gen QR`);
//         const qrCodePath = path.join(certDir, `${certificate._id}_qr.png`);
//         const verifyUrl = `https://careers.omsoftwares.in/verify/${certificate._id}`;
//         await QRCode.toFile(qrCodePath, verifyUrl);
//         console.log(`QR done`);
        
//         console.log(`Init canvas`);
        
//         const canvas = createCanvas(842, 595);
//         const ctx = canvas.getContext("2d");
        
        
//         console.log(`Draw bg`);
//         const bgImagePath = path.join(__dirname, "../assets/certificate for om softwares.jpg");
//         const bgImage = await loadImage(bgImagePath);
//         ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        

//         const logoPath = path.join(__dirname, "../assets/logo.png");
//         const logo = await loadImage(logoPath);
//         const logoWidth = 140; // Wider logo
//         const logoHeight = 80; // Less high
//         ctx.drawImage(logo, (canvas.width / 2) - (logoWidth / 2), 25, logoWidth, logoHeight);
 
//         ctx.fillStyle = "#c5f019"; 
//         ctx.font = "bold 50px Arial"; 
//         ctx.textAlign = "center";
//         ctx.fillText(`Certificate`, canvas.width / 2, 150);
        
      
//         ctx.fillStyle = "#ffffff";
//         ctx.font = "24px Arial";
//         ctx.fillText(`Of Achievement`, canvas.width / 2, 190); 
        
//         ctx.font = "25px Arial";
//         ctx.fillText(`Proudly Presented To`, canvas.width / 2, 240);
        
       
//         ctx.font = "bold 36px Arial";
//         ctx.fillStyle = "#ffffff";
//         ctx.fillText(certificate.name, canvas.width / 2, 300);
        
      
//         ctx.beginPath();
//         ctx.strokeStyle = "#84cc16";
//         ctx.lineWidth = 3;
//         ctx.moveTo(canvas.width / 2 - 200, 330);
//         ctx.lineTo(canvas.width / 2 + 200, 330);
//         ctx.stroke();
        
       
//         ctx.strokeStyle = "#ffffff";
//         ctx.lineWidth = 1;
        
//         ctx.fillStyle = "#ffffff";
//         ctx.font = "25px Arial";
//         ctx.fillText(`for completing ${certificate.jobrole} internship at Om Softwares`, canvas.width / 2, 380);
        
       
//         ctx.font = "25px Arial";
//         ctx.fillText(`from ${new Date(certificate.fromDate).toLocaleDateString()} to ${new Date(certificate.toDate).toLocaleDateString()}`, canvas.width / 2, 420);
        
       
//         ctx.font = "20px Arial";
//         ctx.fillStyle = "#ffffff";
//         ctx.textAlign = "center";
        
        
//         const rowY = 480;
         
//         const leftColumnX = canvas.width / 4;
//         ctx.fillText(new Date().toLocaleDateString(), leftColumnX, rowY);
//         ctx.beginPath();
//         ctx.moveTo(leftColumnX - 100, rowY + 20);
//         ctx.lineTo(leftColumnX + 100, rowY + 20);
//         ctx.stroke();
//         ctx.fillText("Date", leftColumnX, rowY + 50); 
        
        
//         const rightColumnX = (canvas.width * 3) / 4;
//         ctx.fillText(certificate.issuedBy, rightColumnX, rowY);
//         ctx.beginPath();
//         ctx.moveTo(rightColumnX - 100, rowY + 20);
//         ctx.lineTo(rightColumnX + 100, rowY + 20);
//         ctx.stroke();
//         ctx.fillText("Signature", rightColumnX, rowY + 50); 
       
//         console.log(`Add QR`);
//         const qrCode = await loadImage(qrCodePath);
//         const qrSize = 90; // Smaller QR code
//         const middleColumnX = canvas.width / 2;
       
//         ctx.drawImage(qrCode, middleColumnX - (qrSize / 2), canvas.height - qrSize - 46, qrSize, qrSize);
        
        
//         ctx.font = "16px Arial";
//         ctx.fillStyle = "#ffffff";
//         ctx.textAlign = "center";
//         ctx.fillText(`Certificate ID: ${certificate._id}`, canvas.width / 2, canvas.height - 20);
        
        
//         console.log(`Create buffer`);
//         const certificateImage = canvas.toBuffer("image/png");
//         const certificateImagePath = path.join(certDir, `${certificate._id}_cert.png`);
//         fs.writeFileSync(certificateImagePath, certificateImage);
//         console.log(`Image saved`);
        
//         console.log(`Create PDF`);
//         const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
//         const writeStream = fs.createWriteStream(outputPath);
//         doc.pipe(writeStream);
        
       
//         doc.image(certificateImagePath, 0, 0, { width: 842 }); 
//         doc.end();
//           // Wait for PDF to be written before returning
//         return new Promise((resolve, reject) => {
//             writeStream.on("finish", () => {
//                 console.log(`PDF creation completed`);
//                 try {
//                     // Clean up temporary files but keep the PDF
//                     fs.unlinkSync(qrCodePath);
//                     fs.unlinkSync(certificateImagePath);
//                     console.log(`Temporary files cleaned up`);
//                     resolve(outputPath);
//                 } catch (cleanupError) {
//                     console.error(`Cleanup error: ${cleanupError}`);
//                     // Still resolve since PDF was created successfully
//                     resolve(outputPath);
//                 }
//             });
            
//             writeStream.on("error", (error) => {
//                 console.error(`PDF write error: ${error}`);
//                 reject(error);
//             });
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         throw error;
//     }
// }

// New memory-based PDF generation for serverless compatibility
async function generateCertificatePDFBuffer(certificate) {
    console.log(`Generating styled certificate for: ${certificate.name}`);
    try {
        const verifyUrl = `https://careers.omsoftwares.in/verify/${certificate._id}`;
        // Generate QR code with advanced style to match the attached image
        const qrOptions = {
            type: 'png',
            width: 320,
            margin: 0,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#d6f300', // lime green dots
                light: '#111111', // black background
            },
            // Customize finder patterns (corners)
            rendererOpts: {
                // Use rounded modules for dots
                shape: 'circle',
            }
        };
        // Generate base QR code
        const qrCodeBuffer = await QRCode.toBuffer(verifyUrl, qrOptions);

        // Draw white corner squares over the QR code (simulate the image's style)
        // This requires drawing on a canvas after loading the QR code image
        const qrCanvas = createCanvas(320, 320);
        const qrCtx = qrCanvas.getContext('2d');
        const qrImg = await loadImage(qrCodeBuffer);
        qrCtx.drawImage(qrImg, 0, 0, 320, 320);
        qrCtx.strokeStyle = '#fff';
        qrCtx.lineWidth = 4;
        // Top-left
        qrCtx.strokeRect(8, 8, 32, 32);
        // Top-right
        qrCtx.strokeRect(320 - 40, 8, 32, 32);
        // Bottom-left
        qrCtx.strokeRect(8, 320 - 40, 32, 32);
        // Bottom-right (optional, not in most QR codes)
        // qrCtx.strokeRect(320 - 40, 320 - 40, 32, 32);
        // Use this canvas as the QR code image
        const styledQrCodeBuffer = qrCanvas.toBuffer('image/png');

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

        // Add detailed description text with increased font size
        const descriptionFont = fontManager.isFontRegistered('Playfair Display') 
            ? fontManager.getFontString(45, 'Playfair Display', 'normal', 'serif')
            : fontManager.isFontRegistered('Britannic')
            ? fontManager.getFontString(45, 'Britannic', 'normal', 'Arial, sans-serif')
            : "45px 'Georgia', serif";
            
        ctx.font = descriptionFont;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        
        // First line of description
        const baseText = "In recognition of the successful completion of the ";
        const jobroleText = `${certificate.jobrole}`;
        const internship = " Internship Program";

        // Measure widths to properly center the combined text
        const baseWidth = ctx.measureText(baseText).width;
        
        // Use FontManager for jobrole text with increased size and maximum weight
        const jobroleFont = fontManager.isFontRegistered('Britannic')
            ? fontManager.getFontString(52, 'Britannic', '900', 'Arial, sans-serif')
            : "900 52px Arial, sans-serif";
        ctx.font = jobroleFont;
        const jobroleWidth = ctx.measureText(jobroleText).width;        // Calculate positions for proper alignment
        const totalWidth = baseWidth + jobroleWidth + ctx.measureText(internship).width;
        let startX = canvas.width / 2 - totalWidth / 2;
        
        // Draw the base text with FontManager
        const baseFont = fontManager.isFontRegistered('Britannic')
            ? fontManager.getFontString(45, 'Britannic', 'normal', 'Arial, sans-serif')
            : "45px Arial, sans-serif";
        ctx.font = baseFont;
        ctx.fillText(baseText, startX + baseWidth / 2, canvas.height * 0.63);
        
        // Draw the jobrole text in bold with increased size
        ctx.font = jobroleFont;
        ctx.fillText(jobroleText, startX + baseWidth + jobroleWidth / 2, canvas.height * 0.63);

        // Draw the internship text after jobrole text
        ctx.font = baseFont;
        const internshipWidth = ctx.measureText(internship).width;
        ctx.fillText(internship, startX + baseWidth + jobroleWidth + internshipWidth / 2, canvas.height * 0.63);

        
        
        // Second line of description with increased font size
        const secondLineFont = fontManager.isFontRegistered('Britannic')
            ? fontManager.getFontString(45, 'Britannic', 'normal', 'Arial, sans-serif')
            : "45px 'Georgia', serif";
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
        const qrCode = await loadImage(qrCodeBuffer);
        const qrSize = 240;
        const qrX = 145;
        const qrY = canvas.height - qrSize - 130;
        ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);

        // ==== DATES & ID (positioned in the template's designated areas) ====
        // Increased font size for better visibility using Britannic font
        const dateFont = fontManager.isFontRegistered('Britannic')
            ? fontManager.getFontString(36, 'Britannic', 'normal', 'Arial, sans-serif')
            : "36px Arial, sans-serif";
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
        ctx.fillText(`${certificate._id}`, rightX - 210, leftY + 13 );
        
        // ctx.fillText(`Certificate Issue Date:`, rightX, leftY + 50);
        ctx.fillText(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), rightX + 105 , leftY + 73);
        
        // Add issued by information
        // if (certificate.issuedBy) {
        //     ctx.fillText(`Issued By: ${certificate.issuedBy}`, rightX, leftY + 100);
        // }

        // Add verification text under QR code
        // ctx.textAlign = "center";
        // ctx.font = "12px Arial";
        // ctx.fillStyle = "#c5f019";
        // ctx.fillText("Can Be Verified At", qrX + qrSize/2, qrY + qrSize + 20);
        // ctx.font = "10px Arial";
        // ctx.fillStyle = "#fff";
        // ctx.fillText("https://careers.omsoftwares.in/verify", qrX + qrSize/2, qrY + qrSize + 35);

        // ==== BOTTOM NOTE (as in original) ====
        // ctx.textAlign = "center";
        // ctx.font = "12px Arial";
        // ctx.fillStyle = "#fff";
        // ctx.fillText("Note: This is a digitally issued certificate and is valid without a physical signature. It can be verified via the QR code provided.", canvas.width / 2, canvas.height - 20);

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

        if (!recipientEmail) {
            console.log(`No email`);
            return res.status(400).json({ message: "Recipient email is required" });
        }

        const certificate = await Certificate.findById(id);
        if (!certificate) {
            console.log(`Cert not found: ${id}`);
            return res.status(404).json({ message: "Certificate not found" });
        }        // Generate PDF in memory for email
        console.log(`Generating PDF for email: ${id}`);
        const pdfBuffer = await generateCertificatePDFBuffer(certificate);

        // Send email with buffer attachment
        await sendCertificateByEmailBuffer(
            recipientEmail, 
            subject || `Certificate: ${certificate.jobrole}`, 
            message || `Congrats on completing your internship in ${certificate.domain}!`,
            certificate.name,
            pdfBuffer,
            `certificate-${certificate._id}.pdf`
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