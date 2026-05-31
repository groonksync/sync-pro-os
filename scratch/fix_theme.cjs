const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../src/views');

// 1. Corregir EditorVideo.jsx
const editorVideoPath = path.join(viewsDir, 'EditorVideo.jsx');
if (fs.existsSync(editorVideoPath)) {
  let content = fs.readFileSync(editorVideoPath, 'utf8');
  
  // Reemplazar el fondo principal del contenedor por t.bg
  content = content.replace(
    `style={{ backgroundColor: '#141414', color: t.text }}`,
    `style={{ backgroundColor: t.bg, color: t.text }}`
  );
  
  // Reemplazar la barra de navegación por t.panel
  content = content.replace(
    `style={{ backgroundColor: '#141414', borderBottom: \`1px solid \${t.border}\` }}`,
    `style={{ backgroundColor: t.panel, borderBottom: \`1px solid \${t.border}\` }}`
  );
  
  // Reemplazar otros style={{ backgroundColor: '#141414' ... }}
  content = content.replace(/backgroundColor:\s*'#141414'/g, 'backgroundColor: t.panel');
  content = content.replace(/backgroundColor:\s*"#141414"/g, 'backgroundColor: t.panel');
  
  fs.writeFileSync(editorVideoPath, content, 'utf8');
  console.log('EditorVideo.jsx actualizado con éxito.');
}

// 2. Corregir Prestamos.jsx (por si quedó alguna otra coincidencia)
const prestamosPath = path.join(viewsDir, 'Prestamos.jsx');
if (fs.existsSync(prestamosPath)) {
  let content = fs.readFileSync(prestamosPath, 'utf8');
  content = content.replace(/backgroundColor:\s*'#141414'/g, 'backgroundColor: t.panel');
  fs.writeFileSync(prestamosPath, content, 'utf8');
  console.log('Prestamos.jsx actualizado con éxito.');
}

// 3. Corregir CommandCenter.jsx (por si quedó alguna otra coincidencia)
const ccPath = path.join(viewsDir, 'CommandCenter.jsx');
if (fs.existsSync(ccPath)) {
  let content = fs.readFileSync(ccPath, 'utf8');
  content = content.replace(/backgroundColor:\s*'#141414'/g, 'backgroundColor: t.panel');
  fs.writeFileSync(ccPath, content, 'utf8');
  console.log('CommandCenter.jsx actualizado con éxito.');
}
