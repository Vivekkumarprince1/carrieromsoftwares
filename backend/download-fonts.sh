#!/bin/bash

# Google Fonts Download Script for Certificate Generation
# This script helps download popular fonts for certificate generation

FONTS_DIR="./assets/fonts"

echo "🎨 Certificate Fonts Download Script"
echo "===================================="

# Create fonts directory if it doesn't exist
mkdir -p "$FONTS_DIR"

echo "📁 Fonts directory: $FONTS_DIR"
echo ""

# Function to download a font from Google Fonts
download_font() {
    local font_name=$1
    local font_file=$2
    local font_url=$3
    
    echo "⬇️  Downloading $font_name..."
    
    if [ -f "$FONTS_DIR/$font_file" ]; then
        echo "   ✅ $font_file already exists, skipping..."
    else
        curl -L "$font_url" -o "$FONTS_DIR/$font_file"
        if [ $? -eq 0 ]; then
            echo "   ✅ Downloaded: $font_file"
        else
            echo "   ❌ Failed to download: $font_file"
        fi
    fi
    echo ""
}

echo "🚀 Starting font downloads..."
echo ""

# Popular certificate fonts from Google Fonts
# Note: These are example URLs - actual Google Fonts URLs may vary

echo "📝 Elegant Script Fonts:"
echo "========================"

# Allura - Elegant script font
download_font "Allura" "Allura-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/allura/Allura-Regular.ttf"

# Great Vibes - Elegant script font
download_font "Great Vibes" "GreatVibes-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf"

# Dancing Script - Casual script font
download_font "Dancing Script Regular" "DancingScript-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf"

echo "📖 Professional Serif Fonts:"
echo "============================"

# Playfair Display - Elegant serif
download_font "Playfair Display Regular" "PlayfairDisplay-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf"

# Crimson Text - Classic book font
download_font "Crimson Text Regular" "CrimsonText-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/crimsontext/CrimsonText-Regular.ttf"

echo "🏢 Clean Sans-Serif Fonts:"
echo "=========================="

# Montserrat - Modern, geometric
download_font "Montserrat Regular" "Montserrat-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf"

# Open Sans - Friendly, readable
download_font "Open Sans Regular" "OpenSans-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/opensans/OpenSans%5Bwght%5D.ttf"

echo "🎉 Font download process completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check the $FONTS_DIR directory for downloaded fonts"
echo "2. Run 'node test-fonts.js' to test font registration"
echo "3. Restart your application to load new fonts"
echo ""
echo "💡 If some downloads failed, you can manually download from:"
echo "   https://fonts.google.com/"
echo ""
echo "🔧 Manual download process:"
echo "   1. Go to https://fonts.google.com/"
echo "   2. Search for font name"
echo "   3. Click 'Download family'"
echo "   4. Extract .ttf files to $FONTS_DIR"
