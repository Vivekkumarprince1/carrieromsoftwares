const fontManager = require("./utils/fontManager");
const { createCanvas } = require("canvas");

/**
 * Test script to preview fonts for certificate generation
 */
function testFonts() {
    console.log("🧪 Testing Font Registration...\n");
    
    // Register all available fonts
    fontManager.registerAllFonts();
    
    // List registered fonts
    fontManager.listRegisteredFonts();
    
    // Test canvas with different fonts
    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext('2d');
    
    const testFonts = [
        { name: 'Allura', size: 48, sample: 'John Doe' },
        { name: 'Great Vibes', size: 48, sample: 'Certificate' },
        { name: 'Playfair Display', size: 24, sample: 'In recognition of completion' },
        { name: 'Montserrat', size: 20, sample: 'Professional Development' },
        { name: 'Britannic', size: 32, sample: 'OM Softwares' }
    ];
    
    console.log("📝 Font Preview Test:");
    console.log("=".repeat(50));
    
    testFonts.forEach((font, index) => {
        const y = 40 + (index * 30);
        
        try {
            if (fontManager.isFontRegistered(font.name)) {
                ctx.font = fontManager.getFontString(font.size, font.name);
                ctx.fillStyle = '#000';
                ctx.fillText(`${font.sample} (${font.name})`, 20, y);
                console.log(`✅ ${font.name}: Working`);
            } else {
                // Fallback font
                ctx.font = `${font.size}px Arial`;
                ctx.fillStyle = '#888';
                ctx.fillText(`${font.sample} (Arial fallback)`, 20, y);
                console.log(`⚠️  ${font.name}: Not found, using fallback`);
            }
        } catch (error) {
            console.log(`❌ ${font.name}: Error - ${error.message}`);
        }
    });
    
    console.log("\n" + "=".repeat(50));
    console.log("🎨 To add missing fonts:");
    console.log("1. Download from https://fonts.google.com/");
    console.log("2. Place .ttf files in backend/assets/fonts/");
    console.log("3. Restart the application");
    console.log("=".repeat(50));
    
    return canvas;
}

// Test certificate generation with sample data
function testCertificateGeneration() {
    console.log("\n🧪 Testing Certificate Generation with Sample Data...\n");
    
    const sampleCertificate = {
        _id: '60d5f484f0b6c72d88f7a123',
        name: 'John Doe',
        jobrole: 'Full Stack Developer',
        domain: 'Web Development',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-06-30'),
        issuedBy: 'OM Softwares'
    };
    
    console.log("Sample Certificate Data:");
    console.log(JSON.stringify(sampleCertificate, null, 2));
    
    // Here you could test the actual generateCertificatePDFBuffer function
    console.log("\n✅ Certificate generation ready to test with sample data");
    console.log("💡 Tip: Use this data in your API testing tools like Postman");
    
    return sampleCertificate;
}

if (require.main === module) {
    console.log("🎨 Font Manager Test Suite");
    console.log("=" .repeat(50));
    
    testFonts();
    testCertificateGeneration();
}

module.exports = {
    testFonts,
    testCertificateGeneration
};
