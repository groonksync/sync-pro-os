import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WHATSAPP_NUMBER = "59169109766";

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
    <div onClick={() => onSelect(p)} className={`${isDark ? 'bg-[#121212] border-white/5 hover:border-emerald-500/30' : 'bg-white border-neutral-200 hover:border-emerald-500/50'} border rounded-[32px] overflow-hidden transition-all flex flex-col group relative shadow-xl h-full cursor-pointer`}>
      {/* IMAGEN Y EFECTO AGOTADO */}
      <div className={`${isDark ? 'bg-[#080808]' : 'bg-neutral-50'} aspect-square relative overflow-hidden flex items-center justify-center border-b ${isDark ? 'border-white/5' : 'border-neutral-100'}`}>
        {p.imagen ? (
          <img src={p.imagen} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-30 blur-[4px]' : ''}`} alt={p.nombre}/>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"><Package size={30} strokeWidth={1} className="text-neutral-400" /></div>
        )}
        
        {isAgotado && (
           <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden">
              <div className="bg-emerald-600/90 backdrop-blur-md border-y border-white/10 py-2.5 w-[400%] -rotate-[15deg] shadow-2xl flex items-center justify-center">
                 <span className="text-white text-[10px] font-black tracking-[1em] uppercase">AGOTADO</span>
              </div>
           </div>
        )}

        {/* ETIQUETA CATEGORÍA - ESTILO ESMERALDA */}
        <div className="absolute top-4 left-4 z-10">
          <span className="text-[7px] text-white font-black uppercase tracking-widest bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-2xl">
            {p.categoria || 'Accesorio'}
          </span>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <button onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }} className="w-10 h-10 bg-rose-500/80 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all border border-white/10 shadow-2xl active:scale-90"><Trash2 size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-10 h-10 bg-white/80 backdrop-blur-md text-black rounded-xl flex items-center justify-center hover:bg-white transition-all border border-white/10 shadow-2xl active:scale-90"><Edit3 size={14} /></button>
        </div>

        {/* INDICADOR STOCK - ESTILO ESMERALDA */}
        <div className="absolute top-4 right-4 z-10">
          <p className="text-[9px] font-mono font-black px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 bg-black/40 text-emerald-400 shadow-2xl">
            {p.stock_actual} UDS
          </p>
        </div>
      </div>

      {/* INFORMACIÓN DETALLADA */}
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-1">
           <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-neutral-900'} line-clamp-1 leading-tight tracking-tight uppercase`}>{p.nombre}</h3>
           <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">{p.marca || 'Sovereign Core'}</p>
              {/* ETIQUETA ENVÍO */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-widest ${p.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-neutral-500'}`}>
                 <Truck size={8} />
                 {p.tipo_envio === 'Envío Gratuito' ? 'Gratis' : 'Adic.'}
              </div>
           </div>
        </div>
        
        <div className="flex flex-col">
           <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mb-0.5">Venta Final</p>
           <p className={`text-4xl font-mono ${isDark ? 'text-white' : 'text-neutral-900'} font-black tracking-tighter leading-none flex items-baseline`}>
              {parseFloat(p.precio_venta || 0).toLocaleString()}
              <span className="text-xs opacity-20 ml-1 font-sans font-black">BS.</span>
           </p>
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
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
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
  const allImages = selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [];

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-500 ${isMobile ? 'pb-20' : ''}`}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} onClose={() => setToast({ ...toast, show: false })} />
      
      <header className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-row justify-between items-center mb-16 gap-8'}`}>
        <div className={isMobile ? 'text-center w-full' : ''}>
          <h2 className={`text-4xl md:text-6xl font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tighter leading-none`}>Inventario <span className="text-emerald-500">Pro</span></h2>
          <p className="text-[9px] md:text-[11px] text-neutral-500 font-black uppercase tracking-[0.5em] flex items-center justify-center md:justify-start gap-3 mt-4"><Layout size={14}/> Global Assets Hub</p>
        </div>
        <button onClick={openNewProduct} className={`bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${isMobile ? 'w-full py-6' : 'px-14 py-6'}`}>
           <Plus size={20} strokeWidth={3}/> Nuevo Activo Maestro
        </button>
      </header>

      <div className={`relative ${isMobile ? 'my-8' : 'mb-14'}`}>
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-500" size={20}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos..." className={`w-full ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'} border rounded-[2.5rem] py-6 md:py-8 pl-20 pr-8 text-base outline-none focus:border-emerald-500/50 transition-all shadow-inner`} />
      </div>

      <div className={`grid gap-4 md:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7'}`}>
        {filteredProducts.map(p => ( <ProductCard key={p.id} p={p} isDark={isDark} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onSelect={setSelectedProduct} /> ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-2 md:p-6 overflow-y-auto">
           <div className={`${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-neutral-200'} border w-full max-w-[1000px] rounded-[48px] p-6 md:p-12 shadow-2xl relative my-auto`}>
              <div className="flex justify-between items-center mb-10">
                 <h3 className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tighter`}>Editor Maestre</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-rose-500 p-3 bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                 <div className="col-span-12 md:col-span-4 space-y-6">
                    <div className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center relative overflow-hidden group">
                       {editingProduct.imagen ? <img src={editingProduct.imagen} className="w-full h-full object-cover rounded-[inherit]" alt="Main"/> : <ImageIcon size={48} className="text-neutral-800" />}
                       <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} />
                          <Plus className="text-white" size={32} />
                       </label>
                    </div>
                 </div>
                 <div className="col-span-12 md:col-span-8 space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4 mb-4">
                          <Tag size={14} className="text-emerald-500"/>
                          <p className={`text-[9px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-widest`}>Identificación</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Nombre del Producto</p><input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none`} /></div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Marca</p><input type="text" value={editingProduct.marca || ''} onChange={(e) => setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-transparent text-sm font-black text-emerald-500 outline-none" /></div>
                          {/* RESTAURACIÓN DISTRIBUIDOR */}
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 col-span-2"><p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Distribuidor / Proveedor Maestro</p><div className="flex items-center gap-3"><Briefcase size={14} className="text-neutral-700" /><input type="text" value={editingProduct.distribuidor || ''} onChange={(e) => setEditingProduct({...editingProduct, distribuidor: e.target.value})} className={`w-full bg-transparent text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} outline-none`} placeholder="Nombre del proveedor..."/></div></div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Venta</p><input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-xl font-mono font-black text-emerald-500 outline-none" /></div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Stock</p><input type="number" value={editingProduct.stock_actual} onChange={e=>setEditingProduct({...editingProduct, stock_actual: e.target.value})} className="w-full bg-transparent text-xl font-mono font-black text-amber-500 outline-none" /></div>
                    </div>
                 </div>
              </div>
              <div className="mt-10 flex gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white/5 text-neutral-500 rounded-[2rem] font-black text-[10px] uppercase">Cancelar</button><button onClick={handleSaveProduct} className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-2xl">Sincronizar Cambios</button></div>
           </div>
        </div>
      )}
    </div>
  );
};
export default Inventario;
