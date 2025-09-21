const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content for the icon
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3B82F6"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">S</text>
</svg>
`;

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const iconDir = path.join(__dirname, '..', 'public', 'icons');
  
  // Ensure directory exists
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  // Save SVG file
  fs.writeFileSync(path.join(iconDir, 'icon.svg'), svgContent);

  // Generate PNG icons for each size
  for (const size of sizes) {
    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(path.join(iconDir, `icon-${size}x${size}.png`));
      
      console.log(`✅ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating icon-${size}x${size}.png:`, error);
    }
  }

  console.log('✨ All icons generated successfully!');
}

generateIcons().catch(console.error);