// api/meta-catalog.js
// Función serverless de Vercel — genera el feed XML de productos para Meta Commerce Manager
// URL pública: https://sync-pro-os.vercel.app/api/meta-catalog

import { createClient } from '@supabase/supabase-js';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SUPABASE_URL    = process.env.VITE_SUPABASE_URL    || process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const CATALOG_BASE_URL = 'https://sync-pro-os.vercel.app';

// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Escapa caracteres especiales para que el XML sea válido */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formatea el precio en el formato requerido por Meta: "NNN.NN DOP"
 * Meta Commerce Manager requiere el precio con código ISO 4217 (DOP = Peso Dominicano)
 */
function formatPrice(precio) {
  const num = parseFloat(precio) || 0;
  return `${num.toFixed(2)} BOB`;
}

/**
 * Determina la disponibilidad de un producto basado en su stock y estado
 */
function getAvailability(producto) {
  if (!producto) return 'out of stock';
  const stock = parseInt(producto.stock_actual) || 0;
  const estado = (producto.estado || '').toLowerCase();
  if (estado === 'agotado' || stock <= 0) return 'out of stock';
  if (estado === 'descontinuado') return 'discontinued';
  return 'in stock';
}

/**
 * Construye la URL del producto en el catálogo público
 * Se usa el SKU o el código para identificar el producto en la URL
 */
function getProductUrl(producto) {
  if (producto.enlace_compra && producto.enlace_compra.startsWith('http')) {
    return producto.enlace_compra;
  }
  if (producto.metadata?.link_compra && producto.metadata.link_compra.startsWith('http')) {
    return producto.metadata.link_compra;
  }
  const id = producto.id || producto.sku || producto.codigo || '';
  return `${CATALOG_BASE_URL}/catalogo?producto=${encodeURIComponent(id)}`;
}

/**
 * Obtiene la imagen principal del producto.
 * Prioriza el campo 'imagen' y si no existe, el primero de 'imagenes' (array).
 */
function getMainImage(producto) {
  if (producto.imagen && producto.imagen.startsWith('http')) {
    return producto.imagen;
  }
  if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
    const first = producto.imagenes.find(img => img && img.startsWith('http'));
    if (first) return first;
  }
  return '';
}

/**
 * Obtiene imágenes adicionales del producto (para el campo additional_image_link)
 */
function getAdditionalImages(producto) {
  const mainImage = getMainImage(producto);
  if (!Array.isArray(producto.imagenes)) return [];
  return producto.imagenes
    .filter(img => img && img.startsWith('http') && img !== mainImage)
    .slice(0, 9); // Meta permite hasta 10 imágenes en total
}

/**
 * Genera la descripción del producto. Usa la ficha_técnica si está disponible,
 * manteniendo los saltos de línea para que se vea estructurado y limpio en WhatsApp.
 */
function getDescription(producto) {
  let desc = '';
  if (producto.ficha_tecnica) {
    // Preserva los asteriscos para que WhatsApp interprete el formato negrita (*texto*)
    desc = producto.ficha_tecnica.trim();
  }
  if (!desc && producto.nombre) {
    desc = producto.nombre;
  }
  return escapeXml(desc.slice(0, 5000)); // Meta permite máx 5000 caracteres
}

/**
 * Mapea la categoría de tu inventario al formato de Google Product Category
 * (Meta usa el mismo estándar de Google)
 */
function getGoogleCategory(categoria) {
  const categorias = {
    'Audio y Sonido':    'Electronics > Audio > Headphones',
    'Accesorios':        'Electronics > Electronics Accessories',
    'Computadoras':      'Electronics > Computers',
    'Smartphones':       'Electronics > Communications > Phones',
    'Tablets':           'Electronics > Computers > Tablet Computers',
    'Fotografía':        'Cameras & Optics > Cameras',
    'Gaming':            'Electronics > Video Game Consoles & Accessories',
    'Iluminación':       'Electronics > Lighting',
    'Hogar':             'Home & Garden',
    'Ropa':              'Apparel & Accessories',
    'Belleza':           'Health & Beauty',
    'Cosméticos':        'Health & Beauty > Beauty > Cosmetics',
  };
  return categorias[categoria] || 'Electronics';
}

// ─── Generador de XML ─────────────────────────────────────────────────────────

function generateXML(productos) {
  const items = productos.map(p => {
    const mainImage  = getMainImage(p);
    const extraImages = getAdditionalImages(p);
    const availability = getAvailability(p);
    const price = formatPrice(p.precio_venta);
    const metadataOferta = !!(p.metadata?.es_oferta);
    const metadataPrecioOferta = parseFloat(p.metadata?.precio_oferta) || 0;
    const hasSaleFromMetadata = metadataOferta && metadataPrecioOferta > 0;
    const hasSaleFromPrecioAntes = p.precio_antes && parseFloat(p.precio_antes) > parseFloat(p.precio_venta);

    const salePrice = hasSaleFromMetadata
      ? formatPrice(metadataPrecioOferta)
      : hasSaleFromPrecioAntes
        ? formatPrice(p.precio_venta)
        : null;
    const originalPrice = hasSaleFromMetadata
      ? formatPrice(p.precio_venta)
      : hasSaleFromPrecioAntes
        ? formatPrice(p.precio_antes)
        : null;

    // ID único: usamos el id de Supabase si existe, si no el SKU o código
    const itemId = escapeXml(String(p.id || p.sku || p.codigo || p.nombre).replace(/\s+/g, '-'));

    let itemXml = `    <item>
      <g:id>${itemId}</g:id>
      <g:title>${escapeXml(p.nombre)}</g:title>
      <g:description>${getDescription(p)}</g:description>
      <g:link>${escapeXml(getProductUrl(p))}</g:link>`;

    if (mainImage) {
      itemXml += `
      <g:image_link>${escapeXml(mainImage)}</g:image_link>`;
    }

    extraImages.forEach(img => {
      itemXml += `
      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`;
    });

    itemXml += `
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>`;

    if (salePrice && originalPrice) {
      itemXml += `
      <g:sale_price>${salePrice}</g:sale_price>`;
    }

    if (p.marca) {
      itemXml += `
      <g:brand>${escapeXml(p.marca)}</g:brand>`;
    }

    if (p.sku || p.codigo) {
      itemXml += `
      <g:mpn>${escapeXml(p.sku || p.codigo)}</g:mpn>`;
    }

    itemXml += `
      <g:condition>${escapeXml((p.condicion || 'new').toLowerCase())}</g:condition>
      <g:google_product_category>${escapeXml(getGoogleCategory(p.categoria))}</g:google_product_category>`;

    if (p.categoria) {
      itemXml += `
      <g:product_type>${escapeXml(p.categoria)}</g:product_type>`;
    }

    if (p.color) {
      itemXml += `
      <g:color>${escapeXml(p.color)}</g:color>`;
    }

    // Cantidad en stock para Meta
    if (typeof p.stock_actual !== 'undefined') {
      itemXml += `
      <g:quantity_to_sell_on_facebook>${Math.max(0, parseInt(p.stock_actual) || 0)}</g:quantity_to_sell_on_facebook>`;
    }

    itemXml += `
    </item>`;
    return itemXml;
  }).join('\n');

  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Catálogo SyncPro - Inefable Belleza y Cosméticos</title>
    <link>${CATALOG_BASE_URL}</link>
    <description>Feed de productos actualizado automáticamente desde SyncPro. Última actualización: ${timestamp}</description>
${items}
  </channel>
</rss>`;
}

// ─── Handler principal de Vercel ──────────────────────────────────────────────

export default async function handler(req, res) {
  // Headers CORS para que Meta pueda acceder al feed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Solo se acepta GET.' });
  }

  // Verificar credenciales de Supabase
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[meta-catalog] ERROR: Variables de entorno de Supabase no configuradas.');
    return res.status(500).json({
      error: 'Configuración del servidor incompleta. Faltan las credenciales de la base de datos.'
    });
  }

  try {
    // Crear cliente de Supabase en el servidor
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Obtener TODOS los productos de la tabla 'productos'
    // Filtramos solo los que tienen stock > 0 o que no están marcados como Agotados
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, nombre, categoria, precio_venta, precio_antes, precio_costo, stock_actual, estado, imagen, imagenes, sku, codigo, marca, color, condicion, ficha_tecnica, garantia, tipo_envio, metadata, updated_at, enlace_compra')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[meta-catalog] Error consultando Supabase:', error.message);
      return res.status(500).json({ error: 'Error al obtener los productos de la base de datos.', detalle: error.message });
    }

    if (!productos || productos.length === 0) {
      // Devolver un XML vacío pero válido
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Catálogo SyncPro</title>
    <link>${CATALOG_BASE_URL}</link>
    <description>No hay productos disponibles en este momento.</description>
  </channel>
</rss>`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache 1 hora
      return res.status(200).send(emptyXml);
    }

    // Generar el XML
    const xml = generateXML(productos);

    // Responder con el XML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Meta lee el feed cada hora
    res.setHeader('X-Feed-Products-Count', String(productos.length));
    res.setHeader('X-Feed-Generated-At', new Date().toISOString());

    return res.status(200).send(xml);

  } catch (err) {
    console.error('[meta-catalog] Error inesperado:', err.message, err.stack);
    return res.status(500).json({
      error: 'Error interno del servidor al generar el catálogo.',
      detalle: err.message
    });
  }
}
