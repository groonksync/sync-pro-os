import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.');
  console.error('Ejecuta: node --env-file=.env build-catalog.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateStaticFeed() {
  console.log('Iniciando generación del catálogo estático...');
  try {
    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Catalogo SyncPro</title>
    <link>https://sync-pro-os.vercel.app</link>
    <description>Feed estático de productos de SyncPro para Meta / WhatsApp Business</description>
`;

    if (productos && productos.length > 0) {
      productos.forEach((p) => {
        const id = p.id || p.codigo || p.sku;
        const title = escapeXml(p.nombre || '');
        const description = escapeXml(p.ficha_tecnica || p.descripcion || 'Sin descripción');
        const price = `${parseFloat(p.precio_venta || 0).toFixed(2)} BOB`;
        
        const stock = parseInt(p.stock_actual || 0);
        const availability = stock > 0 ? 'in stock' : 'out of stock';
        
        const imageLink = p.imagen || '';
        const additionalImages = (p.imagenes || [])
          .filter(img => img && img !== imageLink)
          .map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
          .join('\n        ');

        const googleProductCategory = escapeXml(p.categoria || 'Apparel & Accessories');
        const brand = escapeXml(p.marca || 'Inefable');
        const mpn = escapeXml(p.sku || p.codigo || id);

        xml += `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>https://sync-pro-os.vercel.app</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      ${additionalImages ? additionalImages : ''}
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${googleProductCategory}</g:google_product_category>
      <g:mpn>${mpn}</g:mpn>
    </item>\n`;
      });
    }

    xml += `  </channel>
</rss>`;

    const destDir = path.resolve('public');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, 'meta-catalog.xml');
    
    fs.writeFileSync(destPath, xml, 'utf8');
    console.log(`¡Éxito! Catálogo XML generado en: ${destPath}`);

  } catch (error) {
    console.error('Error al generar el archivo XML:', error);
  }
}

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

generateStaticFeed();