# Font Library for Certificate Generation

## How to Add External Fonts

### Method 1: Local Font Files (Recommended for Production)

1. **Download Font Files**: Download `.ttf`, `.otf`, `.woff`, or `.woff2` font files
2. **Place in fonts directory**: Put the font files in this `backend/assets/fonts/` directory
3. **Register in Controller**: Add font registration in `CertificateController.js`

#### Popular Free Fonts for Certificates:

**Elegant Script Fonts:**
- **Allura** - Download from Google Fonts
- **Great Vibes** - Elegant script font
- **Dancing Script** - Casual script font
- **Pacifico** - Fun, casual font

**Professional Serif Fonts:**
- **Playfair Display** - Elegant serif
- **Crimson Text** - Classic book font
- **Lora** - Modern serif

**Clean Sans-Serif Fonts:**
- **Montserrat** - Modern, geometric
- **Open Sans** - Friendly, readable
- **Roboto** - Google's signature font

### Example Font Registration:

```javascript
// In CertificateController.js
try {
    // Register multiple fonts
    registerFont(path.join(__dirname, "../assets/fonts/Allura-Regular.ttf"), { family: 'Allura' });
    registerFont(path.join(__dirname, "../assets/fonts/PlayfairDisplay-Regular.ttf"), { family: 'Playfair Display' });
    registerFont(path.join(__dirname, "../assets/fonts/Montserrat-Bold.ttf"), { family: 'Montserrat', weight: 'bold' });
    
    console.log('All fonts registered successfully');
} catch (error) {
    console.error('Error registering fonts:', error);
}
```

### Usage in Canvas:

```javascript
// For elegant name styling
ctx.font = "bold 185px 'Allura', cursive";

// For professional text
ctx.font = "35px 'Playfair Display', serif";

// For modern clean text
ctx.font = "32px 'Montserrat', sans-serif";
```

### Method 2: Google Fonts CDN (Not Recommended for Server-Side)

This method doesn't work well with Node.js Canvas as it's designed for browsers.

### Method 3: System Fonts

You can also use system fonts that are commonly available:

```javascript
// Common system fonts
ctx.font = "bold 185px 'Times New Roman', serif"; // Classic
ctx.font = "35px 'Arial Black', sans-serif";      // Bold
ctx.font = "32px 'Georgia', serif";               // Elegant
```

## Current Registered Fonts:

- ✅ **Britannic** (Britannic D Extra Light.ttf)

## To Add More Fonts:

1. Download font files from [Google Fonts](https://fonts.google.com/)
2. Place `.ttf` files in this directory
3. Update font registration in `CertificateController.js`
4. Test with different font weights and styles
