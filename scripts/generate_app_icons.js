const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createSvgHtml(size) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; background: #0c0d12; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  svg { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Fondo enriquecido con sutil gradiente radial/lineal para profundidad cinematográfica -->
    <radialGradient id="crGlowBg" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#1f2130"/>
      <stop offset="55%" stop-color="#12131b"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </radialGradient>

    <!-- Gradiente oficial CineRewind: Rubí carmesí a mandarina cálida -->
    <linearGradient id="crGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="45%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>

    <!-- Resplandor luminoso neon cinematografico -->
    <filter id="crGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#e11d48" flood-opacity="0.55"/>
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#fb7185" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Fondo sólido 100% que llena la pantalla (iOS aplica su squircle sin esquinas negras) -->
  <rect width="512" height="512" fill="url(#crGlowBg)"/>

  <!-- Flechas rewind icónicas de CineRewind -->
  <g filter="url(#crGlow)">
    <path d="M246 148 L114 256 L246 364 V300 L194 256 L246 212 V148 Z" fill="url(#crGrad)"/>
    <path d="M398 148 L266 256 L398 364 V300 L346 256 L398 212 V148 Z" fill="url(#crGrad)"/>
  </g>
</svg>
</body>
</html>`;
}

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'logo.png', size: 512 } // Also update logo.png to official branding
];

for (const item of sizes) {
  const htmlFile = path.resolve(__dirname, `temp_${item.size}.html`);
  const outFile = path.resolve(__dirname, '../client/public', item.name);
  
  fs.writeFileSync(htmlFile, createSvgHtml(item.size), 'utf8');
  
  const cmd = `${chromePath} --headless --disable-gpu --screenshot="${outFile}" --window-size=${item.size},${item.size} --hide-scrollbars "file:///${htmlFile.replace(/\\/g, '/')}"`;
  console.log(`Generating ${item.name} (${item.size}x${item.size})...`);
  execSync(cmd);
  
  fs.unlinkSync(htmlFile);
}

console.log('All icons generated successfully!');
