const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const svgContent = fs.readFileSync(path.resolve(__dirname, '../client/public/logo.svg'), 'utf8');

function render(outFile, size, bg) {
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
${svgContent}
</body>
</html>`;

  const htmlPath = path.resolve(__dirname, `temp_${size}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  
  const bgFlag = bg === 'transparent' ? '--default-background-color=00000000' : '';
  const cmd = `${chromePath} --headless --disable-gpu --screenshot="${outFile}" --window-size=${size},${size} ${bgFlag} --hide-scrollbars "file:///${htmlPath.replace(/\\/g, '/')}"`;
  execSync(cmd);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log(`Rendered ${path.basename(outFile)} (${size}x${size}, bg: ${bg})`);
}

const publicDir = path.resolve(__dirname, '../client/public');

// 1. Apple Touch Icon: 180x180 px renderizado fiel de logo.svg con fondo #0E0F14 para compatibilidad total iOS
render(path.resolve(publicDir, 'apple-touch-icon.png'), 180, '#0E0F14');

// 2. Iconos estándar PWA: renderizados 100% idénticos a logo.svg con transparencia original
render(path.resolve(publicDir, 'icon-192.png'), 192, 'transparent');
render(path.resolve(publicDir, 'icon-512.png'), 512, 'transparent');
render(path.resolve(publicDir, 'logo.png'), 512, 'transparent');

// Limpiar archivos de prueba en scripts/
['test_svg.png', 'test_dark.png', 'generate_app_icons.js'].forEach(f => {
  const p = path.resolve(__dirname, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

console.log('Todos los iconos actualizados con el logo.svg original!');
