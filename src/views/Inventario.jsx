import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, TrendingUp, Users, Plus, Search, Filter, Share2, ExternalLink,
  ChevronRight, ChevronLeft, ArrowLeft, Save, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Box, DollarSign, 
  Percent, ShoppingCart, Truck, X, Image as ImageIcon,
  FileText, Smartphone, MessageCircle, MoreVertical, 
  History, ArrowUpRight, ArrowDownLeft, User as UserIcon,
  Cpu, Info, Hash, MapPin, Tag, BarChart3, Globe, Layout,
  ShieldAlert, Trophy, Wallet, Printer, ClipboardList, Scale, Box as BoxIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WHATSAPP_NUMBER = "59169109766";

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.117-1.605a11.793 11.793 0 005.932 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.417-8.413z"/>
  </svg>
);

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

        {/* BARRA AGOTADO: DISEÑO SUTIL (INVENTARIO) */}
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
  const [viewState, setViewState] = useState('list');
  const [productos, setProductos] = useState([]);
  const [mayoristas, setMayoristas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [activeMayorista, setActiveMayorista] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDistributor, setSearchDistributor] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMayoristaModalOpen, setIsMayoristaModalOpen] = useState(false);
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingMayorista, setEditingMayorista] = useState(null);
  const [newEntrega, setNewEntrega] = useState({ producto_id: '', cantidad: 1, monto: 0, serial_vinculado: '' });
  const [newPago, setNewPago] = useState({ monto: 0 });

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 24;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
      
      if (page === 0) {
        setProductos(prodData || []);
      } else {
        setProductos(prev => [...prev, ...prodData]);
      }
      
      setHasMore(prodData.length === ITEMS_PER_PAGE);

      const { data: mayoData } = await supabase.from('mayoristas').select('*');
      setMayoristas(Array.isArray(mayoData) ? mayoData : []);
      
      const { data: movData } = await supabase.from('movimientos_mayoristas').select('*, productos(nombre)');
      setMovimientos(Array.isArray(movData) ? movData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConsult = (p) => {
    const text = `Hola Sync Pro! Estoy gestionando este activo: *${p.nombre}*\nID: ${p.codigo || 'N/A'}\nInversión: ${p.precio_venta} BS.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareCatalog = () => {
    const url = `${window.location.origin}/catalogo`;
    navigator.clipboard.writeText(url);
    alert('🔗 ¡Link del Catálogo Sync Pro copiado al portapapeles!');
  };

  const allImages = selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [];
  const nextImg = () => setCurrentImgIndex(prev => (prev + 1) % allImages.length);
  const prevImg = () => setCurrentImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  const handleTouchStart = (e) => touchStartX.current = e.targetTouches[0].clientX;
  const handleTouchMove = (e) => touchEndX.current = e.targetTouches[0].clientX;
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) nextImg();
    if (touchStartX.current - touchEndX.current < -50) prevImg();
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      const payload = { ...editingProduct, imagen: editingProduct.imagenes?.[0] || editingProduct.imagen };
      await supabase.from('productos').upsert(payload);
      await fetchData();
      setIsModalOpen(false);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteProduct = async (id, imageUrl) => {
     if (!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
     setLoading(true);
     try {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        if (imageUrl) {
           const path = imageUrl.split('/').pop();
           await supabase.storage.from('productos').remove([path]);
        }
        await fetchData();
     } catch(e) { alert(e.message); }
     setLoading(false);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: Date.now().toString(), nombre: '', categoria: 'Computadoras', 
      precio_costo: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 5, 
      stock_vendido: 0, ficha_tecnica: '', estado: 'Stock', imagen: '', 
      codigo: '', ubicacion: '', serial: '', imagenes: []
    });
    setIsModalOpen(true);
  };

  const filteredProducts = (productos || []).filter(p => {
    const normalizedSearch = normalizeText(searchTerm);
    const matches = normalizeText(p.nombre).includes(normalizedSearch) || 
                    normalizeText(p.codigo).includes(normalizedSearch) || 
                    normalizeText(p.serial).includes(normalizedSearch);
    const cat = filterCategory === 'Todos' || p.categoria === filterCategory;
    return matches && cat;
  });

  const filteredDistributors = (mayoristas || []).filter(m => {
    const normalizedSearch = normalizeText(searchDistributor);
    return normalizeText(m.nombre).includes(normalizedSearch) || normalizeText(m.region).includes(normalizedSearch);
  });

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
      if (type === 'gallery') {
        setEditingProduct(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), ...urls] }));
      } else {
        setEditingProduct({ ...editingProduct, imagen: urls[0] });
      }
    } catch (err) { alert('Error al subir imagen: ' + err.message); }
    finally { setLoading(false); }
  };

  const renderWarranty = (p) => {
    if (p.garantia_unit === 'Sin Garantía') return 'Sin Garantía';
    return `${p.garantia_num || 0} ${p.garantia_unit || 'Días'}`;
  };

  return (
    <div className="flex flex-col h-full max-w-full w-full animate-in fade-in duration-500">
      {viewState === 'list' ? (
        <>
          <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Inventario <span className="text-blue-500">Pro</span></h2>
              <div className="flex items-center gap-3">
                <p className="text-[8px] md:text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] flex items-center gap-2"><Layout size={12}/> Global Asset Monitor</p>
                <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                <p className="text-[8px] md:text-[10px] text-blue-500 font-black uppercase tracking-[0.4em]">{productos.length} Activos</p>
              </div>
            </div>
            <div className="flex bg-[#121212] border border-white/5 p-1 rounded-2xl md:rounded-[2rem] shadow-2xl">
              <button onClick={() => setActiveSubTab('productos')} className={`px-6 md:px-10 py-2.5 md:py-3.5 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'productos' ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}>CATÁLOGO MAESTRO</button>
              <button onClick={() => setActiveSubTab('mayoristas')} className={`px-6 md:px-10 py-2.5 md:py-3.5 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'mayoristas' ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}>DISTRIBUIDORES</button>
            </div>
          </header>
 
          {activeSubTab === 'productos' && (
            <div className="space-y-8 md:space-y-12">
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                <div className="relative flex-1 group">
                  <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
                  <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos..." className="w-full bg-[#121212] border border-white/10 rounded-2xl md:rounded-[2rem] py-4 md:py-6 pl-14 md:pl-18 pr-6 text-xs md:text-sm text-white outline-none focus:border-white/20 transition-all"/>
                </div>
                 <div className="flex gap-3 md:gap-4 w-full lg:w-auto">
                    <button onClick={handleShareCatalog} className="flex-1 lg:flex-none px-6 md:px-10 py-4 md:py-6 bg-blue-600/10 text-blue-500 rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 flex items-center justify-center gap-2 md:gap-3">
                       <Share2 size={16}/>
                       Link Público
                    </button>
                    <button onClick={openNewProduct} className="flex-1 lg:flex-none px-6 md:px-12 py-4 md:py-6 bg-white text-black rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 active:scale-95">
                       <Plus size={18} strokeWidth={3}/>
                       Nuevo Ingreso
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {filteredProducts.map(p => (
                  <ProductCard 
                    key={p.id} p={p} 
                    onEdit={(prod) => { setEditingProduct(prod); setIsModalOpen(true); }}
                    onDelete={handleDeleteProduct}
                    onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-16 pb-20">
                  <button onClick={() => setPage(prev => prev + 1)} disabled={loading} className="px-20 py-6 bg-white/5 border border-white/10 rounded-[3rem] text-[11px] font-black text-white uppercase tracking-[0.5em] hover:bg-white/10 transition-all shadow-xl flex items-center gap-4">
                    {loading ? 'Syncing...' : 'Show More Assets'} <ChevronRight size={16}/>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* MODAL PRODUCTO PRO */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[950px] rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[95vh] mac-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase underline decoration-white/10 underline-offset-8">Editor de Activos <span className="text-neutral-600">Sovereign</span></h3>
                 <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="text-neutral-700 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={28}/></button>
              </div>

              <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="aspect-square bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-inner">
                       {editingProduct?.imagenes?.length > 0 ? (
                          <img src={editingProduct.imagenes[0]} className="w-full h-full object-cover rounded-[inherit] p-0 transition-transform duration-700 group-hover:scale-110" alt="Principal"/>
                       ) : (
                          <div className="text-center"><ImageIcon size={40} className="text-neutral-700 mx-auto mb-2" /><p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Sin Imagen</p></div>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {editingProduct?.imagenes?.map((img, idx) => (
                           <div key={idx} className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 relative group overflow-hidden">
                              <img src={img} className="w-full h-full object-cover rounded-[inherit]" />
                              <button onClick={() => {
                                 const newImgs = editingProduct.imagenes.filter((_, i) => i !== idx);
                                 setEditingProduct({...editingProduct, imagenes: newImgs});
                              }} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                           </div>
                        ))}
                        <label className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all">
                           <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} /><Plus className="text-neutral-600" size={16} />
                        </label>
                     </div>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[7px] font-black text-neutral-500 uppercase mb-1 tracking-widest">Nombre</p>
                          <input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-transparent text-xs font-bold text-white outline-none" />
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[7px] font-black text-neutral-500 uppercase mb-1 tracking-widest">Inversión Costo</p>
                          <input type="number" value={editingProduct.precio_costo || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_costo: parseFloat(e.target.value) || 0})} className="w-full bg-transparent text-xs font-mono font-black text-emerald-500 outline-none" />
                       </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
                          <p className="text-[7px] font-black text-blue-500 uppercase mb-1 tracking-widest">Venta Final</p>
                          <input type="number" value={editingProduct.precio_venta || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_venta: parseFloat(e.target.value) || 0})} className="w-full bg-transparent text-lg font-mono font-black text-white outline-none" />
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                          <p className="text-[7px] font-black text-neutral-500 uppercase mb-1 tracking-widest">Precio Antes</p>
                          <input type="number" value={editingProduct.precio_antes || 0} onChange={(e) => setEditingProduct({...editingProduct, precio_antes: parseFloat(e.target.value) || 0})} className="w-full bg-transparent text-lg font-mono font-black text-neutral-500 outline-none" />
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                          <p className="text-[7px] font-black text-neutral-500 uppercase mb-1 tracking-widest">Logística</p>
                          <select value={editingProduct.tipo_envio || 'Envío Gratuito'} onChange={e => setEditingProduct({...editingProduct, tipo_envio: e.target.value})} className="w-full bg-transparent text-[10px] font-black text-white outline-none uppercase cursor-pointer">
                             <option value="Envío Gratuito">Envío Gratuito</option>
                             <option value="Cobro Adicional">Cobro Adicional</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <textarea value={editingProduct.ficha_tecnica} onChange={e => setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-xs text-white outline-none h-32 resize-none" placeholder="Especificaciones técnicas..."/>
                    </div>
                 </div>
              </div>
              <button onClick={handleSaveProduct} disabled={loading} className="w-full mt-6 py-5 bg-white text-black font-black rounded-[2rem] uppercase text-[10px] tracking-widest hover:bg-neutral-200 transition-all">Sincronizar Cambios</button>
           </div>
        </div>
      )}

      {/* MODAL DE DETALLE MAESTRO */}
      {selectedProduct && (
         <div className="fixed inset-0 z-[120] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[950px] rounded-[24px] md:rounded-[40px] overflow-hidden shadow-2xl relative max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 md:top-6 md:right-6 z-[140] w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-2xl"><X size={20}/></button>
               <div className="w-full md:w-[42%] bg-[#080808] p-4 md:p-10 flex items-center justify-center relative touch-pan-y group/carousel" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                  <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500" key={currentImgIndex}>
                     <img src={allImages[currentImgIndex]} className="max-w-full max-h-[35vh] md:max-h-[55vh] object-cover drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl" />
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/5 text-white rounded-full flex items-center justify-center hidden md:flex"><ChevronLeft size={18}/></button>
                      <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/5 text-white rounded-full flex items-center justify-center hidden md:flex"><ChevronRight size={18}/></button>
                    </>
                  )}
               </div>
               <div className="w-full md:w-[58%] p-4 md:p-8 flex flex-col justify-between bg-[#121212]">
                  <div className="space-y-4">
                     <div>
                        <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">{selectedProduct.categoria}</p>
                        <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tighter uppercase mt-1">{selectedProduct.nombre}</h2>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl">
                        <p className="text-[6px] md:text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Valoración de Activo</p>
                        <div className="flex items-baseline gap-2 md:gap-3">
                           <p className="text-3xl md:text-5xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}</p>
                           <div className="flex flex-col">
                              {selectedProduct.precio_antes > selectedProduct.precio_venta && <p className="text-[9px] md:text-xs text-neutral-600 font-mono line-through opacity-50">{parseFloat(selectedProduct.precio_antes).toLocaleString()}</p>}
                              <span className="text-[9px] md:text-xs font-black text-blue-500">BS.</span>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-xl md:rounded-2xl border border-white/5">
                           <p className="text-[7px] md:text-[8px] font-black text-neutral-500 uppercase mb-1">Garantía</p>
                           <p className="text-[10px] md:text-xs font-black text-white">{renderWarranty(selectedProduct)}</p>
                        </div>
                        <div className={`p-3 rounded-xl md:rounded-2xl border flex items-center gap-2 ${selectedProduct.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                           <Truck size={14} /><p className="text-[7px] md:text-[8px] font-black uppercase">{selectedProduct.tipo_envio || 'Cobro Adicional'}</p>
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 flex gap-3 md:gap-4">
                     <button onClick={() => { setSelectedProduct(null); setEditingProduct(selectedProduct); setIsModalOpen(true); }} className="flex-1 py-4 md:py-6 bg-[#1a1a1a] border border-white/5 text-white rounded-xl md:rounded-[2rem] font-black text-[9px] md:text-xs uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"><Edit3 size={16}/> Editar</button>
                     <button onClick={() => handleConsult(selectedProduct)} className="flex-1 py-4 md:py-6 bg-blue-600 text-white rounded-xl md:rounded-[2rem] font-black text-[9px] md:text-xs uppercase hover:bg-blue-500 transition-all shadow-xl">Auditar vía WhatsApp</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Inventario;
