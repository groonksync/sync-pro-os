import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar cabeceras de respuesta para XML y caché
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Variables de entorno de Supabase no configuradas.</description>
  </channel>
</rss>`);
  }

  // Instanciar cliente de Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Consultar todos los productos
    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generar XML con formato RSS 2.0 de Meta Commerce
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Catalogo SyncPro</title>
    <link>https://sync-pro-os.vercel.app</link>
    <description>Feed automático de productos de SyncPro para Meta / WhatsApp Business</description>
`;

    if (productos && productos.length > 0) {
      productos.forEach((p) => {
        // ID único del producto
        const id = p.id || p.codigo || p.sku;
        
        // Limpiar textos y escapar caracteres especiales XML
        const title = escapeXml(p.nombre || '');
        const description = escapeXml(p.ficha_tecnica || p.descripcion || 'Sin descripción');
        const price = `${parseFloat(p.precio_venta || 0).toFixed(2)} BOB`; // Bolivianos
        
        // Disponibilidad basada en stock
        const stock = parseInt(p.stock_actual || 0);
        const availability = stock > 0 ? 'in stock' : 'out of stock';
        
        // Imagen principal y adicionales
        const imageLink = p.imagen || '';
        const additionalImages = (p.imagenes || [])
          .filter(img => img && img !== imageLink)
          .map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
          .join('\n        ');

        // Categoría y marca
        const googleProductCategory = escapeXml(p.categoria || 'Apparel & Accessories');
        const brand = escapeXml(p.marca || 'Inefable');
        
        // SKU / Código
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

    return res.status(200).send(xml);

  } catch (error) {
    console.error('Error al generar catálogo de Meta:', error);
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Ocurrió un error al obtener los productos: ${escapeXml(error.message)}</description>
  </channel>
</rss>`);
  }
}

// Función auxiliar para escapar caracteres especiales XML de forma segura
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
