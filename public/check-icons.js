// Icon Conversion Helper Script
// This script helps convert SVG to PNG format for the application icon

const fs = require('fs');
const path = require('path');

console.log('=================================');
console.log('📦 Pontaj Calendar - Icon Setup');
console.log('=================================\n');

const iconFiles = {
  svg: path.join(__dirname, 'icon.svg'),
  png: path.join(__dirname, 'icon.png'),
  ico: path.join(__dirname, 'icon.ico')
};

console.log('Checking icon files...\n');

// Check which files exist
Object.entries(iconFiles).forEach(([type, filepath]) => {
  if (fs.existsSync(filepath)) {
    console.log(`✅ ${type.toUpperCase()} icon found: ${path.basename(filepath)}`);
  } else {
    console.log(`❌ ${type.toUpperCase()} icon missing: ${path.basename(filepath)}`);
  }
});

console.log('\n=================================');
console.log('📝 Next Steps:');
console.log('=================================\n');

if (!fs.existsSync(iconFiles.ico)) {
  console.log('To create a Windows .ico file:');
  console.log('1. Create a 512x512 PNG image of your icon');
  console.log('2. Visit: https://icoconvert.com/');
  console.log('3. Upload your PNG and download the .ico');
  console.log('4. Save as: public/icon.ico');
  console.log('');
}

if (!fs.existsSync(iconFiles.png)) {
  console.log('To create a PNG icon:');
  console.log('1. Open icon.svg in a graphics program (Inkscape, GIMP, etc.)');
  console.log('2. Export as PNG at 512x512 pixels');
  console.log('3. Save as: public/icon.png');
  console.log('');
  console.log('Or use an online converter:');
  console.log('   https://cloudconvert.com/svg-to-png');
  console.log('');
}

console.log('=================================');
console.log('🚀 Ready to build installer?');
console.log('=================================\n');
console.log('Run: npm run dist');
console.log('');
console.log('Note: The app will build without custom icons,');
console.log('but adding them improves the professional appearance.');
console.log('');
