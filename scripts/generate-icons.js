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

// Generate an SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Outer glowing ring track -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#1E293B" stroke-width="24"/>
  
  <!-- Glowing active ring segment -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="url(#ringGrad)" stroke-width="24"
    stroke-linecap="round" stroke-dasharray="1005" stroke-dashoffset="250"
    transform="rotate(-90 256 256)" filter="url(#glow)"/>
    
  <!-- Center Focus Symbol (Minimal Hourglass / Flame) -->
  <circle cx="256" cy="256" r="18" fill="#38BDF8" />
  <path d="M 256 160 V 210 M 256 302 V 352 M 160 256 H 210 M 302 256 H 352" stroke="#64748B" stroke-width="8" stroke-linecap="round"/>
  
  <!-- Inner pulse ring -->
  <circle cx="256" cy="256" r="64" fill="none" stroke="#818CF8" stroke-width="6" opacity="0.4" stroke-dasharray="12 12"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// Function to draw pixel-by-pixel PNG
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

      // Background gradient (Dark slate/indigo #0B0F19 to #030712)
      const grad = (x + y) / (2 * size);
      const bgR = Math.round(14 * (1 - grad) + 3 * grad);
      const bgG = Math.round(20 * (1 - grad) + 7 * grad);
      const bgB = Math.round(35 * (1 - grad) + 18 * grad);

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Circle distance
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Ring track
      if (dist >= radius - thickness / 2 && dist <= radius + thickness / 2) {
        // Track background
        r = 30;
        g = 41;
        b = 59;

        // Angle for arc (progress 75%)
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        if (angle < Math.PI * 1.5) {
          // Arc gradient from indigo (#818CF8) to cyan (#06B6D4)
          const t = angle / (Math.PI * 1.5);
          r = Math.round(129 * (1 - t) + 6 * t);
          g = Math.round(140 * (1 - t) + 182 * t);
          b = Math.round(248 * (1 - t) + 212 * t);
        }
      }

      // Center dot
      if (dist <= size * 0.045) {
        r = 56;
        g = 189;
        b = 248;
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
