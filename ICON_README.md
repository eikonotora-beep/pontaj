# Application Icon Setup

## Current Status
The app needs proper icon files for the installer. Placeholder icons are included but should be replaced with custom designs.

## Required Icon Files

### Windows
- **icon.ico** - Windows installer and app icon
  - Should contain multiple sizes: 16x16, 32x32, 48x48, 256x256
  - Format: ICO
  - Location: `public/icon.ico`

### macOS (optional)
- **icon.icns** - macOS app bundle icon
  - Contains multiple resolutions
  - Format: ICNS
  - Location: `public/icon.icns`

### Linux (optional)
- **icon.png** - Linux icon
  - Recommended size: 512x512 or 1024x1024
  - Format: PNG with transparency
  - Location: `public/icon.png`

## Creating Icons

### Option 1: Online Tools (Easiest)
1. Create your icon design as a PNG (512x512 or larger, square)
2. Use online converters:
   - **ICO**: https://icoconvert.com/
   - **ICNS**: https://cloudconvert.com/png-to-icns
   - **PNG**: Just save your design as PNG

### Option 2: Using Icon Generator Tools
- **electron-icon-builder**: npm package to generate all formats from one PNG
  ```bash
  npm install --save-dev electron-icon-builder
  npx electron-icon-builder --input=./icon-source.png --output=./public
  ```

### Option 3: Design Software
- Create in Photoshop, GIMP, or Figma
- Export to required formats
- Use ImageMagick for conversions

## Icon Design Tips
- Use simple, recognizable shapes
- Should work at small sizes (16x16)
- Consider using a calendar or clock theme for Pontaj
- Use transparency for rounded corners
- Test on both light and dark backgrounds

## Installing Icons
1. Replace the placeholder files in the `public/` directory
2. Ensure filenames match:
   - `icon.ico` for Windows
   - `icon.icns` for macOS
   - `icon.png` for Linux
3. Rebuild the app: `npm run dist`

## Current Placeholder
The current placeholder is a basic icon. Replace it with your custom design before distributing the app.
