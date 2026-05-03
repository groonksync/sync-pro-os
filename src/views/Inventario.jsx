import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap
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

const ProductCard = ({ p, onEdit, onDelete, onSelect, isDark }) => {
  const isAgotado = parseInt(p.stock_actual) === 0;
  
  return (
    <div 
      onClick={() => onSelect(p)} 
      className={`group relative flex flex-col transition-all duration-500 hover:-translate-y-2 h-full cursor-pointer`}
    >
      {/* SOMBRA DE FONDO DINÁMICA */}
      <div className="absolute inset-0 bg-emerald-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-[48px]"></div>

      {/* CUERPO PRINCIPAL DEL CUADRO (ESTILO OBSIDIAN GLASS) */}
      <div className={`relative flex-1 flex flex-col ${isDark ? 'bg-[#0a0a0a]/80 border-white/5' : 'bg-white border-neutral-200'} backdrop-blur-xl border rounded-[48px] overflow-hidden shadow-2xl group-hover:border-emerald-500/30 transition-all duration-500`}>
        
        {/* CONTENEDOR DE IMAGEN (FRAME FLOTANTE) */}
        <div className="relative aspect-square m-2.5 overflow-hidden rounded-[38px] bg-black/20 shadow-inner">
           {p.imagen ? (
             <img 
               src={p.imagen} 
               className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${isAgotado ? 'grayscale brightness-50 blur-[3px]' : ''}`} 
               alt={p.nombre}
             />
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/5">
                <Package size={40} strokeWidth={1} className="text-neutral-700" />
             </div>
           )}

           {/* OVERLAY AGOTADO (REPARADO: CORTE CIRCULAR PERFECTO) */}
           {isAgotado && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-700">
                 <div className="border-y border-white/10 py-3 w-full text-center bg-black/20">
                    <span className="text-white text-[10px] font-black tracking-[0.8em] uppercase drop-shadow-2xl">AGOTADO</span>
                 </div>
              </div>
           )}

           {/* CHIPS DE INFORMACIÓN (ESTILO CRISTAL) */}
           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <span className="text-[7px] text-white font-black uppercase tracking-[0.2em] bg-emerald-500/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl">
                {p.categoria || 'Sync Pro'}
              </span>
           </div>

           {!isAgotado && (
              <div className="absolute top-4 right-4 z-10">
                 <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[9px] font-mono font-black text-white">{p.stock_actual} UDS</p>
                 </div>
              </div>
           )}

           {/* ACCIONES FLOTANTES */}
           <div className="absolute bottom-4 right-4 z-20 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-all duration-500">
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }} className="w-10 h-10 bg-rose-500/90 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all border border-white/10 shadow-2xl"><Trash2 size={16}/></button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-10 h-10 bg-white/90 backdrop-blur-md text-black rounded-2xl flex items-center justify-center hover:bg-white transition-all border border-white/10 shadow-2xl"><Edit3 size={16}/></button>
           </div>
        </div>

        {/* DETALLES Y DESCRIPCIONES (JERARQUÍA REFINADA) */}
        <div className="p-7 pt-2 flex flex-col gap-5">
           <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">{p.marca || 'Sovereign Core'}</p>
                 <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>
              <h3 className={`text-sm md:text-lg font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tight leading-[1.1] min-h-[40px] line-clamp-2`}>
                {p.nombre}
              </h3>
           </div>

           <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                 <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Inversión Final</p>
                 <div className="flex items-baseline gap-1">
                    <span className={`text-2xl md:text-3xl font-mono font-black ${isDark ? 'text-white' : 'text-neutral-900'} tracking-tighter`}>
                       {parseFloat(p.precio_venta || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-neutral-700">BS.</span>
                 </div>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${p.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-neutral-600'} text-[7px] font-black uppercase tracking-widest`}>
                 <Truck size={10} />
                 {p.tipo_envio === 'Envío Gratuito' ? 'Gratis' : 'Adic.'}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Inventario = ({ settings, isDark }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 24;
  const [selectedProduct, setSelectedProduct] = useState(null);
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
      const payload = { ...editingProduct, garantia: garantiaString, updated_at: new Date().toISOString() };
      delete payload.garantia_num; delete payload.garantia_unit;
      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      await fetchData(); setIsModalOpen(false); setEditingProduct(null); setToast({ show: true, message: 'SINCRONIZADO' });
    } catch (e) { alert('Error: ' + e.message); } finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id) => {
     if (!confirm('¿Eliminar producto?')) return;
     try { await supabase.from('productos').delete().eq('id', id); await fetchData(); setToast({ show: true, message: 'ELIMINADO' }); } catch(e) { alert(e.message); }
  };

  const handleEditProduct = (p) => {
    let gNum = 0, gUnit = 'Días';
    if (p.garantia === 'Sin Garantía') gUnit = 'Sin Garantía';
    else if (p.garantia) { const parts = p.garantia.split(' '); gNum = parseInt(parts[0]) || 0; gUnit = parts[1] || 'Días'; }
    setEditingProduct({ ...p, distribuidor: p.distribuidor || '', garantia_num: gNum, garantia_unit: gUnit }); setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: crypto.randomUUID(), nombre: '', categoria: 'Computadoras', marca: '', distribuidor: '', precio_costo: 0, precio_venta: 0, precio_antes: 0, stock_actual: 0, stock_minimo: 5, stock_vendido: 0, ficha_tecnica: '', estado: 'Stock', imagen: '', codigo: '', ubicacion: '', serial: '', garantia_num: 0, garantia_unit: 'Días', tipo_envio: 'Envío Gratuito', imagenes: []
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e, type = 'main') => {
    const files = Array.from(e.target.files); if (files.length === 0) return; setLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop(); const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
        if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName); urls.push(publicUrl);
      }
      if (type === 'gallery') setEditingProduct(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), ...urls] }));
      else setEditingProduct(prev => ({ ...prev, imagen: urls[0], imagenes: [urls[0], ...(prev.imagenes || [])] }));
      setToast({ show: true, message: 'MEDIA OK' });
    } catch (err) { alert('Error: ' + err.message); } finally { setLoading(false); }
  };

  const filteredProducts = productos.filter(p => { const norm = normalizeText(searchTerm); return normalizeText(p.nombre).includes(norm) || normalizeText(p.codigo).includes(norm); });

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-700 ${isMobile ? 'pb-20' : ''}`}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} onClose={() => setToast({ ...toast, show: false })} />
      
      <header className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-row justify-between items-center mb-16 gap-8'}`}>
        <div className={isMobile ? 'text-center w-full' : ''}>
          <h2 className={`text-4xl md:text-7xl font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tighter leading-none`}>Inventario <span className="text-emerald-500">Pro</span></h2>
          <p className="text-[9px] md:text-[11px] text-neutral-500 font-black uppercase tracking-[0.5em] flex items-center justify-center md:justify-start gap-3 mt-5"><Zap size={16} className="text-emerald-500 animate-pulse"/> Sovereign Asset Monitor</p>
        </div>
        <button onClick={openNewProduct} className={`bg-emerald-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${isMobile ? 'w-full py-6' : 'px-16 py-7'}`}>
           <Plus size={24} strokeWidth={4}/> Nuevo Activo
        </button>
      </header>

      <div className={`relative ${isMobile ? 'my-8' : 'mb-16'}`}>
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-700" size={24}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos maestros..." className={`w-full ${isDark ? 'bg-black/40 border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-900'} border rounded-[3rem] py-7 md:py-9 pl-24 pr-10 text-lg outline-none focus:border-emerald-500/50 transition-all shadow-2xl`} />
      </div>

      <div className={`grid gap-6 md:gap-10 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'}`}>
        {filteredProducts.map(p => ( <ProductCard key={p.id} p={p} isDark={isDark} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onSelect={setSelectedProduct} /> ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-2 md:p-6 overflow-y-auto mac-scrollbar">
           <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10 shadow-[0_0_100px_rgba(16,185,129,0.05)]' : 'bg-white border-neutral-200'} border w-full max-w-[1200px] rounded-[60px] p-6 md:p-16 shadow-2xl relative my-auto`}>
              <div className="flex justify-between items-center mb-14">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                       <Edit3 size={30}/>
                    </div>
                    <div>
                       <h3 className={`text-3xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tighter`}>Editor Maestre</h3>
                       <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] mt-1">Configuración de Activo Nivel Ejecutivo</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-neutral-700 hover:text-rose-500 transition-all"><X size={40}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
                 {/* COLUMNA IZQUIERDA: MEDIA & ASSETS */}
                 <div className="col-span-12 md:col-span-4 space-y-8">
                    <div className="aspect-square bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                       {editingProduct.imagen ? <img src={editingProduct.imagen} className="w-full h-full object-cover rounded-[inherit]" alt="Main"/> : <ImageIcon size={60} className="text-neutral-800" />}
                       <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer gap-4">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} />
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-2xl"><Plus size={32} strokeWidth={3}/></div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Imagen</span>
                       </label>
                    </div>
                    
                    <div className="bg-white/5 p-8 rounded-[35px] border border-white/5 space-y-6 shadow-inner">
                       <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-3"><Truck size={14}/> Logística de Entrega</p>
                       <select value={editingProduct.tipo_envio || ''} onChange={e=>setEditingProduct({...editingProduct, tipo_envio: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-[11px] font-black uppercase ${isDark ? 'text-white' : 'text-neutral-900'} outline-none shadow-xl`}>
                          <option value="Envío Gratuito">📦 Envío Gratuito</option>
                          <option value="Costo de Envío Adicional">🚛 Costo de Envío Adicional</option>
                       </select>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[35px] border border-white/5 space-y-6 shadow-inner">
                       <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-3"><ShieldCheck size={14}/> Garantía Certificada</p>
                       <div className="flex gap-3">
                          <input type="number" value={editingProduct.garantia_num} onChange={e=>setEditingProduct({...editingProduct, garantia_num: e.target.value})} className="w-20 bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-sm font-black text-emerald-500 outline-none" />
                          <select value={editingProduct.garantia_unit} onChange={e=>setEditingProduct({...editingProduct, garantia_unit: e.target.value})} className={`flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] font-black uppercase ${isDark ? 'text-white' : 'text-neutral-900'} outline-none`}>
                             <option value="Días">Días</option>
                             <option value="Meses">Meses</option>
                             <option value="Años">Años</option>
                             <option value="Sin Garantía">Sin Garantía</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* COLUMNA DERECHA: DATA & SPECS */}
                 <div className="col-span-12 md:col-span-8 space-y-12">
                    {/* SECCIÓN: IDENTIDAD */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 border-l-[3px] border-emerald-500 pl-6">
                          <Tag size={18} className="text-emerald-500"/>
                          <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-[0.3em]`}>Identidad Maestra</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Nombre Comercial</p><input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className={`w-full bg-transparent text-lg font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none uppercase tracking-tighter`} /></div>
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5">
                             <p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Categoría Global</p>
                             <select value={editingProduct.categoria || ''} onChange={e=>setEditingProduct({...editingProduct, categoria: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none uppercase`}>
                                <option value="Computadoras">Computadoras</option>
                                <option value="Accesorios">Accesorios</option>
                                <option value="Audio">Audio</option>
                                <option value="Video">Video</option>
                             </select>
                          </div>
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Marca / Manufactura</p><input type="text" value={editingProduct.marca || ''} onChange={(e) => setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-transparent text-sm font-black text-emerald-500 outline-none uppercase" /></div>
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Identificador Interno (SKU)</p><input type="text" value={editingProduct.codigo || ''} onChange={(e) => setEditingProduct({...editingProduct, codigo: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none`} /></div>
                       </div>
                    </div>

                    {/* SECCIÓN: LOGÍSTICA */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 border-l-[3px] border-amber-500 pl-6">
                          <Briefcase size={18} className="text-amber-500"/>
                          <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-[0.3em]`}>Logística & Ubicación</p>
                       </div>
                       <div className="bg-white/5 p-5 rounded-[22px] border border-white/5 shadow-inner">
                          <p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Distribuidor / Origen de Activo</p>
                          <input type="text" value={editingProduct.distribuidor || ''} onChange={(e) => setEditingProduct({...editingProduct, distribuidor: e.target.value})} className={`w-full bg-transparent text-base font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none`} placeholder="Nombre del proveedor maestro..."/>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3">Coordenadas (Ubicación)</p><div className="flex items-center gap-3 text-neutral-800"><MapPin size={16}/><input type="text" value={editingProduct.ubicacion || ''} onChange={e=>setEditingProduct({...editingProduct, ubicacion: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none uppercase`} /></div></div>
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3">ID Único (Serial/IMEI)</p><input type="text" value={editingProduct.serial || ''} onChange={e=>setEditingProduct({...editingProduct, serial: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none tracking-widest`} /></div>
                          <div className="bg-white/5 p-5 rounded-[22px] border border-white/5"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3">Umbral (Stock Mínimo)</p><input type="number" value={editingProduct.stock_minimo} onChange={e=>setEditingProduct({...editingProduct, stock_minimo: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-rose-500 outline-none" /></div>
                       </div>
                    </div>

                    {/* SECCIÓN: ARQUITECTURA FINANCIERA */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 border-l-[3px] border-emerald-500 pl-6">
                          <DollarSign size={18} className="text-emerald-500"/>
                          <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-[0.3em]`}>Arquitectura Financiera</p>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-white/5 p-6 rounded-[25px] border border-white/10"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Costo Inversión</p><input type="number" value={editingProduct.precio_costo} onChange={e=>setEditingProduct({...editingProduct, precio_costo: e.target.value})} className="w-full bg-transparent text-2xl font-mono font-black text-neutral-600 outline-none" /></div>
                          <div className="bg-white/5 p-6 rounded-[25px] border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest text-emerald-500">Venta Maestra</p><input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-2xl font-mono font-black text-emerald-500 outline-none" /></div>
                          <div className="bg-white/5 p-6 rounded-[25px] border border-white/10"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest text-rose-500/50">Precio Tachado</p><input type="number" value={editingProduct.precio_antes} onChange={e=>setEditingProduct({...editingProduct, precio_antes: e.target.value})} className="w-full bg-transparent text-2xl font-mono font-black text-rose-500/30 line-through outline-none" /></div>
                          <div className="bg-white/5 p-6 rounded-[25px] border border-white/10"><p className="text-[8px] font-black text-neutral-600 uppercase mb-3 tracking-widest text-amber-500">Stock Actual</p><input type="number" value={editingProduct.stock_actual} onChange={e=>setEditingProduct({...editingProduct, stock_actual: e.target.value})} className="w-full bg-transparent text-2xl font-mono font-black text-amber-500 outline-none" /></div>
                       </div>
                    </div>

                    {/* SECCIÓN: ESPECIFICACIONES */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 border-l-[3px] border-white pl-6">
                          <FileText size={18} className="text-white"/>
                          <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-[0.3em]`}>Ficha Técnica Ejecutiva</p>
                       </div>
                       <textarea value={editingProduct.ficha_tecnica || ''} onChange={e=>setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} placeholder="Inyectar especificaciones maestras, potencia, dimensiones..." className={`w-full bg-white/5 border border-white/5 rounded-[35px] p-8 text-sm font-medium leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'} outline-none focus:border-emerald-500/30 transition-all h-40 resize-none shadow-inner`}></textarea>
                    </div>
                 </div>
              </div>

              {/* ACCIONES DE CIERRE */}
              <div className="mt-16 flex flex-col md:flex-row gap-6">
                 <button onClick={() => setIsModalOpen(false)} className={`flex-1 py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all ${isDark ? 'bg-white/5 text-neutral-600 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>Abortar Edición</button>
                 <button onClick={handleSaveProduct} className="flex-[2] py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-5">
                    <Save size={24} strokeWidth={4}/> Sincronizar Activo Maestro
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default Inventario;
