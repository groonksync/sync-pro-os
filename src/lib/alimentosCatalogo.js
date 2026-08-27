import { supabase } from './supabaseClient';

export const CATALOGO_DEFAULT = {
  productos: [
    {
      id: 'prod_1',
      nombre: 'Plato Individual',
      precio: 35,
      descripcion: 'Plato completo de comida para eventos / campo',
      icono: '🍛',
      activo: true,
    },
  ],
  paquetes: [
    {
      id: 'pack_3',
      nombre: 'Paquete de 3 Platos',
      unidades: 3,
      precio: 100,
      badge: '-5 Bs Ahorro',
      activo: true,
    },
  ],
};

const STORAGE_KEY = 'alimentos_catalogo_config';

// Cargar catálogo local
export function getLocalCatalogo() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.productos) && parsed.productos.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error leyendo catalogo local:', e);
  }
  return CATALOGO_DEFAULT;
}

// Guardar catálogo local y sincronizar
export async function saveLocalCatalogo(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }

  try {
    await supabase
      .from('alimentos_config_catalogo')
      .upsert({
        id: 'default',
        updated_at: new Date().toISOString(),
        productos: config.productos || [],
        paquetes: config.paquetes || [],
      });
  } catch (e) {
    console.warn('Error sincronizando catalogo en Supabase:', e);
  }
}

// Cargar catálogo desde Supabase con fallback local
export async function fetchRemoteCatalogo() {
  try {
    const { data, error } = await supabase
      .from('alimentos_config_catalogo')
      .select('*')
      .eq('id', 'default')
      .single();

    if (!error && data && Array.isArray(data.productos) && data.productos.length > 0) {
      const remoteConfig = {
        productos: data.productos,
        paquetes: data.paquetes || [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteConfig));
      return remoteConfig;
    }
  } catch (e) {
    console.warn('Fallback a catalogo local:', e);
  }
  return getLocalCatalogo();
}

// Cálculo dinámico inteligente de precios
export function calcularPrecioDinamico(totalUnidades, catalogo = CATALOGO_DEFAULT) {
  const unidades = Math.max(0, parseInt(totalUnidades) || 0);
  const activeProducts = (catalogo.productos || []).filter(p => p.activo !== false);
  const activePacks = (catalogo.paquetes || []).filter(p => p.activo !== false).sort((a, b) => b.unidades - a.unidades);

  const basePrice = activeProducts.length > 0 ? parseFloat(activeProducts[0].precio) || 35 : 35;
  const productName = activeProducts.length > 0 ? activeProducts[0].nombre : 'Plato';

  // Si no hay paquetes configurados
  if (activePacks.length === 0) {
    const subtotal = unidades * basePrice;
    return {
      unidades,
      subtotal,
      ahorro: 0,
      desglose: `${unidades}x ${productName} (${basePrice} Bs)`,
      packsAplicados: [],
      sueltas: unidades,
      basePrice,
    };
  }

  // Algoritmo voraz para empaquetar de mayor a menor paquete
  let remaining = unidades;
  let subtotal = 0;
  const packsAplicados = [];

  for (const pack of activePacks) {
    const packUnits = parseInt(pack.unidades) || 1;
    const packPrice = parseFloat(pack.precio) || 0;
    if (packUnits > 0 && remaining >= packUnits) {
      const count = Math.floor(remaining / packUnits);
      remaining = remaining % packUnits;
      subtotal += count * packPrice;
      packsAplicados.push({
        nombre: pack.nombre,
        count,
        unidadesPorPack: packUnits,
        precioPorPack: packPrice,
      });
    }
  }

  const sueltas = remaining;
  subtotal += sueltas * basePrice;
  const sinDescuento = unidades * basePrice;
  const ahorro = Math.max(0, sinDescuento - subtotal);

  // Formatear texto descriptivo del desglose
  const partes = [];
  packsAplicados.forEach(p => {
    partes.push(`${p.count}x ${p.nombre} (${p.count * p.precioPorPack} Bs)`);
  });
  if (sueltas > 0) {
    partes.push(`${sueltas}x ${productName} (${sueltas * basePrice} Bs)`);
  }

  return {
    unidades,
    subtotal,
    ahorro,
    desglose: partes.join(' + ') || `${unidades} Platos`,
    packsAplicados,
    sueltas,
    basePrice,
    productName,
  };
}
