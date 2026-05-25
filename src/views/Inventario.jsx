import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap, ShoppingCart,
  Layers, Ruler, Weight, Globe, Star, AlertTriangle, List, ArrowUpRight, ArrowLeft, ArrowRight,
  Barcode, Shield, ZapOff, Activity, Palette, ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const toastStyle = (isDark, t) => ({
  position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 300
});

const Toast = ({ message, show, onClose, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  useEffect(() => {
    if (show) { const timer = setTimeout(() => onClose(), 3000); return () => clearTimeout(timer); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div style={toastStyle(isDark, t)}>
      <div style={{ backgroundColor: isDark ? 'rgba(20,20,20,0.6)' : 'rgba(245,245,247,0.9)', backdropFilter: 'blur(24px)', border: `1px solid ${t.border}`, padding: '12px 24px', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}><CheckCircle size={16} /></div>
        <span style={{ color: isDark ? '#fff' : '#1a1a1a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>{message}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, onEdit, onDelete, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const stock = parseInt(p.stock_actual || 0);
  const isAgotado = stock === 0;
  
  return (
    <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'row', gap: 20, transition: 'all 0.5s', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden', height: 190 }}>
      <div style={{ position: 'relative', width: 140, height: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: t.bg, border: `1px solid ${t.border}`, flexShrink: 0 }}>
        {p.imagen ? (
          <img src={p.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1s', filter: isAgotado ? 'grayscale(1) brightness(0.5) blur(2px)' : 'none' }} alt={p.nombre || 'Producto'} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft }}><Package size={36} strokeWidth={1} color={isDark ? '#333' : '#bbb'} /></div>
        )}
        {isAgotado && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(1px)', pointerEvents: 'none' }}><span style={{ color: '#fff', fontSize: 8, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase' }}>AGOTADO</span></div>}
        
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,20,20,0.4)', opacity: 0, transition: 'all 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
           <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} style={{ width: 36, height: 36, backgroundColor: '#fff', color: '#000', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s', border: 'none', cursor: 'pointer' }}><Edit3 size={14}/></button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} style={{ width: 36, height: 36, backgroundColor: t.danger, color: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0', minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{p.marca || 'SOVEREIGN'}</span>
            <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: t.accentSoft, color: t.accent }}>
              {stock} UNIDADES
            </div>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }}>{p.nombre || 'Sin Nombre'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <div style={{ padding: '2px 6px', backgroundColor: t.accentSoft, borderRadius: 6, border: `1px solid ${t.border}`, fontSize: 6, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase' }}>{p.categoria || 'GENERAL'}</div>
             <div style={{ fontSize: 6, fontFamily: 'monospace', color: t.textDim, fontWeight: 700, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SKU: {p.sku || p.codigo || 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {p.precio_antes > 0 && <p style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 900, color: t.textDim, textDecoration: 'line-through', lineHeight: 1, marginBottom: 2 }}>{parseFloat(p.precio_antes || 0).toLocaleString()} BS.</p>}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 900, color: t.text, letterSpacing: '-0.05em' }}>{parseFloat(p.precio_venta || 0).toLocaleString()}</span><span style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase' }}>BS.</span></div>
          </div>
          <button onClick={() => onEdit(p)} style={{ height: 32, padding: '0 16px', backgroundColor: t.accentSoft, color: t.text, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', border: `1px solid ${t.border}`, cursor: 'pointer', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}><ShoppingCart size={12}/><span>MASTER CONTROL</span></button>
        </div>
      </div>
    </div>
  );
};

const AMAZON_CATEGORIES = [
  "Electrónica", "Computadoras", "Celulares y Accesorios", "Televisión y Video", "Audio y Sonido", "Cámaras y Fotografía",
  "Hogar y Cocina", "Muebles", "Decoración", "Electrodomésticos",
  "Ropa, Zapatos y Joyería", "Relojes", "Bolsos y Accesorios",
  "Juguetes y Juegos", "Videojuegos", "Consolas",
  "Deporte y Aire Libre", "Fitness y Ejercicio", "Ciclismo",
  "Salud y Cuidado Personal", "Belleza y Cuidado del Cabello",
  "Herramientas y Mejoras del Hogar", "Jardín y Exteriores",
  "Libros", "Papelería y Oficina",
  "Automotriz", "Industrial y Científico", "Mascotas"
];

const Inventario = ({ settings = {}, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  const isMobile = settings?.isMobileMode;
  const normalizeText = (tt) => (tt || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data, error } = await supabase.from('productos').select('*').range(from, to).order('created_at', { ascending: false });
      if (error) throw error;
      if (page === 0) setProductos(data || []); else setProductos(prev => [...prev, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      const garantiaString = editingProduct.garantia_unit === 'Sin Garantía' ? 'Sin Garantía' : `${editingProduct.garantia_num || 0} ${editingProduct.garantia_unit || 'Días'}`;
      const meta = {
        ...(editingProduct.metadata || {}),
        sku: editingProduct.sku || '', color: editingProduct.color || '', condicion: editingProduct.condicion || 'Nuevo',
        distribuidor: editingProduct.distribuidor || '', ubicacion: editingProduct.ubicacion || '',
        serial: editingProduct.serial || '', tipo_envio: editingProduct.tipo_envio || 'Envío Gratuito'
      };
      const payload = { ...editingProduct, garantia: garantiaString, updated_at: new Date().toISOString(), metadata: meta };
      delete payload.garantia_num; delete payload.garantia_unit;
      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      await fetchData(); setIsModalOpen(false); setEditingProduct(null); setToast({ show: true, message: 'OPERACIÓN EXITOSA' });
    } catch (e) { alert('Error de sincronización: ' + e.message); } finally { setLoading(false); }
  };

  const handleEditProduct = (p) => {
    if (!p) return;
    let gNum = 0, gUnit = 'Días';
    if (p.garantia && p.garantia !== 'Sin Garantía') { 
      const parts = p.garantia.split(' '); gNum = parseInt(parts[0]) || 0; gUnit = parts[1] || 'Días'; 
    }
    const meta = p.metadata || {};
    setEditingProduct({ 
      ...p, garantia_num: gNum, garantia_unit: gUnit,
      imagenes: p.imagenes || (p.imagen ? [p.imagen] : []),
      precio_costo: p.precio_costo || 0, precio_venta: p.precio_venta || 0, precio_antes: p.precio_antes || 0,
      stock_actual: p.stock_actual || 0, sku: p.sku || meta.sku || '', condicion: p.condicion || meta.condicion || 'Nuevo',
      color: p.color || meta.color || '', distribuidor: p.distribuidor || meta.distribuidor || '',
      ubicacion: p.ubicacion || meta.ubicacion || '', serial: p.serial || meta.serial || '',
      tipo_envio: p.tipo_envio || meta.tipo_envio || 'Envío Gratuito'
    });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: crypto.randomUUID(), nombre: '', categoria: 'Electrónica', marca: '', distribuidor: '',
      precio_costo: 0, precio_venta: 0, precio_antes: 0, stock_actual: 0, stock_minimo: 5, stock_vendido: 0,
      ficha_tecnica: '', estado: 'Stock', imagen: '', codigo: '', sku: '', ubicacion: '', serial: '',
      garantia_num: 0, garantia_unit: 'Días', tipo_envio: 'Envío Gratuito', imagenes: [],
      metadata: { condicion: 'Nuevo', color: '' }, color: '', condicion: 'Nuevo'
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files); if (files.length === 0) return; setLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop(); const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
        if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName); urls.push(publicUrl);
      }
      const newImages = [...(editingProduct.imagenes || []), ...urls];
      setEditingProduct(prev => ({ ...prev, imagenes: newImages, imagen: newImages[0] }));
      setToast({ show: true, message: 'MULTIMEDIA OK' });
    } catch (err) { alert('Error: ' + err.message); } finally { setLoading(false); }
  };

  const handleMoveImage = (index, direction) => {
    const newImages = [...(editingProduct.imagenes || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setEditingProduct(prev => ({ ...prev, imagenes: newImages, imagen: newImages[0] }));
  };

  const handleDeleteImage = (index) => {
    const newImages = (editingProduct.imagenes || []).filter((_, i) => i !== index);
    setEditingProduct(prev => ({ ...prev, imagenes: newImages, imagen: newImages[0] || '' }));
  };

  const filteredProducts = productos.filter(p => { 
    const norm = normalizeText(searchTerm); 
    const meta = p.metadata || {};
    return normalizeText(p.nombre).includes(norm) || normalizeText(p.codigo).includes(norm) || normalizeText(p.sku || meta.sku).includes(norm); 
  });

  const ITEMS_PER_PAGE = 30;

  const stats = [
    { label: 'Activos Totales', val: productos.length, icon: Package },
    { label: 'Stock Crítico', val: productos.filter(p => p.stock_actual < 5 && p.stock_actual > 0).length, icon: AlertTriangle },
    { label: 'Valor de Activos', val: productos.reduce((acc, p) => acc + (parseFloat(p.precio_venta || 0) * parseInt(p.stock_actual || 0)), 0).toLocaleString() + ' BS', icon: DollarSign },
    { label: 'Categorías Amazon', val: new Set(productos.map(p => p.categoria)).size, icon: Layers },
    { label: 'Fuga por Agotados', val: productos.filter(p => p.stock_actual <= 0).length, icon: ZapOff }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', paddingBottom: isMobile ? 80 : 0 }}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} onClose={() => setToast({ ...toast, show: false })} />
      
      <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: isMobile ? undefined : 'space-between', alignItems: isMobile ? undefined : 'center', marginBottom: isMobile ? 24 : 32, gap: isMobile ? 16 : 0 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Inventario <span style={{ color: t.accent }}>Pro</span></h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Gestión de productos y stock</p>
        </div>
        <button onClick={openNewProduct} style={{ backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 'none', cursor: 'pointer', padding: '10px 24px', transition: 'all 0.2s' }}>
           <Plus size={16} strokeWidth={3}/> Nuevo Activo Maestro
        </button>
      </header>

      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}>
               <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</p>
               </div>
               <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}><s.icon size={22}/></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={16}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar activos por nombre, código o SKU..." style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text, borderRadius: 12, padding: '14px 16px 14px 48px', fontSize: 11, fontWeight: 500, outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {filteredProducts.map(p => ( <ProductCard key={p.id} p={p} isDark={isDark} onEdit={handleEditProduct} onDelete={id => { if(confirm('¿Borrar activo?')) supabase.from('productos').delete().eq('id', id).then(fetchData); }} /> ))}
      </div>

      {isModalOpen && editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: t.overlay, backdropFilter: 'blur(24px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
           <div style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, width: '100%', maxWidth: 1100, borderRadius: 20, boxShadow: '0 40px 120px rgba(0,0,0,0.8)', position: 'relative', display: 'flex', flexDirection: 'row', overflow: 'hidden', maxHeight: '92vh' }}>
              
              <div style={{ width: 380, backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(245,245,247,0.4)', padding: 32, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ aspectRatio: '1/1', backgroundColor: t.accentSoft, borderRadius: 16, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                       {editingProduct.imagen ? <img src={editingProduct.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Main" /> : <ImageIcon size={64} color={t.textDim} />}
                       <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 12px', backgroundColor: t.accent, color: '#000', fontSize: 8, fontWeight: 900, borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 6 }}><Star size={10} fill="black"/> Portada Principal</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                       <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Multimedia ({editingProduct.imagenes.length})</p>
                       <label style={{ backgroundColor: t.accentSoft, color: t.accent, padding: '4px 14px', borderRadius: 10, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${t.borderLight}` }}><input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={handleImageUpload}/> Subir</label>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {editingProduct.imagenes.map((img, idx) => (
                       <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: t.accentSoft, padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, transition: 'all 0.3s' }}>
                          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.borderLight}`, flexShrink: 0 }}><img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                             <p style={{ fontSize: 8, fontWeight: 900, color: t.text, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Imagen #{idx + 1}</p>
                             <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                <button onClick={() => handleMoveImage(idx, -1)} style={{ width: 28, height: 28, backgroundColor: t.accentSoft, color: t.accent, borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}><ArrowLeft size={12}/></button>
                                <button onClick={() => handleMoveImage(idx, 1)} style={{ width: 28, height: 28, backgroundColor: t.accentSoft, color: t.accent, borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}><ArrowRight size={12}/></button>
                                <button onClick={() => handleDeleteImage(idx)} style={{ width: 28, height: 28, backgroundColor: t.accentSoft, color: t.danger, borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer', marginLeft: 'auto' }}><Trash2 size={12}/></button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: isDark ? `linear-gradient(180deg, ${t.bg} 0%, #0a0a0a 100%)` : `linear-gradient(180deg, #f5f5f7 0%, #ffffff 100%)` }}>
                 <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                       <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent, border: `1px solid ${t.borderLight}` }}><Layers size={28}/></div>
                       <div>
                          <h3 style={{ fontSize: 28, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1 }}>Amazon <span style={{ color: t.accent }}>Merchant Hub</span></h3>
                          <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6em', marginTop: 6 }}>Listing Configuration Master • Pro v6.1</p>
                       </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer', transition: 'all 0.2s' }}><X size={20}/></button>
                 </header>

                 <section style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${t.accent}`, paddingLeft: 16, marginBottom: 24 }}><Tag size={18} color={t.accent}/><span style={{ fontSize: 11, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Identidad del Listing</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                       <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', marginLeft: 12, letterSpacing: '0.2em' }}>Título Maestro del Producto</p>
                          <input type="text" value={editingProduct.nombre || ''} onChange={e=>setEditingProduct({...editingProduct, nombre: e.target.value})} style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, fontSize: 20, fontWeight: 900, color: t.text, outline: 'none' }} placeholder="Escribe el nombre del activo..." />
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', marginLeft: 12, letterSpacing: '0.2em' }}>Categoría Amazon</p>
                          <div style={{ position: 'relative' }}>
                             <select value={editingProduct.categoria} onChange={e=>setEditingProduct({...editingProduct, categoria: e.target.value})} style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 20px', fontSize: 10, fontWeight: 900, color: t.text, textTransform: 'uppercase', outline: 'none', appearance: 'none', cursor: 'pointer' }}>{AMAZON_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ backgroundColor: t.panel, color: t.text }}>{cat}</option>)}</select>
                             <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.textDim }}><Plus size={14}/></div>
                          </div>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', marginLeft: 12, letterSpacing: '0.2em' }}>Marca / Fabricante</p>
                          <input type="text" value={editingProduct.marca || ''} onChange={e=>setEditingProduct({...editingProduct, marca: e.target.value})} style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 20px', fontSize: 12, fontWeight: 900, color: t.accent, outline: 'none' }} placeholder="SOVEREIGN" />
                       </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                       <div style={{ backgroundColor: t.inputBg, padding: 16, borderRadius: 14, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim }}><Barcode size={20}/></div>
                          <div style={{ flex: 1 }}>
                             <p style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Código de Barras (UPC/EAN)</p>
                             <input type="text" value={editingProduct.codigo || ''} onChange={e=>setEditingProduct({...editingProduct, codigo: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 12, fontFamily: 'monospace', fontWeight: 900, color: t.text, outline: 'none', border: 'none' }} placeholder="00000000000" />
                          </div>
                       </div>
                       <div style={{ backgroundColor: t.inputBg, padding: 16, borderRadius: 14, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}><Hash size={20}/></div>
                          <div style={{ flex: 1 }}>
                             <p style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>SKU Interno (Maestro)</p>
                             <input type="text" value={editingProduct.sku || ''} onChange={e=>setEditingProduct({...editingProduct, sku: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 12, fontFamily: 'monospace', fontWeight: 900, color: t.accent, outline: 'none', border: 'none' }} placeholder="SKU-SOV-001" />
                          </div>
                       </div>
                    </div>
                 </section>

                 <section style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${t.accent}`, paddingLeft: 16, marginBottom: 24 }}><DollarSign size={18} color={t.accent}/><span style={{ fontSize: 11, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Finanzas & Disponibilidad</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                       <div style={{ backgroundColor: t.inputBg, padding: 24, borderRadius: 14, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Precio de Costo</p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><input type="number" value={editingProduct.precio_costo} onChange={e=>setEditingProduct({...editingProduct, precio_costo: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 28, fontFamily: 'monospace', fontWeight: 900, color: t.textDim, outline: 'none', border: 'none' }} /><span style={{ fontSize: 10, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>BS</span></div>
                       </div>
                       <div style={{ backgroundColor: t.inputBg, padding: 24, borderRadius: 14, border: `1px solid ${t.borderLight}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Precio de Venta</p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 28, fontFamily: 'monospace', fontWeight: 900, color: t.text, outline: 'none', border: 'none' }} /><span style={{ fontSize: 10, fontWeight: 900, color: t.accent, textTransform: 'uppercase' }}>BS</span></div>
                       </div>
                       <div style={{ backgroundColor: t.inputBg, padding: 24, borderRadius: 14, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 4 }}><ZapOff size={10}/> Precio Anterior</p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><input type="number" value={editingProduct.precio_antes} onChange={e=>setEditingProduct({...editingProduct, precio_antes: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 28, fontFamily: 'monospace', fontWeight: 900, color: t.textDim, textDecoration: 'line-through', outline: 'none', border: 'none' }} /><span style={{ fontSize: 10, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>BS</span></div>
                       </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginTop: 20 }}>
                       {[
                         { label: 'Stock Actual', val: editingProduct.stock_actual, icon: BoxIcon, field: 'stock_actual', type: 'number' },
                         { label: 'Ubicación', val: editingProduct.ubicacion, icon: MapPin, field: 'ubicacion', type: 'text', placeholder: 'Piso 1' },
                         { label: 'Color / Versión', val: editingProduct.color, icon: Palette, field: 'color', type: 'text', placeholder: 'Black / Silver' },
                         { label: 'Condición', val: editingProduct.condicion, icon: Shield, field: 'condicion', type: 'select' }
                       ].map((f, i) => (
                         <div key={i} style={{ backgroundColor: t.inputBg, padding: 14, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><p style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.label}</p><f.icon size={10} color={t.accent}/></div>
                            {f.type === 'select' ? (
                              <select value={f.val} onChange={e=>setEditingProduct({...editingProduct, [f.field]: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 10, fontWeight: 900, color: t.text, textTransform: 'uppercase', outline: 'none', border: 'none', cursor: 'pointer' }}><option value="Nuevo" style={{ backgroundColor: t.bg, color: t.text }}>Nuevo</option><option value="Usado" style={{ backgroundColor: t.bg, color: t.text }}>Usado</option><option value="Refurbished" style={{ backgroundColor: t.bg, color: t.text }}>Renovado</option></select>
                            ) : (
                              <input type={f.type} value={f.val || ''} onChange={e=>setEditingProduct({...editingProduct, [f.field]: e.target.value})} style={{ width: '100%', backgroundColor: 'transparent', fontSize: 12, fontWeight: 900, outline: 'none', border: 'none', color: f.type === 'number' ? t.accent : t.text, fontFamily: f.type === 'number' ? 'monospace' : 'inherit' }} placeholder={f.placeholder} />
                            )}
                         </div>
                       ))}
                    </div>
                 </section>

                 <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                    <div style={{ backgroundColor: t.inputBg, padding: 28, borderRadius: 16, border: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: t.accent, marginBottom: 20 }}><ShieldCheck size={20}/><span style={{ fontSize: 11, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Garantía Sovereign</span></div>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Valor Numérico</p><input type="number" value={editingProduct.garantia_num} onChange={e=>setEditingProduct({...editingProduct, garantia_num: e.target.value})} style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, textAlign: 'center', fontSize: 16, fontWeight: 900, color: t.accent, outline: 'none' }} /></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Unidad de Tiempo</p><div style={{ position: 'relative' }}><select value={editingProduct.garantia_unit} onChange={e=>setEditingProduct({...editingProduct, garantia_unit: e.target.value})} style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, fontSize: 10, fontWeight: 900, color: t.text, textTransform: 'uppercase', outline: 'none', appearance: 'none', cursor: 'pointer' }}><option value="Días" style={{ backgroundColor: t.bg, color: t.text }}>Días</option><option value="Meses" style={{ backgroundColor: t.bg, color: t.text }}>Meses</option><option value="Años" style={{ backgroundColor: t.bg, color: t.text }}>Años</option><option value="Sin Garantía" style={{ backgroundColor: t.bg, color: t.text }}>Sin Garantía</option></select><div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.textDim }}><ChevronRight size={12}/></div></div></div>
                       </div>
                    </div>
                    <div style={{ backgroundColor: t.inputBg, padding: 28, borderRadius: 16, border: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: t.text, marginBottom: 20 }}><Truck size={20}/><span style={{ fontSize: 11, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Logística Global</span></div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Método de Envío Predefinido</p>
                          <div style={{ position: 'relative' }}>
                             <select value={editingProduct.tipo_envio} onChange={e=>setEditingProduct({...editingProduct, tipo_envio: e.target.value})} style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, fontSize: 10, fontWeight: 900, color: t.text, textTransform: 'uppercase', outline: 'none', appearance: 'none', cursor: 'pointer' }}><option value="Envío Gratuito" style={{ backgroundColor: t.bg, color: t.text }}>Envío Gratuito (Prime Exclusive)</option><option value="Costo Adicional" style={{ backgroundColor: t.bg, color: t.text }}>Costo de Envío Adicional</option></select>
                             <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.textDim }}><Plus size={14}/></div>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section style={{ backgroundColor: t.inputBg, padding: 32, borderRadius: 20, border: `1px solid ${t.border}`, marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${t.borderLight}`, paddingLeft: 20, marginBottom: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 16, color: t.text }}><ClipboardList size={18}/><span style={{ fontSize: 11, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Ficha Técnica Pro (Bullet Points)</span></div></div>
                    <textarea value={editingProduct.ficha_tecnica || ''} onChange={e=>setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} placeholder="• Característica Maestra 1...&#10;• Característica Maestra 2..." style={{ width: '100%', backgroundColor: 'transparent', fontSize: 12, fontWeight: 500, color: t.textMuted, outline: 'none', height: 200, resize: 'none', lineHeight: '1.8', borderLeft: `2px solid ${t.accentSoft}`, paddingLeft: 32 }}></textarea>
                 </section>

                 <footer style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 32, borderTop: `1px solid ${t.border}`, position: 'sticky', bottom: 0, backgroundColor: t.overlay, backdropFilter: 'blur(24px)', padding: '24px 0' }}>
                    <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 28px', color: t.textDim, fontWeight: 900, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.3em', background: 'none', border: 'none', cursor: 'pointer' }}>Descartar Cambios</button>
                    <button onClick={handleSaveProduct} style={{ flex: 1, padding: '16px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 14, fontWeight: 900, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.4em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s' }}>
                       <Save size={20}/> Sincronizar Asset Amazon Pro
                    </button>
                 </footer>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
