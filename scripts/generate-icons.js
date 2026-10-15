import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate pure black-and-white monochrome SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Deep black background -->
  <rect width="512" height="512" rx="112" fill="#000000"/>
  
  <!-- Inactive track ring #292929 -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#292929" stroke-width="26"/>
  
  <!-- Active pure white ring segment #FFFFFF -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#FFFFFF" stroke-width="26"
    stroke-linecap="round" stroke-dasharray="1005" stroke-dashoffset="250"
    transform="rotate(-90 256 256)"/>
    
  <!-- Center Focus Minimal Dot -->
  <circle cx="256" cy="256" r="18" fill="#FFFFFF" />
  
  <!-- Subtle minimal crosshairs in #505050 -->
  <path d="M 256 160 V 205 M 256 307 V 352 M 160 256 H 205 M 307 256 H 352" stroke="#505050" stroke-width="8" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// Function to draw pixel-by-pixel pure monochrome PNG
function generatePng(size, filename) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * 0.38;
  const thickness = size * 0.055;
  const cornerRadius = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Rounded rect mask for app icon
      const dxCorner = Math.max(0, Math.abs(x - center) - (center - cornerRadius));
      const dyCorner = Math.max(0, Math.abs(y - center) - (center - cornerRadius));
      const cornerDist = Math.sqrt(dxCorner * dxCorner + dyCorner * dyCorner);
      
      if (cornerDist > cornerRadius) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Pure deep black background (#000000)
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 255;

      // Circle distance
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Ring track
      if (dist >= radius - thickness / 2 && dist <= radius + thickness / 2) {
        // Inactive track (#292929)
        r = 41;
        g = 41;
        b = 41;

        // Angle for arc (progress ~75%)
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        if (angle < Math.PI * 1.5) {
          // Pure white active arc (#FFFFFF)
          r = 255;
          g = 255;
          b = 255;
        }
      }

      // Center dot
      if (dist <= size * 0.045) {
        r = 255;
        g = 255;
        b = 255;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

generatePng(192, 'pwa-192x192.png');
generatePng(512, 'pwa-512x512.png');
generatePng(512, 'maskable-icon-512x512.png');
generatePng(180, 'apple-touch-icon.png');
