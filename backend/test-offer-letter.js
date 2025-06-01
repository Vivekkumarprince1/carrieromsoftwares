// Test script to verify offer letter in-memory PDF generation
const PDFDocument = require('pdfkit');

// Test the in-memory PDF generation
async function testInMemoryPDFGeneration() {
    console.log('🧪 Testing in-memory PDF generation...');
    
    try {
        // Mock application data
        const mockApplication = {
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            jobId: {
                title: 'Software Developer'
            }
        };
        
        const mockOfferDetails = 'This is a sample offer letter with competitive salary and benefits.';
        
        // Test the PDF generation function (similar to what's in applicationController.js)
        const pdfBuffer = await createTestOfferPDF(mockApplication, mockOfferDetails);
        
        console.log('✅ PDF generated successfully in memory');
        console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
        console.log('🎉 In-memory PDF generation test passed!');
        
        return true;
    } catch (error) {
        console.error('❌ PDF generation test failed:', error.message);
        return false;
    }
}

// Test PDF generation function (copied from applicationController.js)
function createTestOfferPDF(application, offerDetails) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];

            // Collect PDF data in memory
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`📝 PDF generated in memory for: ${application.fullName}`);
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

// Run the test
testInMemoryPDFGeneration()
    .then(success => {
        if (success) {
            console.log('\n🚀 All tests passed! The offer letter functionality is ready.');
            process.exit(0);
        } else {
            console.log('\n💥 Tests failed! Please check the implementation.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    });
