const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, 'public/icons/icon.svg'));
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `public/icons/icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public/favicon.ico'));
  
  console.log('All icons generated successfully!');
}

// Note: This script requires sharp package to be installed
// Run: npm install sharp --save-dev
// Then: node generate-icons.js