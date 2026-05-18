import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap, ShoppingCart,
  Layers, Ruler, Weight, Globe, Star, AlertTriangle, List, ArrowUpRight, ArrowLeft, ArrowRight,
  Barcode, Shield, ZapOff, Activity, Palette, ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Toast = ({ message, show, onClose, isDark }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className={`${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/5'} backdrop-blur-2xl border px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[240px] justify-center`}>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle size={18} /></div>
        <span className={`${isDark ? 'text-white' : 'text-neutral-900'} text-[11px] font-black uppercase tracking-[0.4em]`}>{message}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, onEdit, onDelete, isDark }) => {
  const stock = parseInt(p.stock_actual || 0);
  const isAgotado = stock === 0;
  
  return (
    <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-5 flex flex-row gap-6 group hover:border-emerald-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden h-[190px]">
      <div className="relative w-[150px] h-full rounded-[2rem] overflow-hidden bg-[#050505] border border-white/5 shrink-0 shadow-inner">
        {p.imagen ? (
          <img src={p.imagen} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isAgotado ? 'grayscale brightness-50 blur-[2px]' : ''}`} alt={p.nombre || 'Producto'} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5"><Package size={40} strokeWidth={1} className="text-neutral-900" /></div>
        )}
        {isAgotado && <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] pointer-events-none"><span className="text-white text-[9px] font-black tracking-[0.4em] uppercase">AGOTADO</span></div>}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
           <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110 active:scale-95"><Edit3 size={16}/></button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-rose-600 hover:scale-110 active:scale-95"><Trash2 size={16}/></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{p.marca || 'SOVEREIGN'}</span>
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${stock < 5 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {stock} UNIDADES
            </div>
          </div>
          <h3 className="text-[15px] font-black text-white uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">{p.nombre || 'Sin Nombre'}</h3>
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 text-[7px] font-black text-neutral-500 uppercase">{p.categoria || 'GENERAL'}</div>
             <div className="text-[7px] font-mono text-neutral-600 font-bold uppercase truncate">SKU: {p.sku || p.codigo || 'N/A'}</div>
          </div>
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-white/5">
          <div className="flex flex-col">
            {p.precio_antes > 0 && <p className="text-[9px] font-mono font-black text-neutral-600 line-through leading-none mb-0.5">{parseFloat(p.precio_antes || 0).toLocaleString()} BS.</p>}
            <div className="flex items-baseline gap-1.5"><span className="text-2xl font-mono font-black text-white tracking-tighter">{parseFloat(p.precio_venta || 0).toLocaleString()}</span><span className="text-[10px] font-black text-neutral-500 uppercase">BS.</span></div>
          </div>
          <button onClick={() => onEdit(p)} className="h-10 px-6 bg-white/[0.03] hover:bg-white text-white hover:text-black rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/10 hover:border-transparent"><ShoppingCart size={14}/><span className="text-[10px] font-black uppercase tracking-widest">MASTER CONTROL</span></button>
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
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  const isMobile = settings?.isMobileMode;
  const normalizeText = (t) => (t || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
      
      // Creamos un metadata con TODOS los campos extras por si no existen como columnas
      const meta = {
        ...(editingProduct.metadata || {}),
        sku: editingProduct.sku || '',
        color: editingProduct.color || '',
        condicion: editingProduct.condicion || 'Nuevo',
        distribuidor: editingProduct.distribuidor || '',
        ubicacion: editingProduct.ubicacion || '',
        serial: editingProduct.serial || '',
        tipo_envio: editingProduct.tipo_envio || 'Envío Gratuito'
      };

      const payload = { 
        ...editingProduct, 
        garantia: garantiaString, 
        updated_at: new Date().toISOString(),
        metadata: meta
      };
      
      // Limpiamos campos de ayuda visual
      delete payload.garantia_num; 
      delete payload.garantia_unit;

      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      await fetchData(); setIsModalOpen(false); setEditingProduct(null); setToast({ show: true, message: 'OPERACIÓN EXITOSA' });
    } catch (e) { alert('Error de sincronización: ' + e.message); } finally { setLoading(false); }
  };

  const handleEditProduct = (p) => {
    if (!p) return;
    let gNum = 0, gUnit = 'Días';
    if (p.garantia && p.garantia !== 'Sin Garantía') { 
      const parts = p.garantia.split(' '); 
      gNum = parseInt(parts[0]) || 0; 
      gUnit = parts[1] || 'Días'; 
    }
    const meta = p.metadata || {};
    setEditingProduct({ 
      ...p, 
      garantia_num: gNum, 
      garantia_unit: gUnit,
      imagenes: p.imagenes || (p.imagen ? [p.imagen] : []),
      precio_costo: p.precio_costo || 0,
      precio_venta: p.precio_venta || 0,
      precio_antes: p.precio_antes || 0,
      stock_actual: p.stock_actual || 0,
      sku: p.sku || meta.sku || '',
      condicion: p.condicion || meta.condicion || 'Nuevo',
      color: p.color || meta.color || '',
      distribuidor: p.distribuidor || meta.distribuidor || '',
      ubicacion: p.ubicacion || meta.ubicacion || '',
      serial: p.serial || meta.serial || '',
      tipo_envio: p.tipo_envio || meta.tipo_envio || 'Envío Gratuito'
    });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: crypto.randomUUID(), nombre: '', categoria: 'Electrónica', marca: '', distribuidor: '', precio_costo: 0, precio_venta: 0, precio_antes: 0, stock_actual: 0, stock_minimo: 5, stock_vendido: 0, ficha_tecnica: '', estado: 'Stock', imagen: '', codigo: '', sku: '', ubicacion: '', serial: '', garantia_num: 0, garantia_unit: 'Días', tipo_envio: 'Envío Gratuito', imagenes: [], metadata: { condicion: 'Nuevo', color: '' }, color: '', condicion: 'Nuevo'
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
    { label: 'Activos Totales', val: productos.length, icon: Package, color: 'text-white' },
    { label: 'Stock Crítico', val: productos.filter(p => p.stock_actual < 5 && p.stock_actual > 0).length, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Valor de Activos', val: productos.reduce((acc, p) => acc + (parseFloat(p.precio_venta || 0) * parseInt(p.stock_actual || 0)), 0).toLocaleString() + ' BS', icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Categorías Amazon', val: new Set(productos.map(p => p.categoria)).size, icon: Layers, color: 'text-purple-500' },
    { label: 'Fuga por Agotados', val: productos.filter(p => p.stock_actual <= 0).length, icon: ZapOff, color: 'text-rose-500' }
  ];

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-700 ${isMobile ? 'pb-20' : ''}`}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} onClose={() => setToast({ ...toast, show: false })} />
      
      <header className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-row justify-between items-center mb-12 gap-8'}`}>
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 bg-[#10b981] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-white/10 shrink-0"><BoxIcon size={24} className="text-black" strokeWidth={2.5} /></div>
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">Inventario <span className="text-emerald-500">Pro</span></h2>
           </div>
        </div>
        <button onClick={openNewProduct} className="bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 px-8 py-4">
           <Plus size={18} strokeWidth={3}/> Nuevo Activo Maestro
        </button>
      </header>

      {/* INVENTORY STATS - 5 HORIZONTAL BOXES */}
      {!isMobile && (
        <div className="grid grid-cols-5 gap-6 mb-12">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl hover:border-white/10 transition-all group">
               <div className="min-w-0">
                  <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] mb-2 group-hover:text-neutral-500 transition-colors">{s.label}</p>
                  <p className="text-2xl font-black text-white truncate">{s.val}</p>
               </div>
               <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center ${s.color} shadow-inner group-hover:scale-110 transition-all`}><s.icon size={24}/></div>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800" size={18}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar activos por nombre, código o SKU..." className="w-full bg-[#050505] border border-white/5 text-white rounded-2xl py-5 pl-16 pr-8 text-xs font-medium outline-none focus:border-emerald-500/20 shadow-inner placeholder:text-neutral-800" />
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {filteredProducts.map(p => ( <ProductCard key={p.id} p={p} isDark={isDark} onEdit={handleEditProduct} onDelete={id => { if(confirm('¿Borrar activo?')) supabase.from('productos').delete().eq('id', id).then(fetchData); }} /> ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-6xl rounded-[3.5rem] shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in zoom-in duration-300 max-h-[92vh]">
              
              <div className="w-full md:w-[420px] bg-black/40 p-10 border-r border-white/5 flex flex-col gap-8 overflow-y-auto mac-scrollbar">
                 <div className="space-y-4">
                    <div className="aspect-square bg-white/[0.02] rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                       {editingProduct.imagen ? <img src={editingProduct.imagen} className="w-full h-full object-cover" alt="Main" /> : <ImageIcon size={80} className="text-neutral-900" />}
                       <div className="absolute top-6 left-6 px-4 py-1.5 bg-emerald-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2"><Star size={10} fill="black"/> Portada Principal</div>
                    </div>
                    <div className="flex justify-between items-center px-2">
                       <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Multimedia ({editingProduct.imagenes.length})</p>
                       <label className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-500 hover:text-black transition-all"><input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload}/> Subir</label>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {editingProduct.imagenes.map((img, idx) => (
                       <div key={idx} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-3xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0"><img src={img} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[9px] font-black text-white uppercase truncate">Imagen #{idx + 1}</p>
                             <div className="flex gap-2 mt-3">
                                <button onClick={() => handleMoveImage(idx, -1)} className="w-9 h-9 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl transition-all flex items-center justify-center"><ArrowLeft size={14}/></button>
                                <button onClick={() => handleMoveImage(idx, 1)} className="w-9 h-9 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl transition-all flex items-center justify-center"><ArrowRight size={14}/></button>
                                <button onClick={() => handleDeleteImage(idx)} className="w-9 h-9 bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center ml-auto"><Trash2 size={14}/></button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex-1 p-14 space-y-12 overflow-y-auto mac-scrollbar bg-gradient-to-b from-[#0a0a0a] to-black">
                 <header className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"><Layers size={32}/></div>
                       <div>
                          <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Amazon <span className="text-emerald-500">Merchant Hub</span></h3>
                          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.6em] mt-2">Listing Configuration Master • Pro v6.1</p>
                       </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-neutral-600 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"><X size={24}/></button>
                 </header>

                 <section className="space-y-8">
                    <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-5"><Tag size={20} className="text-emerald-500"/><span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Identidad del Listing</span></div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="col-span-2 space-y-3">
                          <p className="text-[10px] text-neutral-700 font-black uppercase ml-4 tracking-[0.2em]">Título Maestro del Producto</p>
                          <input type="text" value={editingProduct.nombre || ''} onChange={e=>setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 text-2xl font-black text-white outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all shadow-inner" placeholder="Escribe el nombre del activo..." />
                       </div>
                       <div className="space-y-3">
                          <p className="text-[10px] text-neutral-700 font-black uppercase ml-4 tracking-[0.2em]">Categoría Amazon</p>
                          <div className="relative">
                             <select value={editingProduct.categoria} onChange={e=>setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 text-xs font-black text-white uppercase outline-none appearance-none cursor-pointer focus:border-emerald-500/30 transition-all">{AMAZON_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}</select>
                             <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600"><Plus size={16}/></div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <p className="text-[10px] text-neutral-700 font-black uppercase ml-4 tracking-[0.2em]">Marca / Fabricante</p>
                          <input type="text" value={editingProduct.marca || ''} onChange={e=>setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5 text-sm font-black text-emerald-500 outline-none focus:border-emerald-500/30 transition-all" placeholder="SOVEREIGN" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 group hover:border-white/10 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-neutral-700 group-hover:text-white transition-colors"><Barcode size={24}/></div>
                          <div className="flex-1">
                             <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-1">Código de Barras (UPC/EAN)</p>
                             <input type="text" value={editingProduct.codigo || ''} onChange={e=>setEditingProduct({...editingProduct, codigo: e.target.value})} className="w-full bg-transparent text-sm font-mono font-black text-white outline-none" placeholder="00000000000" />
                          </div>
                       </div>
                       <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 group hover:border-emerald-500/20 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500/50 group-hover:text-emerald-500 transition-colors"><Hash size={24}/></div>
                          <div className="flex-1">
                             <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-1">SKU Interno (Maestro)</p>
                             <input type="text" value={editingProduct.sku || ''} onChange={e=>setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full bg-transparent text-sm font-mono font-black text-emerald-500 outline-none" placeholder="SKU-SOV-001" />
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-8">
                    <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-5"><DollarSign size={20} className="text-amber-500"/><span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Finanzas & Disponibilidad</span></div>
                    <div className="grid grid-cols-3 gap-8">
                       <div className="bg-white/[0.01] p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:bg-white/[0.02] transition-all">
                          <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em]">Precio de Costo</p>
                          <div className="flex items-baseline gap-3"><input type="number" value={editingProduct.precio_costo} onChange={e=>setEditingProduct({...editingProduct, precio_costo: e.target.value})} className="w-full bg-transparent text-4xl font-mono font-black text-neutral-700 outline-none" /><span className="text-xs font-black text-neutral-800 uppercase">BS</span></div>
                       </div>
                       <div className="bg-emerald-500/[0.02] p-8 rounded-[2.5rem] border border-emerald-500/10 space-y-4 shadow-[0_20px_50px_rgba(16,185,129,0.05)]">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Precio de Venta</p>
                          <div className="flex items-baseline gap-3"><input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-4xl font-mono font-black text-white outline-none" /><span className="text-xs font-black text-emerald-500 uppercase">BS</span></div>
                       </div>
                       <div className="bg-rose-500/[0.01] p-8 rounded-[2.5rem] border border-rose-500/10 space-y-4">
                          <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.2em] flex items-center gap-2"><ZapOff size={12}/> Precio Anterior</p>
                          <div className="flex items-baseline gap-3"><input type="number" value={editingProduct.precio_antes} onChange={e=>setEditingProduct({...editingProduct, precio_antes: e.target.value})} className="w-full bg-transparent text-4xl font-mono font-black text-rose-500/10 line-through outline-none" /><span className="text-xs font-black text-rose-500/10 uppercase">BS</span></div>
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                       {[
                         { label: 'Stock Actual', val: editingProduct.stock_actual, icon: BoxIcon, color: 'text-amber-500', field: 'stock_actual', type: 'number' },
                         { label: 'Ubicación', val: editingProduct.ubicacion, icon: MapPin, color: 'text-white', field: 'ubicacion', type: 'text', placeholder: 'Piso 1' },
                         { label: 'Color / Versión', val: editingProduct.color, icon: Palette, color: 'text-emerald-500', field: 'color', type: 'text', placeholder: 'Black / Silver' },
                         { label: 'Condición', val: editingProduct.condicion, icon: Shield, color: 'text-blue-500', field: 'condicion', type: 'select' }
                       ].map((f, i) => (
                         <div key={i} className="bg-white/[0.01] p-6 rounded-[1.8rem] border border-white/5 space-y-3 group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between"><p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest">{f.label}</p><f.icon size={12} className={f.color}/></div>
                            {f.type === 'select' ? (
                              <select value={f.val} onChange={e=>setEditingProduct({...editingProduct, [f.field]: e.target.value})} className="w-full bg-transparent text-[11px] font-black text-white uppercase outline-none cursor-pointer"><option value="Nuevo" className="bg-black">Nuevo</option><option value="Usado" className="bg-black">Usado</option><option value="Refurbished" className="bg-black">Renovado</option></select>
                            ) : (
                              <input type={f.type} value={f.val || ''} onChange={e=>setEditingProduct({...editingProduct, [f.field]: e.target.value})} className={`w-full bg-transparent text-sm font-black outline-none ${f.type === 'number' ? 'font-mono ' + f.color : 'text-white'}`} placeholder={f.placeholder} />
                            )}
                         </div>
                       ))}
                    </div>
                 </section>

                 <section className="grid grid-cols-2 gap-10">
                    <div className="bg-white/[0.01] p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
                       <div className="flex items-center gap-4 text-emerald-500"><ShieldCheck size={24}/><span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Garantía Sovereign</span></div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3"><p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest ml-1">Valor Numérico</p><input type="number" value={editingProduct.garantia_num} onChange={e=>setEditingProduct({...editingProduct, garantia_num: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-center text-lg font-black text-emerald-500 outline-none focus:border-emerald-500/30 shadow-inner" /></div>
                          <div className="space-y-3"><p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest ml-1">Unidad de Tiempo</p><div className="relative"><select value={editingProduct.garantia_unit} onChange={e=>setEditingProduct({...editingProduct, garantia_unit: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-[11px] font-black text-white uppercase outline-none appearance-none cursor-pointer focus:border-emerald-500/30 transition-all"><option value="Días" className="bg-black">Días</option><option value="Meses" className="bg-black">Meses</option><option value="Años" className="bg-black">Años</option><option value="Sin Garantía" className="bg-black">Sin Garantía</option></select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-700"><ChevronRight size={14}/></div></div></div>
                       </div>
                    </div>
                    <div className="bg-white/[0.01] p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all"></div>
                       <div className="flex items-center gap-4 text-white"><Truck size={24}/><span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Logística Global</span></div>
                       <div className="space-y-3">
                          <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest ml-1">Método de Envío Predefinido</p>
                          <div className="relative">
                             <select value={editingProduct.tipo_envio} onChange={e=>setEditingProduct({...editingProduct, tipo_envio: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-[11px] font-black text-white uppercase outline-none appearance-none cursor-pointer focus:border-white/20 transition-all"><option value="Envío Gratuito" className="bg-black">Envío Gratuito (Prime Exclusive)</option><option value="Costo Adicional" className="bg-black">Costo de Envío Adicional</option></select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-700"><Plus size={14}/></div>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="bg-white/[0.01] p-12 rounded-[3.5rem] border border-white/5 space-y-8 shadow-inner group">
                    <div className="flex justify-between items-center border-l-4 border-white/10 pl-6"><div className="flex items-center gap-5 text-white"><ClipboardList size={22}/><span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Ficha Técnica Pro (Bullet Points)</span></div></div>
                    <textarea value={editingProduct.ficha_tecnica || ''} onChange={e=>setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} placeholder="• Característica Maestra 1...&#10;• Característica Maestra 2..." className="w-full bg-transparent text-[13px] font-medium text-neutral-400 outline-none h-60 resize-none leading-relaxed border-l-2 border-emerald-500/10 pl-10 focus:border-emerald-500/40 transition-all placeholder:text-neutral-800"></textarea>
                 </section>

                 <footer className="flex items-center gap-8 pt-12 sticky bottom-0 bg-black/90 backdrop-blur-2xl py-10 border-t border-white/5 z-20">
                    <button onClick={() => setIsModalOpen(false)} className="px-10 py-6 text-neutral-700 font-black uppercase text-[11px] tracking-[0.3em] hover:text-white transition-all">Descartar Cambios</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.6em] shadow-[0_20px_60px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-5 group">
                       <Save size={24} className="group-hover:rotate-12 transition-transform"/> Sincronizar Asset Amazon Pro
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
