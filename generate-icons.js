/**
 * generate-icons.js — Run once with Node.js to generate PWA icons
 * 
 * Usage: node generate-icons.js
 * Requires: nothing (pure Node.js Canvas API via inline SVG + browser or use sharp if available)
 * 
 * Since this runs at dev time, we use a simple Canvas fallback.
 * In production just replace assets/icons/ with your own PNGs.
 */

const { createCanvas } = (() => {
  try { return require('canvas'); }
  catch { return { createCanvas: null }; }
})();

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // Background
  ctx.fillStyle = '#2d2d2d';
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.18);
  ctx.fill();

  // Grid cells (simplified telar pattern)
  const COLS = 5, ROWS = 5;
  const PAD = s * 0.12;
  const cellW = (s - PAD * 2) / COLS;
  const cellH = (s - PAD * 2) / ROWS;
  const pattern = [
    [0,1,0,1,0],
    [1,0,1,0,1],
    [0,1,1,1,0],
    [1,0,1,0,1],
    [0,1,0,1,0],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = pattern[r][c] ? '#7c6af0' : '#e8d5b7';
      const x = PAD + c * cellW + 1;
      const y = PAD + r * cellH + 1;
      ctx.fillRect(x, y, cellW - 2, cellH - 2);
    }
  }

  return canvas;
}

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

if (createCanvas) {
  [192, 512].forEach((size) => {
    const canvas = drawIcon(size);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buf);
    console.log(`Generated icon-${size}.png`);
  });
} else {
  console.log('canvas package not found. Using fallback SVG icons.');
  // Fallback: write SVG placeholder icons (browsers accept SVG for some icon uses)
  const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size*0.18}" fill="#2d2d2d"/>
  <rect x="${size*0.13}" y="${size*0.13}" width="${size*0.33}" height="${size*0.33}" fill="#7c6af0"/>
  <rect x="${size*0.54}" y="${size*0.13}" width="${size*0.33}" height="${size*0.33}" fill="#e8d5b7"/>
  <rect x="${size*0.13}" y="${size*0.54}" width="${size*0.33}" height="${size*0.33}" fill="#e8d5b7"/>
  <rect x="${size*0.54}" y="${size*0.54}" width="${size*0.33}" height="${size*0.33}" fill="#7c6af0"/>
</svg>`;
  [192, 512].forEach((size) => {
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), svgIcon(size));
    console.log(`Wrote SVG placeholder icon-${size}.png`);
  });
}

