import { supabase } from './supabaseClient';

const TABLE_MAP = {
  producto: { table: 'productos', label: 'Producto', icon: 'producto' },
  prestamo: { table: 'prestamos', label: 'Préstamo', icon: 'prestamo' },
  nota: { table: 'notas', label: 'Nota', icon: 'nota' },
  recordatorio: { table: 'recordatorios', label: 'Recordatorio', icon: 'recordatorio' },
  credencial: { table: 'boveda_pass', label: 'Credencial', icon: 'credencial' },
  servicio: { table: 'servicios', label: 'Servicio', icon: 'servicio' },
  reunion: { table: 'reuniones', label: 'Reunión', icon: 'reunion' },
  cliente: { table: 'clientes_editor', label: 'Cliente', icon: 'cliente' },
  gym_miembro: { table: 'gym_miembros', label: 'Miembro Gimnasio', icon: 'gym_miembro' },
};

export async function moveToTrash(tipo, itemId, itemData, diasRetencion = 30) {
  const config = TABLE_MAP[tipo];
  if (!config) throw new Error(`Tipo "${tipo}" no soportado para papelera`);

  const nombreItem = itemData?.nombre || itemData?.titulo || itemData?.title || itemData?.name || 'Item sin nombre';

  const trashEntry = {
    tipo_dato: config.icon,
    nombre_item: String(nombreItem).substring(0, 200),
    datos_originales: itemData,
    item_id: itemId || itemData?.id,
    borrado_el: new Date().toISOString(),
    expira_el: new Date(Date.now() + diasRetencion * 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    const { error } = await supabase.from('papelera').insert(trashEntry);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Error al mover a papelera Supabase, usando localStorage:', e.message);
    const localTrash = JSON.parse(localStorage.getItem('inefable_local_trash') || '[]');
    localTrash.push({ ...trashEntry, id: `trash-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    localStorage.setItem('inefable_local_trash', JSON.stringify(localTrash));
    return true;
  }
}

export async function deleteFromTable(tipo, itemId) {
  const config = TABLE_MAP[tipo];
  if (!config) throw new Error(`Tipo "${tipo}" no soportado`);

  try {
    const { error } = await supabase.from(config.table).delete().eq('id', itemId);
    if (error) throw error;
  } catch (e) {
    console.warn(`Error al borrar de ${config.table}:`, e.message);
    const localKey = `inefable_${config.table}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
    localStorage.setItem(localKey, JSON.stringify(localData.filter(i => i.id !== itemId)));
  }
}

export async function safeDelete(tipo, itemId, itemData, diasRetencion = 30) {
  await moveToTrash(tipo, itemId, itemData, diasRetencion);
  await deleteFromTable(tipo, itemId);
}
