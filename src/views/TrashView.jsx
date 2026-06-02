import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Trash,
  Clock,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle2,
  HardDrive,
  Landmark,
  Bell,
  StickyNote,
  Key,
  Video,
  Package,
  CreditCard,
  Users,
  Wallet,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';

const getIconForType = (tipo, isDark = true) => {
  const theme = getTheme(isDark);
  const props = { size: 20, color: theme.accent };
  switch(tipo) {
    case 'prestamo': return <Landmark {...props}/>;
    case 'recordatorio': return <Bell {...props}/>;
    case 'nota': return <StickyNote {...props}/>;
    case 'credencial': return <Key {...props}/>;
    case 'cliente': return <Users {...props}/>;
    case 'sesion': return <Video {...props}/>;
    case 'reunion': return <Video {...props}/>;
    case 'producto': return <Package {...props}/>;
    case 'servicio': return <CreditCard {...props}/>;
    case 'egreso': return <Wallet {...props}/>;
    case 'recibo': return <CreditCard {...props}/>;
    case 'proyecto': return <Briefcase {...props}/>;
    case 'venta': return <TrendingUp {...props}/>;
    default: return <HardDrive {...props}/>;
  }
};

const getLabelForType = (tipo) => {
  const map = {
    'prestamo': 'Préstamo',
    'recordatorio': 'Recordatorio',
    'nota': 'Nota',
    'credencial': 'Credencial',
    'cliente': 'Cliente',
    'sesion': 'Sesión',
    'reunion': 'Reunión',
    'producto': 'Producto',
    'servicio': 'Servicio',
    'egreso': 'Egreso',
    'recibo': 'Recibo',
    'proyecto': 'Proyecto',
    'venta': 'Venta Digital'
  };
  return map[tipo] || tipo || 'Item';
};

const TrashView = ({ settings, isDark = true }) => {
  const t = useTheme(isDark);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const fetchTrashItems = async () => {
    setLoading(true);
    setDbError(false);
    
    let dbItems = [];
    let localItems = [];

    // 1. Cargar items de Supabase
    try {
      const { data, error } = await supabase
        .from('papelera')
        .select('*')
        .order('borrado_el', { ascending: false });
      
      if (error) throw error;
      dbItems = data || [];

      // Limpieza automática de items expirados (mayor a 30 días)
      const now = new Date();
      const expiredItems = dbItems.filter(item => new Date(item.expira_el) < now);
      
      if (expiredItems.length > 0) {
        const ids = expiredItems.map(i => i.id);
        await supabase.from('papelera').delete().in('id', ids);
        dbItems = dbItems.filter(i => !ids.includes(i.id));
      }
    } catch (e) {
      console.warn("Papelera de base de datos no configurada, recurriendo a papelera local.");
      setDbError(true);
    }

    // 2. Cargar items locales de localStorage (nuevo y legacy)
    try {
      const localKeys = ['inefable_local_trash', 'sovereign_local_trash'];
      for (const key of localKeys) {
        const localTrash = localStorage.getItem(key);
        if (localTrash) {
          const parsed = JSON.parse(localTrash);
          const now = new Date();
          const valid = parsed.filter(item => new Date(item.expira_el) > now);
          if (valid.length !== parsed.length) {
            localStorage.setItem(key, JSON.stringify(valid));
          }
          localItems = [...localItems, ...valid];
        }
      }
    } catch (e) {
      console.error("Error al cargar papelera local:", e);
    }

    // Combinar ambos
    setItems([...dbItems, ...localItems]);
    setLoading(false);
  };

  const restoreItem = async (item) => {
    if (!confirm(`¿Restaurar ${item.nombre_item}? Volverá a su vista original.`)) return;
    
    setLoading(true);
    try {
      // Item local (ID empieza por trash- o dbError es true)
      if (item.id.toString().startsWith('trash-') || dbError) {
        // Determinar la key de localStorage según el tipo
        let storageKey = '';
        if (item.tipo_dato === 'nota') storageKey = 'sovereign_notas';
        else if (item.tipo_dato === 'credencial') storageKey = 'sovereign_creds';
        else if (item.tipo_dato === 'recordatorio') storageKey = 'sovereign_recordatorios';
        else if (item.tipo_dato === 'prestamo') storageKey = 'sovereign_prestamos';
        else if (item.tipo_dato === 'producto') storageKey = 'sovereign_productos';
        else if (item.tipo_dato === 'egreso') storageKey = 'sovereign_egresos';
        else if (item.tipo_dato === 'recibo') storageKey = 'sovereign_recibos';
        else if (item.tipo_dato === 'proyecto') storageKey = 'sovereign_proyectos';
        else if (item.tipo_dato === 'venta') storageKey = 'sovereign_ventas';

        if (storageKey) {
          const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
          localStorage.setItem(storageKey, JSON.stringify([item.datos_originales, ...localData]));
        }

        // Eliminar de papelera local (ambas keys)
        const localTrashKeys = ['inefable_local_trash', 'sovereign_local_trash'];
        for (const key of localTrashKeys) {
          const localTrash = JSON.parse(localStorage.getItem(key) || '[]');
          const updatedTrash = localTrash.filter(i => i.id !== item.id);
          localStorage.setItem(key, JSON.stringify(updatedTrash));
        }
        
        setItems(prev => prev.filter(i => i.id !== item.id));
        showToast('Item restaurado localmente', 'ok');
      } else {
        // Supabase — mapear tipo_dato → tabla
        const tableMap = {
          'cliente': 'clientes_editor',
          'sesion': 'reuniones',
          'reunion': 'reuniones',
          'nota': 'notas',
          'credencial': 'boveda_pass',
          'prestamo': 'prestamos',
          'recordatorio': 'recordatorios',
          'producto': 'productos',
          'servicio': 'servicios',
          'egreso': 'egresos',
          'recibo': 'recibos',
          'proyecto': 'proyectos',
          'venta': 'ventas'
        };
        
        const tableName = tableMap[item.tipo_dato];
        if (tableName) {
          const { error: restoreError } = await supabase.from(tableName).insert(item.datos_originales);
          if (restoreError) throw restoreError;

          await supabase.from('papelera').delete().eq('id', item.id);
          
          setItems(prev => prev.filter(i => i.id !== item.id));
          showToast('Item restaurado en la nube', 'ok');
        }
      }
    } catch (e) {
      showToast(`Error al restaurar: ${e.message}`, 'err');
    }
    setLoading(false);
  };

  const deleteForever = async (item) => {
    if (!confirm(`¿BORRAR DEFINITIVAMENTE ${item.nombre_item}? Esta acción es irreversible.`)) return;
    
    setLoading(true);
    try {
      if (item.id.toString().startsWith('trash-') || dbError) {
        const localKeys = ['inefable_local_trash', 'sovereign_local_trash'];
        for (const key of localKeys) {
          const localTrash = JSON.parse(localStorage.getItem(key) || '[]');
          localStorage.setItem(key, JSON.stringify(localTrash.filter(i => i.id !== item.id)));
        }
      } else {
        await supabase.from('papelera').delete().eq('id', item.id);
      }
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('Eliminado permanentemente', 'ok');
    } catch (e) {
      showToast(e.message, 'err');
    }
    setLoading(false);
  };

  const emptyTrash = async () => {
    if (!confirm('¿VACIAR TODA LA PAPELERA? Se borrará TODO de forma permanente del sistema.')) return;
    
    setLoading(true);
    try {
      localStorage.removeItem('inefable_local_trash');
      localStorage.removeItem('sovereign_local_trash');
      if (!dbError) {
        await supabase.from('papelera').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      setItems([]);
      showToast('Papelera vaciada', 'ok');
    } catch (e) {
      showToast(e.message, 'err');
    }
    setLoading(false);
  };

  const getDaysLeft = (expiraEl) => {
    const diff = new Date(expiraEl) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="flex flex-col h-full max-w-[1400px] w-full animate-in fade-in duration-500" style={{ padding: '0 4px' }}>
      
      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-2 duration-300"
          style={toast.type === 'err' ? { backgroundColor: '#2a0f0f', borderColor: '#5c1a1a', color: '#f0b0b0' } : { backgroundColor: '#1a2a1a', borderColor: '#1a5c1a', color: '#b0f0b0' }}>
          {toast.type === 'err' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
        </div>
      )}

      <header className="flex justify-between items-end mb-6" style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Papelera</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Los items se borran definitivamente tras 30 días</p>
        </div>

        <div className="flex gap-3">
           <button onClick={fetchTrashItems}
             style={{ padding: 12, backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, color: t.textMuted, cursor: 'pointer' }}>
             <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button onClick={emptyTrash} disabled={items.length === 0}
             style={{ padding: '10px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: items.length === 0 ? 0.3 : 1 }}>
             <Trash size={16}/> Vaciar Papelera
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mac-scrollbar pr-4">
        {loading && items.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={36} color={t.textDim} className="animate-spin" />
            <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Escaneando archivos borrados...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map(item => (
              <div key={item.id}
                style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {/* Days badge */}
                <div className="flex justify-end mb-3">
                   <div className="flex items-center gap-1.5" style={{ padding: '4px 8px', backgroundColor: t.accentSoft, borderRadius: 20, border: `1px solid ${t.borderLight}` }}>
                     <Clock size={8} color={t.accent} />
                     <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, textTransform: 'uppercase' }}>{getDaysLeft(item.expira_el)} días</span>
                   </div>
                </div>

                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                   <div style={{ width: 40, height: 40, backgroundColor: t.accentSoft, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIconForType(item.tipo_dato, isDark)}
                   </div>
                   <div>
                      <p style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>{getLabelForType(item.tipo_dato)}</p>
                      <h4 style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{item.nombre_item}</h4>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2" style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 'auto' }}>
                   <button onClick={() => restoreItem(item)}
                     style={{ flex: 1, padding: '8px 0', backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                     <RotateCcw size={10}/> Restaurar
                   </button>
                   <button onClick={() => deleteForever(item)}
                     style={{ padding: '8px 10px', backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: 10, cursor: 'pointer', color: t.textDim }}>
                     <Trash size={12}/>
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center" style={{ border: `1px dashed ${t.border}`, borderRadius: 16 }}>
            <CheckCircle2 size={40} color={t.textDim} style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Papelera Vacía</h3>
            <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 6 }}>No hay archivos ni datos en el limbo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashView;
