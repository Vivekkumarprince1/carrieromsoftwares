const { registerFont } = require("./canvasAdapter");
const path = require("path");
const fs = require("fs");

class FontManager {
    constructor() {
        this.registeredFonts = new Set();
        this.fontDirectory = this.resolveFontDirectory();
    }

    resolveFontDirectory() {
        const candidates = [
            path.join(__dirname, "../assets/fonts"),
            path.join(process.cwd(), "assets/fonts"),
            path.join(process.cwd(), "backend/assets/fonts"),
        ];

        const existingDirectory = candidates.find((candidate) => fs.existsSync(candidate));

        if (existingDirectory) {
            return existingDirectory;
        }

        return candidates[0];
    }

    /**
     * Register a single font
     * @param {string} fontPath - Path to font file
     * @param {string} fontFamily - Font family name
     * @param {string} weight - Font weight (normal, bold, etc.)
     * @param {string} style - Font style (normal, italic, etc.)
     */
    registerFont(fontPath, fontFamily, weight = 'normal', style = 'normal') {
        try {
            const fullPath = path.isAbsolute(fontPath) ? fontPath : path.join(this.fontDirectory, fontPath);

            if (!fs.existsSync(fullPath)) {
                console.error(`Font file not found: ${fullPath}`);
                return false;
            }

            registerFont(fullPath, {
                family: fontFamily,
                weight: weight,
                style: style
            });

            const fontKey = `${fontFamily}-${weight}-${style}`;
            this.registeredFonts.add(fontKey);
            console.log(`✅ Font registered: ${fontFamily} (${weight} ${style})`);
            return true;
        } catch (error) {
            console.error(`❌ Error registering font ${fontFamily}:`, error.message);
            return false;
        }
    }

    /**
     * Register multiple fonts from the fonts directory
     */
    registerAllFonts() {
        const commonFonts = [
            // Existing font (now in fonts directory)
            { file: "Britannic D Extra Light.ttf", family: "Britannic", weight: "normal" },

            // Add these if you download them
            { file: "Allura-Regular.ttf", family: "Allura", weight: "normal" },
            { file: "PlayfairDisplay-Regular.ttf", family: "Playfair Display", weight: "normal" },
            { file: "Montserrat-Regular.ttf", family: "Montserrat", weight: "normal" },
            { file: "Montserrat-Light.ttf", family: "Montserrat", weight: "300" },
            { file: "Montserrat-Medium.ttf", family: "Montserrat", weight: "500" },
            { file: "Montserrat-SemiBold.ttf", family: "Montserrat", weight: "600" },
            { file: "Montserrat-Bold.ttf", family: "Montserrat", weight: "bold" },
            { file: "GreatVibes-Regular.ttf", family: "Great Vibes", weight: "normal" },
            { file: "DancingScript-Regular.ttf", family: "Dancing Script", weight: "normal" },
            { file: "OpenSansCondensed-Light.ttf", family: "Open Sans Condensed", weight: "300" },
            { file: "OpenSansCondensed-Regular.ttf", family: "Open Sans Condensed", weight: "normal" },
            { file: "OpenSansCondensed-Bold.ttf", family: "Open Sans Condensed", weight: "bold" },
        ];

        let registeredCount = 0;
        commonFonts.forEach(font => {
            if (this.registerFont(font.file, font.family, font.weight)) {
                registeredCount++;
            }
        });

        console.log(`\n🎨 Font Registration Complete: ${registeredCount}/${commonFonts.length} fonts registered\n`);
        return registeredCount;
    }

    /**
     * Get font string for canvas context
     * @param {number} size - Font size in pixels
     * @param {string} family - Font family name
     * @param {string} weight - Font weight
     * @param {string} fallback - Fallback font family
     */
    getFontString(size, family, weight = 'normal', fallback = 'Arial, sans-serif') {
        const weightString = weight !== 'normal' ? `${weight} ` : '';
        return `${weightString}${size}px '${family}', ${fallback}`;
    }

    getSafeCanvasFont(size, preferredFamily, options = {}) {
        const { weight = 'normal', fallbackFamily = 'Arial' } = options;
        const weightString = weight !== 'normal' ? `${weight} ` : '';

        if (preferredFamily && this.isFontRegistered(preferredFamily, weight)) {
            return `${weightString}${size}px '${preferredFamily}'`;
        }

        return `${weightString}${size}px '${fallbackFamily}'`;
    }

    /**
     * Check if a font is registered
     * @param {string} fontFamily - Font family name
     * @param {string} weight - Font weight
     * @param {string} style - Font style
     */
    isFontRegistered(fontFamily, weight = 'normal', style = 'normal') {
        const fontKey = `${fontFamily}-${weight}-${style}`;
        return this.registeredFonts.has(fontKey);
    }

    /**
     * List all registered fonts
     */
    listRegisteredFonts() {
        console.log('\n📋 Registered Fonts:');
        this.registeredFonts.forEach(font => {
            console.log(`  • ${font}`);
        });
        console.log('');
    }

    /**
     * Download a font from Google Fonts (requires additional setup)
     * This is a placeholder for future implementation
     */
    async downloadGoogleFont(fontName, weights = ['400']) {
        console.log(`🔄 Google Fonts download for '${fontName}' would go here`);
        console.log('For now, please manually download from https://fonts.google.com/');
        return false;
    }
}

// Create and export singleton instance
const fontManager = new FontManager();

module.exports = fontManager;
