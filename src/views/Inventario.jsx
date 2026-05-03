import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap, ShoppingCart
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
  const isAgotado = parseInt(p.stock_actual) === 0;
  
  return (
    <div 
      className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-4 flex flex-col gap-4 group hover:border-emerald-500/30 transition-all duration-500 shadow-2xl relative"
    >
      {/* IMAGEN DEL PRODUCTO CON ICONOS FLOTANTES RESTAURADOS */}
      <div className="relative aspect-square w-full rounded-[1.8rem] overflow-hidden bg-[#0a0a0a] border border-white/5">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isAgotado ? 'grayscale brightness-50 blur-[2px]' : ''}`} 
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
             <Package size={40} strokeWidth={1} className="text-neutral-900" />
          </div>
        )}

        {/* OVERLAY AGOTADO */}
        {isAgotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] rounded-[inherit] pointer-events-none">
            <span className="text-white text-[10px] font-black tracking-[0.8em] uppercase">AGOTADO</span>
          </div>
        )}

        {/* BADGE DISPONIBLE */}
        {!isAgotado && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#10b981]/10 border border-[#10b981]/20 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></div>
             <span className="text-[7px] text-[#10b981] font-black uppercase tracking-widest">DISPONIBLE</span>
          </div>
        )}

        {/* ICONOS FLOTANTES DE ACCIÓN (RESTAURADOS) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit(p); }}
             className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110 active:scale-95"
           >
             <Edit3 size={18}/>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }}
             className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-rose-600 hover:scale-110 active:scale-95"
           >
             <Trash2 size={18}/>
           </button>
        </div>
      </div>

      {/* CONTENIDO DE TEXTO */}
      <div className="px-1 space-y-3">
        <div className="space-y-1">
          <h3 className="text-[13px] font-black text-white uppercase tracking-tight line-clamp-2 leading-tight min-h-[32px]">
            {p.nombre}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">{p.marca || 'SOVEREIGN'}</span>
            <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest">{p.stock_actual} UDS</span>
          </div>
        </div>

        <div className="pt-1 flex flex-col">
          {p.precio_antes > 0 && (
            <p className="text-[9px] font-mono font-black text-neutral-600 line-through mb-0.5">
              {parseFloat(p.precio_antes).toLocaleString()} BS.
            </p>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-black text-white tracking-tighter">
              {parseFloat(p.precio_venta || 0).toLocaleString()}
            </span>
            <span className="text-[9px] font-black text-neutral-500 uppercase">BS.</span>
          </div>
        </div>
      </div>

      {/* BOTÓN MAESTRO (DISPARA EL EDITOR TAMBIÉN) */}
      <button 
        onClick={() => onEdit(p)}
        className="w-full bg-[#10b981] hover:bg-[#059669] text-black h-12 rounded-[1.2rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-[#10b981]/10 mt-1"
      >
        <ShoppingCart size={16} strokeWidth={3}/>
        <span className="text-[11px] font-black uppercase tracking-widest">GESTIONAR</span>
      </button>
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
      
      <header className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-row justify-between items-center mb-10 gap-8'}`}>
        <div className={isMobile ? 'text-center w-full' : ''}>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Inventario <span className="text-emerald-500">Pro</span></h2>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.5em] mt-3">Control Maestro de Activos</p>
        </div>
        <button onClick={openNewProduct} className="bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 px-10 py-5">
           <Plus size={18} strokeWidth={3}/> Nuevo Activo
        </button>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={20}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos..." className="w-full bg-[#050505] border border-white/5 text-white rounded-2xl py-6 pl-16 pr-8 text-sm outline-none focus:border-emerald-500/30 transition-all shadow-inner" />
      </div>

      <div className={`grid gap-5 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'}`}>
        {filteredProducts.map(p => ( <ProductCard key={p.id} p={p} isDark={isDark} onEdit={handleEditProduct} onDelete={handleDeleteProduct} /> ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-2 md:p-6 overflow-y-auto mac-scrollbar">
           <div className="bg-[#050505] border border-white/10 w-full max-w-[1200px] rounded-[40px] p-6 md:p-12 shadow-2xl relative my-auto">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                       <Edit3 size={30}/>
                    </div>
                    <div>
                       <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Editor Maestre</h3>
                       <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Configuración Avanzada de Activos</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-neutral-600 hover:text-rose-500 transition-all"><X size={32}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                 {/* COLUMNA IZQUIERDA: MEDIA & LOGÍSTICA */}
                 <div className="col-span-12 md:col-span-4 space-y-6">
                    <div className="aspect-square bg-[#0a0a0a] rounded-[30px] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                       {editingProduct.imagen ? <img src={editingProduct.imagen} className="w-full h-full object-cover rounded-[inherit]" alt="Main"/> : <ImageIcon size={50} className="text-neutral-900" />}
                       <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer gap-3">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} />
                          <Plus className="text-white" size={30}/>
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar Foto</span>
                       </label>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-[25px] border border-white/5 space-y-4">
                       <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2"><Truck size={12}/> Envío & Logística</p>
                       <select value={editingProduct.tipo_envio || ''} onChange={e=>setEditingProduct({...editingProduct, tipo_envio: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-[10px] font-black text-white uppercase outline-none">
                          <option value="Envío Gratuito">Envío Gratuito</option>
                          <option value="Costo de Envío Adicional">Envío con Costo</option>
                       </select>
                    </div>

                    <div className="bg-white/5 p-6 rounded-[25px] border border-white/5 space-y-4">
                       <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Garantía Sovereign</p>
                       <div className="flex gap-2">
                          <input type="number" value={editingProduct.garantia_num} onChange={e=>setEditingProduct({...editingProduct, garantia_num: e.target.value})} className="w-16 bg-black border border-white/10 rounded-xl p-3 text-center text-xs font-black text-emerald-500 outline-none" />
                          <select value={editingProduct.garantia_unit} onChange={e=>setEditingProduct({...editingProduct, garantia_unit: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black text-white uppercase outline-none">
                             <option value="Días">Días</option>
                             <option value="Meses">Meses</option>
                             <option value="Años">Años</option>
                             <option value="Sin Garantía">Sin Garantía</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* COLUMNA DERECHA: TODOS LOS CAMPOS RESTAURADOS */}
                 <div className="col-span-12 md:col-span-8 space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4"><Tag size={16} className="text-emerald-500"/><p className="text-[10px] font-black text-white uppercase tracking-widest">Identidad del Producto</p></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Nombre Comercial</p><input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Categoría</p><input type="text" value={editingProduct.categoria || ''} onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Marca</p><input type="text" value={editingProduct.marca || ''} onChange={(e) => setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-transparent text-sm font-black text-emerald-500 outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Distribuidor Maestro</p><input type="text" value={editingProduct.distribuidor || ''} onChange={(e) => setEditingProduct({...editingProduct, distribuidor: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" /></div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-amber-500 pl-4"><Briefcase size={16} className="text-amber-500"/><p className="text-[10px] font-black text-white uppercase tracking-widest">Logística & Finanzas</p></div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Costo</p><input type="number" value={editingProduct.precio_costo} onChange={e=>setEditingProduct({...editingProduct, precio_costo: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-neutral-600 outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Venta Maestra</p><input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-emerald-500 outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Precio Anterior</p><input type="number" value={editingProduct.precio_antes} onChange={e=>setEditingProduct({...editingProduct, precio_antes: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-rose-500/30 line-through outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Stock Actual</p><input type="number" value={editingProduct.stock_actual} onChange={e=>setEditingProduct({...editingProduct, stock_actual: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-amber-500 outline-none" /></div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Ubicación</p><input type="text" value={editingProduct.ubicacion || ''} onChange={e=>setEditingProduct({...editingProduct, ubicacion: e.target.value})} className="w-full bg-transparent text-xs font-black text-white outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Serial / IMEI</p><input type="text" value={editingProduct.serial || ''} onChange={e=>setEditingProduct({...editingProduct, serial: e.target.value})} className="w-full bg-transparent text-xs font-black text-white outline-none" /></div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[7px] font-black text-neutral-600 uppercase mb-2">Stock Mínimo</p><input type="number" value={editingProduct.stock_minimo} onChange={e=>setEditingProduct({...editingProduct, stock_minimo: e.target.value})} className="w-full bg-transparent text-sm font-mono font-black text-rose-500 outline-none" /></div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-white pl-4"><FileText size={16} className="text-white"/><p className="text-[10px] font-black text-white uppercase tracking-widest">Ficha Técnica & Detalles</p></div>
                       <textarea value={editingProduct.ficha_tecnica || ''} onChange={e=>setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} placeholder="Especificaciones técnicas, dimensiones, potencia..." className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-xs font-medium text-neutral-400 outline-none focus:border-emerald-500/30 transition-all h-32 resize-none"></textarea>
                    </div>
                 </div>
              </div>

              <div className="mt-12 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white/5 text-neutral-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-100 transition-all">Abortar</button>
                 <button onClick={handleSaveProduct} className="flex-[2] py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">Sincronizar Activo Maestro</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default Inventario;
