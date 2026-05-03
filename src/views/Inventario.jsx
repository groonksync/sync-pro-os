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
      <div className="aspect-square bg-[#080808] relative overflow-hidden flex items-center justify-center">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-1000 group-hover:scale-110"
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#050505]">
            <Package size={30} strokeWidth={1} className="text-neutral-800" />
            <span className="text-[6px] font-black text-neutral-800 uppercase tracking-widest">Sin Media</span>
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
             <p className="text-[6px] md:text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-0.5">Inversión Unit.</p>
             <p className="text-lg md:text-3xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[8px] md:text-xs opacity-20 ml-1 font-sans">BS.</span>
             </p>
          </div>
        </div>

        <div className="pt-3 md:pt-6 mt-2 md:mt-4 border-t border-white/5 flex justify-end gap-1.5 md:gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }} className="w-7 h-7 md:w-10 md:h-10 bg-rose-500/10 text-rose-500 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"><Trash2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-7 h-7 md:w-10 md:h-10 bg-white text-black rounded-lg md:rounded-xl flex items-center justify-center hover:bg-amber-500 transition-all shadow-xl"><Edit3 size={14}/></button>
        </div>
      </div>
    </div>
  );
};

const Inventario = () => {
  const [activeSubTab, setActiveSubTab] = useState('productos');
  const [viewState, setViewState] = useState('list');
  const [fullViewImage, setFullViewImage] = useState(null);
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

  // Lógica de Carrusel
  const allImages = selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [];
  
  const nextImg = () => {
    setCurrentImgIndex(prev => (prev + 1) % allImages.length);
  };
  
  const prevImg = () => {
    setCurrentImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextImg();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevImg();
    }
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

  const openNewDistributor = () => {
    setEditingMayorista({ 
      id: Date.now().toString(), nombre: '', contacto: '', 
      region: 'Santa Cruz', limite_credito: 15000, 
      total_invertido: 0, total_pagado: 0 
    });
    setIsMayoristaModalOpen(true);
  };

  const filteredProducts = (productos || []).filter(p => {
    const search = searchTerm.toLowerCase();
    const matches = (p.nombre || '').toLowerCase().includes(search) || (p.codigo || '').toLowerCase().includes(search) || (p.serial || '').toLowerCase().includes(search);
    const cat = filterCategory === 'Todos' || p.categoria === filterCategory;
    return matches && cat;
  });

  const filteredDistributors = (mayoristas || []).filter(m => 
    (m.nombre || '').toLowerCase().includes(searchDistributor.toLowerCase()) ||
    (m.region || '').toLowerCase().includes(searchDistributor.toLowerCase())
  );

  const handleEntrega = async () => {
    if (!newEntrega.producto_id || !activeMayorista) return;
    setLoading(true);
    try {
      await supabase.from('movimientos_mayoristas').insert({
        mayorista_id: activeMayorista.id,
        producto_id: newEntrega.producto_id,
        tipo: 'ENTREGA',
        cantidad: newEntrega.cantidad,
        monto: newEntrega.monto,
        serial_vinculado: newEntrega.serial_vinculado,
        fecha: new Date().toISOString()
      });
      const newTotal = parseFloat(activeMayorista.total_invertido || 0) + parseFloat(newEntrega.monto);
      await supabase.from('mayoristas').update({ total_invertido: newTotal }).eq('id', activeMayorista.id);
      const prod = productos.find(p => p.id === newEntrega.producto_id);
      if (prod) await supabase.from('productos').update({ stock_actual: prod.stock_actual - newEntrega.cantidad }).eq('id', prod.id);
      await fetchData();
      setIsEntregaModalOpen(false);
      setViewState('list');
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handlePago = async () => {
    if (!activeMayorista || !newPago.monto) return;
    setLoading(true);
    try {
      await supabase.from('movimientos_mayoristas').insert({
        mayorista_id: activeMayorista.id,
        tipo: 'PAGO',
        cantidad: 0,
        monto: newPago.monto,
        fecha: new Date().toISOString()
      });
      const newTotalPagado = parseFloat(activeMayorista.total_pagado || 0) + parseFloat(newPago.monto);
      await supabase.from('mayoristas').update({ total_pagado: newTotalPagado }).eq('id', activeMayorista.id);
      await fetchData();
      setIsPagoModalOpen(false);
      setViewState('list');
    } catch (e) { alert(e.message); }
    setLoading(false);
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
      if (type === 'gallery') {
        setEditingProduct(prev => ({ 
          ...prev, 
          imagenes: [...(prev.imagenes || []), ...urls]
        }));
      } else {
        setEditingProduct({ ...editingProduct, imagen: urls[0] });
      }
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setLoading(false);
    }
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
                  <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos por SN, SKU o Nombre..." className="w-full bg-[#121212] border border-white/10 rounded-2xl md:rounded-[2rem] py-4 md:py-6 pl-14 md:pl-18 pr-6 text-xs md:text-sm text-white outline-none focus:border-white/20 transition-all"/>
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
                    key={p.id} 
                    p={p} 
                    onEdit={(prod) => { setEditingProduct(prod); setIsModalOpen(true); }}
                    onDelete={handleDeleteProduct}
                    onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-16 pb-20">
                  <button 
                    onClick={() => setPage(prev => prev + 1)} 
                    disabled={loading}
                    className="px-20 py-6 bg-white/5 border border-white/10 rounded-[3rem] text-[11px] font-black text-white uppercase tracking-[0.5em] hover:bg-white/10 transition-all shadow-xl flex items-center gap-4"
                  >
                    {loading ? 'Syncing...' : 'Show More Assets'} <ChevronRight size={16}/>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'mayoristas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
              {filteredDistributors.map(m => {
                const deuda = parseFloat(m.total_invertido || 0) - parseFloat(m.total_pagado || 0);
                return (
                  <div key={m.id} onClick={() => { setActiveMayorista(m); setViewState('detail'); }} className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 hover:border-blue-500/30 cursor-pointer transition-all shadow-2xl group flex flex-col justify-between h-[380px]">
                     <div className="space-y-8">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-neutral-600 border border-white/5 shadow-inner group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
                          <UserIcon size={36} strokeWidth={1}/>
                       </div>
                       <div>
                          <h4 className="text-3xl font-black text-white tracking-tighter leading-none mb-3 uppercase">{m.nombre}</h4>
                          <div className="flex items-center gap-3">
                             <Globe size={14} className="text-neutral-700"/>
                             <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{m.region}</p>
                          </div>
                       </div>
                     </div>
                     <div className="pt-8 border-t border-white/5">
                        <p className="text-[9px] text-neutral-600 font-black uppercase mb-2 tracking-[0.3em]">Total Balance</p>
                        <p className={`text-4xl font-mono font-black tracking-tighter leading-none ${deuda > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{deuda.toLocaleString()} <span className="text-sm opacity-20 ml-1">Bs.</span></p>
                     </div>
                  </div>
                );
              })}
              <button onClick={openNewDistributor} className="border-2 border-dashed border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-neutral-800 hover:text-white hover:border-white/20 transition-all gap-4 bg-white/[0.01]">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><Plus size={32}/></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em]">Integrate Partner</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="animate-in slide-in-from-right-8 duration-500">
           <div className="flex justify-between items-center mb-12">
              <button onClick={() => setViewState('list')} className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]"><ArrowLeft size={18}/> Volver al Catálogo</button>
              <button onClick={() => setIsReportOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-xl"><Printer size={18}/> Estado de Cuenta</button>
           </div>
           {activeMayorista && (
             <div className="grid grid-cols-12 gap-12">
                <div className="col-span-12 lg:col-span-4 space-y-10">
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-white"><UserIcon size={200}/></div>
                      <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-neutral-400 mb-10 border border-white/10 shadow-inner"><UserIcon size={44} strokeWidth={1}/></div>
                      <h3 className="text-5xl font-black text-white mb-2 tracking-tighter leading-none uppercase">{activeMayorista.nombre}</h3>
                      <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.4em] flex items-center gap-3 mb-12"><MapPin size={18} className="text-blue-500"/> {activeMayorista.region}</p>
                      
                      <div className="p-12 bg-rose-500/5 border border-rose-500/10 rounded-[3.5rem] text-center shadow-inner mb-12">
                        <p className="text-6xl font-mono text-rose-500 font-black tracking-tighter leading-none">{(activeMayorista.total_invertido - activeMayorista.total_pagado).toLocaleString()}</p>
                        <p className="text-[10px] text-rose-500/60 font-black uppercase tracking-[0.5em] mt-6">Outstanding Balance (BS)</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setIsEntregaModalOpen(true)} className="py-8 bg-white text-black rounded-[2.5rem] text-[10px] font-black uppercase shadow-2xl hover:bg-neutral-200 active:scale-95 transition-all flex flex-col items-center justify-center gap-4 border border-white">
                           <Truck size={28}/> Register Delivery
                        </button>
                        <button onClick={() => setIsPagoModalOpen(true)} className="py-8 bg-emerald-500 text-white rounded-[2.5rem] text-[10px] font-black uppercase shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all flex flex-col items-center justify-center gap-4 border border-emerald-400">
                           <Wallet size={28}/> Collect Payment
                        </button>
                      </div>
                      <a href={`https://wa.me/${activeMayorista.contacto}`} target="_blank" rel="noreferrer" className="w-full mt-6 py-7 border border-white/5 bg-white/5 text-white rounded-[2.5rem] text-[11px] font-black uppercase flex items-center justify-center gap-4 hover:bg-white hover:text-black transition-all">
                         <MessageCircle size={24}/> Secure Messenger
                      </a>
                   </div>
                </div>
                <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden flex flex-col">
                   <h3 className="text-3xl font-black text-white mb-16 flex items-center gap-6 uppercase tracking-tighter">
                      <History size={36} className="text-neutral-700"/> Digital Ledger Transactions
                   </h3>
                   <div className="flex-1 space-y-4">
                      {movimientos.filter(m => m.mayorista_id === activeMayorista.id).map(mov => (
                        <div key={mov.id} className="flex justify-between items-center p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all">
                           <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl ${mov.tipo === 'ENTREGA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                 {mov.tipo === 'ENTREGA' ? <ArrowUpRight size={28}/> : <ArrowDownLeft size={28}/>}
                              </div>
                              <div>
                                 <p className="text-xl font-black text-white leading-none mb-3 uppercase tracking-tight">{mov.tipo === 'ENTREGA' ? `Dispatch: ${mov.productos?.nombre}` : 'Financial Settlement'}</p>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{new Date(mov.fecha).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                                    <span className="text-[10px] text-neutral-400 font-mono">ID: {mov.id.slice(0,8)}</span>
                                 </div>
                              </div>
                           </div>
                           <p className={`text-4xl font-mono font-black tracking-tighter ${mov.tipo === 'ENTREGA' ? 'text-rose-500' : 'text-emerald-500'}`}>{parseFloat(mov.monto).toLocaleString()} <span className="text-sm">Bs.</span></p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* MODAL: ESTADO DE CUENTA */}
      {isReportOpen && activeMayorista && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col p-16 text-black overflow-y-auto font-sans">
           <button onClick={() => setIsReportOpen(false)} className="fixed top-8 right-8 p-4 bg-black text-white rounded-full"><X size={32}/></button>
           <div className="max-w-[800px] w-full mx-auto">
              <div className="flex justify-between items-start border-b-4 border-black pb-12 mb-12">
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{activeMayorista.marca || 'S/M'}</p>
                    <h3 className="text-xl font-black text-black leading-tight uppercase line-clamp-1">{activeMayorista.nombre}</h3>
                    <p className="text-[9px] font-bold text-neutral-500 mt-1 uppercase tracking-widest">SKU: {activeMayorista.sku || 'N/A'}</p>
                 </div>
                 <div className="text-right font-mono text-sm font-black uppercase">
                    <p>Reporte Fecha: {new Date().toLocaleDateString()}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-12 mb-16 text-center">
                 <div className="bg-neutral-100 p-8 rounded-[40px] flex flex-col justify-center">
                    <p className="text-xs font-black uppercase text-neutral-400 mb-2">Cliente</p>
                    <p className="text-3xl font-black">{activeMayorista.nombre}</p>
                 </div>
                 <div className="bg-black text-white p-8 rounded-[40px]">
                    <p className="text-xs font-black uppercase mb-2 text-neutral-400">Total Adeudado</p>
                    <p className="text-5xl font-mono font-black">{(activeMayorista.total_invertido - activeMayorista.total_pagado).toLocaleString()} <span className="text-xl">Bs.</span></p>
                 </div>
              </div>
              <table className="w-full">
                 <thead>
                    <tr className="border-b-2 border-black text-left text-xs font-black uppercase">
                       <th className="py-4">Detalle</th>
                       <th className="py-4">S/N</th>
                       <th className="py-4 text-right">Importe</th>
                    </tr>
                 </thead>
                 <tbody>
                    {movimientos.filter(m => m.mayorista_id === activeMayorista.id && m.tipo === 'ENTREGA').map(ent => (
                       <tr key={ent.id} className="border-b border-neutral-100 text-sm">
                          <td className="py-6 font-bold">{ent.productos?.nombre}</td>
                          <td className="py-6 font-mono text-neutral-500">{ent.serial_vinculado || '---'}</td>
                          <td className="py-6 text-right font-mono font-bold">{parseFloat(ent.monto).toLocaleString()} Bs.</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL PRODUCTO PRO (Edición) */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[1000px] rounded-[48px] p-10 shadow-2xl overflow-y-auto max-h-[95vh] mac-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase underline decoration-white/10 underline-offset-8">Ficha Logística <span className="text-neutral-600">Sovereign</span></h3>
                 <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="text-neutral-700 hover:text-white p-3 bg-white/5 rounded-full transition-colors"><X size={32}/></button>
              </div>

              <div className="grid grid-cols-12 gap-10">
                 <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                       {editingProduct?.imagenes?.length > 0 ? (
                          <img src={editingProduct.imagenes[0]} className="w-full h-full object-contain p-4" alt="Principal"/>
                       ) : (
                          <div className="text-center">
                             <ImageIcon size={48} className="text-neutral-700 mx-auto mb-2" />
                             <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Sin Imagen</p>
                          </div>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {editingProduct?.imagenes?.map((img, idx) => (
                           <div key={idx} className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 relative group overflow-hidden">
                              <img src={img} className="w-full h-full object-cover" />
                              <button onClick={() => {
                                 const newImgs = editingProduct.imagenes.filter((_, i) => i !== idx);
                                 setEditingProduct({...editingProduct, imagenes: newImgs});
                              }} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                           </div>
                        ))}
                        <label className="w-24 h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all">
                           <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} />
                           <Plus className="text-neutral-600" />
                        </label>
                     </div>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" value={editingProduct.nombre} onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-white outline-none" placeholder="Nombre..."/>
                       <input type="text" value={editingProduct.marca} onChange={e => setEditingProduct({...editingProduct, marca: e.target.value})} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-white outline-none" placeholder="Marca..."/>
                    </div>
                    <textarea value={editingProduct.ficha_tecnica} onChange={e => setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 text-white outline-none h-44" placeholder="Ficha técnica..."/>
                 </div>
              </div>
              <button onClick={handleSaveProduct} className="w-full mt-12 py-8 bg-white text-black font-black rounded-[40px] uppercase">Guardar Cambios</button>
           </div>
        </div>
      )}

      {/* MODAL DE DETALLE MAESTRO (Nexus Viewer Internal con Swipe) */}
      {selectedProduct && (
         <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[1200px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col md:flex-row">
               <button 
                 onClick={() => setSelectedProduct(null)}
                 className="absolute top-4 right-4 md:top-8 md:right-8 z-[130] w-10 h-10 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-2xl"
               >
                  <X size={24}/>
               </button>

               <div 
                 className="w-full md:w-1/2 bg-[#080808] p-6 md:p-16 flex items-center justify-center relative touch-pan-y group/carousel"
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
               >
                  <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500" key={currentImgIndex}>
                     <img src={allImages[currentImgIndex]} className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                  </div>

                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 opacity-0 group-hover/carousel:opacity-100 hidden md:flex">
                        <ChevronLeft size={24}/>
                      </button>
                      <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 opacity-0 group-hover/carousel:opacity-100 hidden md:flex">
                        <ChevronRight size={24}/>
                      </button>
                      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                        {allImages.map((_, idx) => (
                          <div key={idx} onClick={() => setCurrentImgIndex(idx)} className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentImgIndex ? 'bg-blue-500 w-6' : 'bg-white/20'}`} />
                        ))}
                      </div>
                    </>
                  )}
               </div>

               <div className="w-full md:w-1/2 p-6 md:p-16 overflow-y-auto mac-scrollbar bg-[#121212] flex flex-col">
                  <div className="flex-1 space-y-8 md:space-y-12">
                     <div className="space-y-2 md:space-y-4">
                        <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">Sovereign ID: {selectedProduct.codigo || 'N/A'}</p>
                        <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase">{selectedProduct.nombre}</h2>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 p-6 md:p-10 rounded-[2rem] shadow-inner">
                        <p className="text-[7px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 md:mb-4">Valor de Mercado</p>
                        <p className="text-4xl md:text-8xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                           {parseFloat(selectedProduct.precio_venta || 0).toLocaleString()} 
                           <span className="text-lg md:text-3xl opacity-20 ml-3 md:ml-6 font-sans">BS.</span>
                        </p>
                     </div>
                     <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:pb-4">
                           <FileText size={16} className="text-blue-500"/>
                           <p className="text-[8px] md:text-[11px] font-black text-white uppercase tracking-widest">Ficha Técnica Logística</p>
                        </div>
                        <div className="text-neutral-400 text-xs md:text-lg leading-relaxed italic whitespace-pre-wrap">
                           {selectedProduct.ficha_tecnica || 'No hay especificaciones registradas.'}
                        </div>
                     </div>
                  </div>
                  <div className="mt-12 flex gap-4">
                     <button onClick={() => { setSelectedProduct(null); setEditingProduct(selectedProduct); setIsModalOpen(true); }} className="flex-1 py-4 md:py-8 bg-white/5 border border-white/10 text-white rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"><Edit3 size={18}/> Editar</button>
                     <button onClick={() => handleConsult(selectedProduct)} className="flex-1 py-4 md:py-8 bg-blue-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl">Consultar</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* VISOR DE IMAGEN FULL SCREEN */}
      {fullViewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-10 right-10 w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10"><X size={32}/></button>
           <img src={fullViewImage} className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)]" />
        </div>
      )}
    </div>
  );
};

export default Inventario;
