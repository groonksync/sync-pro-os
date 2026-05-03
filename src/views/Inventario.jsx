import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, TrendingUp, Users, Plus, Search, Filter, Share2, ExternalLink,
  ChevronRight, ChevronLeft, ArrowLeft, Save, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Box, DollarSign, 
  Percent, ShoppingCart, Truck, X, Image as ImageIcon,
  FileText, Smartphone, MessageCircle, MoreVertical, 
  History, ArrowUpRight, ArrowDownLeft, User as UserIcon,
  Cpu, Info, Hash, MapPin, Tag, BarChart3, Globe, Layout,
  ShieldAlert, Trophy, Wallet, Printer, ClipboardList, Scale, Box as BoxIcon,
  Settings, Layers, ShieldCheck, List, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WHATSAPP_NUMBER = "59169109766";

// COMPONENTE: NOTIFICACIÓN DE LUJO (TOAST)
const Toast = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 min-w-[240px] justify-center">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
          <CheckCircle size={18} />
        </div>
        <span className="text-white text-[11px] font-black uppercase tracking-[0.4em]">{message}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, onEdit, onDelete, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(p)}
      className="bg-[#121212] border border-white/5 rounded-2xl md:rounded-[32px] overflow-hidden hover:border-blue-500/30 transition-all flex flex-col group relative shadow-2xl h-full cursor-pointer"
    >
      <div className="aspect-square bg-[#080808] relative overflow-hidden flex items-center justify-center border-b border-white/5 shadow-inner">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className={`w-full h-full object-cover rounded-[inherit] transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#050505]">
            <Package size={30} strokeWidth={1} className="text-neutral-800" />
            <span className="text-[6px] font-black text-neutral-800 uppercase tracking-widest">Sin Media</span>
          </div>
        )}

        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md border-y border-white/5 py-1.5 md:py-2.5 w-[400%] -rotate-[15deg] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                 <span className="text-white text-[8px] md:text-xs font-bold tracking-[0.4em] md:tracking-[0.8em] uppercase opacity-90">AGOTADO</span>
              </div>
           </div>
        )}

        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex flex-col gap-1.5">
          <span className="text-[6px] md:text-[8px] text-white font-black uppercase tracking-widest bg-blue-600/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/10 shadow-2xl">
            {p.categoria || 'Standard'}
          </span>
        </div>
        
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
          <p className="text-[8px] md:text-[10px] font-mono font-black px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-md border border-white/10 bg-black/40 text-white shadow-2xl">
            {p.stock_actual} UDS
          </p>
        </div>
      </div>

      <div className="p-3 md:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2 md:space-y-4">
          <div className="space-y-0.5">
             <h3 className="text-[10px] md:text-lg font-black text-white line-clamp-1 leading-tight tracking-tight uppercase">{p.nombre}</h3>
             <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{p.marca || 'Sovereign Core'}</p>
          </div>
          
          <div className="flex flex-col">
             <p className="text-[6px] md:text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-0.5">Venta Final</p>
             <p className="text-lg md:text-3xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[8px] md:text-xs opacity-20 ml-1 font-sans">BS.</span>
             </p>
          </div>
        </div>

        <div className="pt-3 md:pt-6 mt-2 md:mt-4 border-t border-white/5 flex justify-end gap-1.5 md:gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }} className="w-7 h-7 md:w-10 md:h-10 bg-rose-500/10 text-rose-500 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"><Trash2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-7 h-7 md:w-10 md:h-10 bg-[#1a1a1a] text-white rounded-lg md:rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all shadow-xl border border-white/5"><Edit3 size={14}/></button>
        </div>
      </div>
    </div>
  );
};

const Inventario = () => {
  const [activeSubTab, setActiveSubTab] = useState('productos');
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

  const normalizeText = (text) => {
    return (text || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });
      if (prodError) throw prodError;
      if (page === 0) setProductos(prodData || []);
      else setProductos(prev => [...prev, ...prodData]);
      setHasMore(prodData.length === ITEMS_PER_PAGE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      const garantiaString = editingProduct.garantia_unit === 'Sin Garantía' 
        ? 'Sin Garantía' 
        : `${editingProduct.garantia_num || 0} ${editingProduct.garantia_unit || 'Días'}`;

      const payload = { 
        id: editingProduct.id,
        nombre: editingProduct.nombre,
        marca: editingProduct.marca,
        categoria: editingProduct.categoria,
        precio_costo: parseFloat(editingProduct.precio_costo) || 0,
        precio_venta: parseFloat(editingProduct.precio_venta) || 0,
        precio_antes: parseFloat(editingProduct.precio_antes) || 0,
        stock_actual: parseInt(editingProduct.stock_actual) || 0,
        stock_minimo: parseInt(editingProduct.stock_minimo) || 5,
        stock_vendido: parseInt(editingProduct.stock_vendido) || 0,
        ficha_tecnica: editingProduct.ficha_tecnica,
        estado: editingProduct.estado || 'Stock',
        imagen: editingProduct.imagen,
        codigo: editingProduct.codigo,
        ubicacion: editingProduct.ubicacion,
        serial: editingProduct.serial,
        garantia: garantiaString,
        tipo_envio: editingProduct.tipo_envio,
        imagenes: editingProduct.imagenes,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      
      await fetchData();
      setIsModalOpen(false);
      setEditingProduct(null);
      setToast({ show: true, message: 'SINCRONIZADO' }); // NOTIFICACIÓN DE UNA PALABRA
    } catch (e) { 
      alert('Error: ' + e.message); 
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id, imageUrl) => {
     if (!confirm('¿Eliminar producto?')) return;
     setLoading(true);
     try {
        await supabase.from('productos').delete().eq('id', id);
        await fetchData();
        setToast({ show: true, message: 'ELIMINADO' });
     } catch(e) { alert(e.message); }
     setLoading(false);
  };

  const handleEditProduct = (p) => {
    let gNum = 0, gUnit = 'Días';
    if (p.garantia === 'Sin Garantía') gUnit = 'Sin Garantía';
    else if (p.garantia) {
      const parts = p.garantia.split(' ');
      gNum = parseInt(parts[0]) || 0;
      gUnit = parts[1] || 'Días';
    }
    setEditingProduct({ ...p, garantia_num: gNum, garantia_unit: gUnit });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: crypto.randomUUID(), nombre: '', categoria: 'Computadoras', marca: '',
      precio_costo: 0, precio_venta: 0, precio_antes: 0, stock_actual: 0, stock_minimo: 5, stock_vendido: 0,
      ficha_tecnica: '', estado: 'Stock', imagen: '', codigo: '', ubicacion: '', serial: '', 
      garantia_num: 0, garantia_unit: 'Días', tipo_envio: 'Envío Gratuito', imagenes: []
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e, type = 'main') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
        urls.push(publicUrl);
      }
      if (type === 'gallery') setEditingProduct(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), ...urls] }));
      else setEditingProduct(prev => ({ ...prev, imagen: urls[0], imagenes: [urls[0], ...(prev.imagenes || [])] }));
      setToast({ show: true, message: 'MEDIA OK' });
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const filteredProducts = (productos || []).filter(p => {
    const norm = normalizeText(searchTerm);
    return normalizeText(p.nombre).includes(norm) || normalizeText(p.codigo).includes(norm);
  });

  const allImages = selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [];
  const nextImg = () => setCurrentImgIndex(prev => (prev + 1) % allImages.length);
  const prevImg = () => setCurrentImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="flex flex-col h-full max-w-full w-full animate-in fade-in duration-500">
      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
      
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Inventario <span className="text-blue-500">Pro</span></h2>
          <div className="flex items-center gap-3">
            <p className="text-[8px] md:text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] flex items-center gap-2"><Layout size={12}/> Asset Intelligence</p>
          </div>
        </div>
        <button onClick={openNewProduct} className="px-12 py-5 bg-white text-black rounded-2xl md:rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
           <Plus size={18} strokeWidth={3}/> Nuevo Registro
        </button>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos maestros..." className="w-full bg-[#121212] border border-white/10 rounded-2xl md:rounded-[2rem] py-5 md:py-6 pl-16 pr-6 text-sm text-white outline-none focus:border-white/20 transition-all"/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {filteredProducts.map(p => (
          <ProductCard key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onSelect={setSelectedProduct} />
        ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-2 md:p-6 overflow-y-auto">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[1000px] rounded-[32px] md:rounded-[48px] p-6 md:p-12 shadow-2xl relative my-auto">
              <div className="flex justify-between items-center mb-10 md:mb-14">
                 <div className="space-y-1">
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">Editor de Activos</h3>
                    <p className="text-[7px] md:text-[9px] font-black text-neutral-500 uppercase tracking-[0.4em]">Sovereign Synchronizer System</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-neutral-700 hover:text-white p-3 bg-white/5 rounded-full border border-white/5"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-12 gap-6 md:gap-12">
                 <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-inner">
                       {editingProduct.imagen ? (
                          <img src={editingProduct.imagen} className="w-full h-full object-cover rounded-[inherit] transition-transform duration-700 group-hover:scale-110" alt="Principal"/>
                       ) : (
                          <div className="text-center"><ImageIcon size={48} className="text-neutral-800 mx-auto mb-3" /><p className="text-[8px] font-black uppercase text-neutral-700 tracking-widest">Esperando Media</p></div>
                       )}
                       <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} />
                          <div className="flex flex-col items-center gap-2">
                             <Plus className="text-white" size={32} />
                             <span className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar Imagen</span>
                          </div>
                       </label>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[7px] font-black text-neutral-500 uppercase tracking-widest pl-2">Galería Maestra</p>
                       <div className="flex flex-wrap gap-2.5">
                          {editingProduct?.imagenes?.map((img, idx) => (
                             <div key={idx} className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl border border-white/10 relative group overflow-hidden shadow-2xl">
                                <img src={img} className="w-full h-full object-cover rounded-[inherit]" />
                                <button onClick={() => {
                                   const newImgs = editingProduct.imagenes.filter((_, i) => i !== idx);
                                   setEditingProduct({...editingProduct, imagenes: newImgs});
                                }} className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                             </div>
                          ))}
                          <label className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                             <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} /><Plus className="text-neutral-700" size={20} />
                          </label>
                       </div>
                    </div>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-blue-500 pl-4 mb-4">
                          <Tag size={14} className="text-blue-500"/>
                          <p className="text-[9px] font-black text-white uppercase tracking-widest">Identificación</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Nombre del Producto</p>
                             <input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Marca / Fabricante</p>
                             <input type="text" value={editingProduct.marca || ''} onChange={(e) => setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" />
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Categoría</p>
                             <select value={editingProduct.categoria || ''} onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full bg-transparent text-xs font-black text-white outline-none uppercase cursor-pointer">
                                <option value="Computadoras">Computadoras</option>
                                <option value="Accesorios">Accesorios</option>
                                <option value="Audio">Audio</option>
                                <option value="Cámaras">Cámaras</option>
                                <option value="Smartphones">Smartphones</option>
                             </select>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Código Maestro</p>
                             <input type="text" value={editingProduct.codigo || ''} onChange={(e) => setEditingProduct({...editingProduct, codigo: e.target.value})} className="w-full bg-transparent text-xs font-mono font-black text-blue-500 outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Serial Único</p>
                             <input type="text" value={editingProduct.serial || ''} onChange={(e) => setEditingProduct({...editingProduct, serial: e.target.value})} className="w-full bg-transparent text-xs font-mono font-black text-emerald-500 outline-none" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4 mb-4">
                          <DollarSign size={14} className="text-emerald-500"/>
                          <p className="text-[9px] font-black text-white uppercase tracking-widest">Precios & Rentabilidad</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Inversión (Costo)</p>
                             <input type="number" value={editingProduct.precio_costo || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_costo: e.target.value})} className="w-full bg-transparent text-xl font-mono font-black text-rose-500 outline-none" />
                          </div>
                          <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 ring-1 ring-blue-500/30 shadow-2xl">
                             <p className="text-[7px] font-black text-blue-500 uppercase mb-2 tracking-widest">Venta (Inversión Final)</p>
                             <input type="number" value={editingProduct.precio_venta || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-2xl font-mono font-black text-white outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">PVP Referencial</p>
                             <input type="number" value={editingProduct.precio_antes || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_antes: e.target.value})} className="w-full bg-transparent text-xl font-mono font-black text-neutral-500 outline-none" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-3 border-l-2 border-amber-500 pl-4 mb-4">
                          <BoxIcon size={14} className="text-amber-500"/>
                          <p className="text-[9px] font-black text-white uppercase tracking-widest">Logística</p>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Stock</p>
                             <input type="number" value={editingProduct.stock_actual || 0} onChange={(e) => setEditingProduct({...editingProduct, stock_actual: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-white outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Mínimo</p>
                             <input type="number" value={editingProduct.stock_minimo || 5} onChange={(e) => setEditingProduct({...editingProduct, stock_minimo: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-amber-500 outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Ubicación</p>
                             <input type="text" value={editingProduct.ubicacion || ''} onChange={(e) => setEditingProduct({...editingProduct, ubicacion: e.target.value})} className="w-full bg-transparent text-[10px] font-black text-white outline-none uppercase" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Logística</p>
                             <select value={editingProduct.tipo_envio || 'Envío Gratuito'} onChange={e => setEditingProduct({...editingProduct, tipo_envio: e.target.value})} className="w-full bg-transparent text-[9px] font-black text-white outline-none uppercase">
                                <option value="Envío Gratuito">Envío Gratis</option>
                                <option value="Cobro Adicional">Cobro Adic.</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-14 flex flex-col md:flex-row gap-4">
                 <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="flex-1 py-6 bg-white/5 text-neutral-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:text-white transition-all border border-white/5">Cancelar</button>
                 <button onClick={handleSaveProduct} disabled={loading} className="flex-[2] py-6 bg-white text-black font-black rounded-[2.5rem] uppercase text-[10px] tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 active:scale-95">
                    {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <Save size={18}/>}
                    {loading ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {selectedProduct && (
         <div className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[950px] rounded-[24px] md:rounded-[40px] overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-[160] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-600 hover:text-white transition-all"><X size={20}/></button>
               <div className="w-full md:w-[42%] bg-[#080808] p-4 md:p-10 flex items-center justify-center relative">
                  <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500" key={currentImgIndex}>
                     <img src={allImages[currentImgIndex]} className="max-w-full max-h-[55vh] object-cover drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl" />
                  </div>
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none px-4">
                       <button onClick={prevImg} className="w-10 h-10 bg-white/5 text-white rounded-full flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all"><ChevronLeft size={18}/></button>
                       <button onClick={nextImg} className="w-10 h-10 bg-white/5 text-white rounded-full flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all"><ChevronRight size={18}/></button>
                    </div>
                  )}
               </div>
               <div className="w-full md:w-[58%] p-4 md:p-8 flex flex-col justify-between bg-[#121212]">
                  <div className="space-y-4">
                     <div>
                        <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">{selectedProduct.categoria}</p>
                        <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase mt-1 leading-tight">{selectedProduct.nombre}</h2>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl shadow-inner">
                        <p className="text-[6px] md:text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Inversión Final</p>
                        <div className="flex items-baseline gap-3">
                           <p className="text-3xl md:text-5xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}</p>
                           <div className="flex flex-col">
                              {selectedProduct.precio_antes > selectedProduct.precio_venta && <p className="text-[9px] md:text-xs text-neutral-600 font-mono line-through opacity-50">{parseFloat(selectedProduct.precio_antes).toLocaleString()}</p>}
                              <span className="text-[9px] md:text-xs font-black text-blue-500">BS.</span>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[7px] md:text-[8px] font-black text-neutral-500 uppercase mb-1">Garantía</p>
                           <p className="text-[10px] md:text-xs font-black text-white">{selectedProduct.garantia || 'Consultar'}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border flex items-center gap-2 ${selectedProduct.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                           <Truck size={14} /><p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{selectedProduct.tipo_envio || 'Cobro Adicional'}</p>
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 flex gap-4">
                     <button onClick={() => handleEditProduct(selectedProduct)} className="flex-1 py-5 bg-[#1a1a1a] border border-white/5 text-white rounded-[2rem] font-black text-[9px] md:text-xs uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"><Edit3 size={16}/> Editar</button>
                     <button onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa: ${selectedProduct.nombre}`, '_blank')} className="flex-[1.5] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[9px] md:text-xs uppercase hover:bg-blue-500 transition-all shadow-xl flex items-center justify-center gap-3"><WhatsAppIcon size={18}/> WhatsApp</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Inventario;
