const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

// SVG maskable (Full bleed: fondo 100% hasta los bordes, sin márgenes transparentes)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="crGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="50%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#FB923C"/>
    </linearGradient>
    <linearGradient id="crBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1E24"/>
      <stop offset="100%" stop-color="#0E0F14"/>
    </linearGradient>
    <filter id="crGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#E11D48" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Fondo sólido completo 100% para que Android recorte directo sin marco blanco -->
  <rect width="100" height="100" fill="url(#crBg)"/>

  <!-- Flechas rewind icónicas en la Safe Zone -->
  <g filter="url(#crGlow)">
    <path d="M48 30L26 50L48 70V58L39 50L48 42V30Z" fill="url(#crGrad)"/>
    <path d="M72 30L50 50L72 70V58L63 50L72 42V30Z" fill="url(#crGrad)"/>
  </g>
</svg>`;

function renderSvg(svgText, outFile, size, bg = '#0E0F14') {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${size}px;
    height: ${size}px;
    background: ${bg};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
</head>
<body>
${svgText}
</body>
</html>`;

  const htmlPath = path.resolve(__dirname, `temp_${size}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  
  const cmd = `${chromePath} --headless --disable-gpu --screenshot="${outFile}" --window-size=${size},${size} --hide-scrollbars "file:///${htmlPath.replace(/\\/g, '/')}"`;
  execSync(cmd);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log(`Rendered ${path.basename(outFile)} (${size}x${size})`);
}

const publicDir = path.resolve(__dirname, '../client/public');

// Guardar SVG maskable oficial en public/
fs.writeFileSync(path.resolve(publicDir, 'logo-maskable.svg'), maskableSvg, 'utf8');
console.log('Saved logo-maskable.svg');

// Renderizar versiones PNG Maskable (Full Bleed - CERO márgenes blancos en Android e iOS)
renderSvg(maskableSvg, path.resolve(publicDir, 'icon-maskable-512.png'), 512);
renderSvg(maskableSvg, path.resolve(publicDir, 'icon-maskable-192.png'), 192);
renderSvg(maskableSvg, path.resolve(publicDir, 'apple-touch-icon.png'), 180);
renderSvg(maskableSvg, path.resolve(publicDir, 'icon-512.png'), 512);
renderSvg(maskableSvg, path.resolve(publicDir, 'icon-192.png'), 192);
renderSvg(maskableSvg, path.resolve(publicDir, 'logo.png'), 512);

console.log('Todos los iconos full-bleed completados exitosamente!');
