import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, Users, Plus, Search, Filter, Share2, ExternalLink,
  ChevronRight, ArrowLeft, Save, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Box, DollarSign, 
  Percent, ShoppingCart, Truck, X, Image as ImageIcon,
  FileText, Smartphone, MessageCircle, MoreVertical, 
  History, ArrowUpRight, ArrowDownLeft, User as UserIcon,
  Cpu, Info, Hash, MapPin, Tag, BarChart3, Globe,
  ShieldAlert, Trophy, Wallet, Printer, ClipboardList, Scale, Box as BoxIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ProductCard = ({ p, onEdit, onDelete, onViewImage }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const allImages = [p.imagen, ...(p.imagenes || [])].filter(Boolean);

  const nextImg = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden hover:border-white/20 transition-all flex flex-col group relative shadow-2xl h-full">
      <div className="aspect-square bg-[#050505] relative overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => onViewImage(allImages[imgIndex])}>
        {allImages.length > 0 ? (
          <img 
            src={allImages[imgIndex]} 
            className="max-w-[85%] max-h-[85%] object-contain transition-transform duration-1000 group-hover:scale-110"
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-neutral-900 to-black">
            <Package size={50} strokeWidth={1} className="text-neutral-800" />
            <span className="text-[8px] font-black text-neutral-800 uppercase tracking-widest">No Media Available</span>
          </div>
        )}

        {/* CONTROLES DEL SLIDER */}
        {allImages.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={prevImg} className="w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10">
                <ChevronRight className="rotate-180" size={18}/>
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={nextImg} className="w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10">
                <ChevronRight size={18}/>
              </button>
            </div>
          </>
        )}
        
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
          <span className="text-[8px] text-white font-black uppercase tracking-[0.2em] bg-blue-600/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl">{p.categoria || 'Standard'}</span>
          {p.stock_actual <= (p.stock_minimo || 5) && (
            <span className="text-[8px] text-white font-black uppercase tracking-[0.2em] bg-rose-500/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl animate-pulse">Low Stock</span>
          )}
        </div>
        
        <div className="absolute top-6 right-6 z-10">
          <p className="text-[10px] font-mono font-black px-4 py-2 rounded-xl backdrop-blur-xl border border-white/10 bg-black/60 text-white shadow-2xl">{p.stock_actual} UNITS</p>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-white line-clamp-1 leading-tight tracking-tighter uppercase">{p.nombre}</h3>
             <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">{p.marca || 'Sovereign Core'}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {p.sku && <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-mono text-neutral-500 border border-white/5 uppercase tracking-widest font-black">SKU: {p.sku}</div>}
            {p.entrega_habilitada && <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-[8px] font-mono text-emerald-500 border border-emerald-500/10 uppercase tracking-widest font-black">READY TO SHIP</div>}
          </div>
        </div>

        <div className="pt-8 mt-4 border-t border-white/5 flex justify-between items-end">
          <div>
            <p className="text-[8px] text-neutral-600 font-black uppercase mb-1 tracking-[0.3em]">Executive Price</p>
            <p className="text-3xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(p.precio_venta || 0).toLocaleString()} <span className="text-xs opacity-20 ml-1">Bs.</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(p.id, p.imagen); }} className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"><Trash2 size={20}/></button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all shadow-xl"><Edit3 size={20}/></button>
          </div>
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

  const handleDeleteProduct = async (id, imageUrl) => {
     if (!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
     setLoading(true);
     try {
        // Borrar de la tabla
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        
        // Borrar imagen del storage si existe
        if (imageUrl) {
           const path = imageUrl.split('/').pop();
           await supabase.storage.from('productos').remove([path]);
        }
        
        await fetchData();
     } catch(e) { alert(e.message); }
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

  const handleShareCatalog = () => {
    const url = `${window.location.origin}/catalogo`;
    navigator.clipboard.writeText(url);
    alert('🔗 ¡Link del Catálogo Sync Pro copiado al portapapeles!');
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

  return (
    <div className="flex flex-col h-full max-w-[1400px] w-full animate-in fade-in duration-500">
      {viewState === 'list' ? (
        <>
          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Inventario <span className="text-blue-500">Pro</span></h2>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.5em] flex items-center gap-2"><Layout size={14}/> Sovereign Global Asset Monitor</p>
                <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.5em]">{productos.length} Assets Registered</p>
              </div>
            </div>
            <div className="flex bg-[#0a0a0a] border border-white/5 p-1.5 rounded-[2rem] shadow-2xl">
              <button onClick={() => setActiveSubTab('productos')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'productos' ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}>MASTER CATALOG</button>
              <button onClick={() => setActiveSubTab('mayoristas')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'mayoristas' ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}>DISTRIBUTORS</button>
            </div>
          </header>

          {activeSubTab === 'productos' && (
            <div className="space-y-12">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative flex-1 group">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-blue-500 transition-colors" size={20}/>
                  <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identify assets by SN, SKU or Name..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-[2rem] py-6 pl-18 pr-8 text-sm text-white outline-none focus:border-white/20 shadow-2xl font-medium transition-all"/>
                </div>
                 <div className="flex gap-4">
                    <button onClick={handleShareCatalog} className="px-10 py-6 bg-blue-600/10 text-blue-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 flex items-center gap-3">
                       <Share2 size={18}/>
                       Public Link
                    </button>
                    <button onClick={openNewProduct} className="px-12 py-6 bg-white text-black rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl flex items-center gap-3 active:scale-95">
                       <Plus size={20} strokeWidth={3}/>
                       Register Intake
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    p={p} 
                    onEdit={(prod) => { setEditingProduct(prod); setIsModalOpen(true); }}
                    onDelete={handleDeleteProduct}
                    onViewImage={setFullViewImage}
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

      {/* MODAL PRODUCTO PRO */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[1000px] rounded-[48px] p-10 shadow-2xl overflow-y-auto max-h-[95vh] mac-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase underline decoration-white/10 underline-offset-8">Ficha Logística <span className="text-neutral-600">Sovereign</span></h3>
                 <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="text-neutral-700 hover:text-white p-3 bg-white/5 rounded-full transition-colors"><X size={32}/></button>
              </div>

              <div className="grid grid-cols-12 gap-10">
                 <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* VISOR PRINCIPAL */}
                    <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                       {editingProduct?.imagenes?.length > 0 ? (
                          <img src={editingProduct.imagenes[0]} className="w-full h-full object-contain p-4" alt="Principal"/>
                       ) : (
                          <div className="text-center">
                             <ImageIcon size={48} className="text-neutral-700 mx-auto mb-2" />
                             <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Sin Imagen</p>
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">Catálogo Preview</p>
                       </div>
                    </div>
                    <p className="text-[9px] text-neutral-500 font-medium italic text-center">La primera imagen de la galería será la portada oficial.</p>

                    {/* GALERÍA DE FOTOS */}
                    <div className="space-y-4">
                       <label className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest ml-4">Galería de Imágenes</label>
                       <div className="flex flex-wrap gap-4">
                           {editingProduct?.imagenes?.map((img, idx) => (
                              <div key={idx} className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 relative group overflow-hidden">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <div className="flex gap-2">
                                       {idx > 0 && (
                                          <button onClick={() => {
                                             const newImgs = [...editingProduct.imagenes];
                                             [newImgs[idx], newImgs[idx-1]] = [newImgs[idx-1], newImgs[idx]];
                                             setEditingProduct({...editingProduct, imagenes: newImgs});
                                          }} className="w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-500"><ArrowLeft size={12} /></button>
                                       )}
                                       {idx < editingProduct.imagenes.length - 1 && (
                                          <button onClick={() => {
                                             const newImgs = [...editingProduct.imagenes];
                                             [newImgs[idx], newImgs[idx+1]] = [newImgs[idx+1], newImgs[idx]];
                                             setEditingProduct({...editingProduct, imagenes: newImgs});
                                          }} className="w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-500"><ChevronRight size={12} /></button>
                                       )}
                                    </div>
                                    <button onClick={() => {
                                       const newImgs = editingProduct.imagenes.filter((_, i) => i !== idx);
                                       setEditingProduct({...editingProduct, imagenes: newImgs});
                                    }} className="w-6 h-6 bg-red-600 text-white rounded-md flex items-center justify-center hover:bg-red-500"><Trash2 size={12} /></button>
                                 </div>
                                 {idx === 0 && <div className="absolute top-1 left-1 px-1 py-0.5 bg-blue-600 text-[6px] font-black text-white uppercase rounded-sm">Portada</div>}
                              </div>
                           ))}
                           <label className="w-24 h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all">
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} />
                              <Plus className="text-neutral-600" />
                           </label>
                        </div>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 text-center text-white">
                       <label className="text-[9px] font-bold text-neutral-600 uppercase mb-2 block tracking-widest">Stock Disponible</label>
                       <input type="number" value={editingProduct.stock_actual} onChange={e => setEditingProduct({...editingProduct, stock_actual: parseInt(e.target.value) || 0})} className="bg-transparent text-5xl font-mono w-full outline-none font-black text-center tracking-tighter" />
                    </div>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="space-y-4">
                       <label className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest ml-4">Especificaciones Clave</label>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Nombre del Producto</p>
                             <input type="text" value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-transparent text-sm font-bold text-white outline-none" placeholder="Ej: iPhone 15 Pro" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Marca</p>
                             <input type="text" value={editingProduct.marca || ''} onChange={(e) => setEditingProduct({...editingProduct, marca: e.target.value})} className="w-full bg-transparent text-sm font-bold text-white outline-none" placeholder="Ej: Apple" />
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20">
                       <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Logística de Entrega</p>
                          <p className="text-[9px] text-neutral-500 font-medium">Habilitar si el equipo está listo para envío inmediato</p>
                       </div>
                       <button 
                         onClick={() => setEditingProduct({...editingProduct, entrega_habilitada: !editingProduct.entrega_habilitada})}
                         className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${editingProduct.entrega_habilitada ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                       >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${editingProduct.entrega_habilitada ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">Categoría</label>
                          <select value={editingProduct.categoria} onChange={e => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-white font-bold outline-none">
                             <option value="Computadoras">Computadoras</option>
                             <option value="Celulares">Celulares</option>
                             <option value="Accesorios">Accesorios</option>
                             <option value="Servicios">Servicios</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">Código de Barras</label>
                          <input type="text" value={editingProduct.codigo} onChange={e => setEditingProduct({...editingProduct, codigo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-white font-mono uppercase text-sm outline-none" placeholder="COD-000"/>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">SKU Único</label>
                          <input type="text" value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-white font-mono uppercase text-sm outline-none" placeholder="SKU-PRO-000"/>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">Garantía (Ej: 180 días)</label>
                          <input type="text" value={editingProduct.garantia} onChange={e => setEditingProduct({...editingProduct, garantia: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-white text-sm outline-none" placeholder="Ej: 1 año / 180 días"/>
                       </div>
                    </div>


                    <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-8 rounded-[40px] border border-white/5">
                       <div className="space-y-2 border-r border-white/10 pr-6">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Scale size={14}/> Peso (Kg)</label>
                          <input type="text" value={editingProduct.peso} onChange={e => setEditingProduct({...editingProduct, peso: e.target.value})} className="w-full bg-transparent text-white font-mono text-xl outline-none font-bold" placeholder="0.0 Kg"/>
                       </div>
                       <div className="space-y-2 pl-6">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2"><BoxIcon size={14}/> Volumen (m³)</label>
                          <input type="text" value={editingProduct.volumen} onChange={e => setEditingProduct({...editingProduct, volumen: e.target.value})} className="w-full bg-transparent text-white font-mono text-xl outline-none font-bold" placeholder="0.000 m³"/>
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">Descripción & Ficha Técnica</label>
                       <textarea value={editingProduct.ficha_tecnica} onChange={e => setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 text-white outline-none h-44 resize-none italic leading-relaxed text-sm" placeholder="Detalla las especificaciones técnicas aquí..."/>
                    </div>
                 </div>
              </div>
              <button onClick={handleSaveProduct} disabled={loading} className="w-full mt-12 py-8 bg-white text-black font-black rounded-[40px] uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-4">
                {loading ? 'Procesando...' : 'Guardar en Catálogo'} <Plus size={20}/>
              </button>
           </div>
        </div>
      )}

      {/* MODALES EXTRAS (MAYORISTA, ENTREGA, COBRO) */}
      {isMayoristaModalOpen && editingMayorista && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 text-white">
           <div className="bg-[#0a0a0a] border border-white/20 w-full max-w-[500px] rounded-[32px] p-10 shadow-2xl">
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-8">Nuevo Socio</h3>
              <div className="space-y-8">
                 <input type="text" value={editingMayorista.nombre} onChange={e => setEditingMayorista({...editingMayorista, nombre: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-7 text-white font-black outline-none" placeholder="Nombre..."/>
                 <input type="text" value={editingMayorista.contacto} onChange={e => setEditingMayorista({...editingMayorista, contacto: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-7 text-white font-mono" placeholder="WhatsApp..."/>
                 <select value={editingMayorista.region} onChange={e=>setEditingMayorista({...editingMayorista, region: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-7 text-white font-bold outline-none">
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="La Paz">La Paz</option>
                    <option value="Cochabamba">Cochabamba</option>
                 </select>
              </div>
              <button onClick={async () => {
                setLoading(true);
                try {
                   await supabase.from('mayoristas').upsert(editingMayorista);
                   await fetchData();
                   setIsMayoristaModalOpen(false);
                } catch(e) { alert(e.message); }
                setLoading(false);
              }} className="w-full mt-16 py-7 bg-white text-black font-black rounded-[36px] uppercase shadow-2xl">Confirmar</button>
           </div>
        </div>
      )}

      {isEntregaModalOpen && activeMayorista && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/20 w-full max-w-[600px] rounded-[56px] p-16 shadow-2xl text-white">
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-10">Entrega</h3>
              <div className="space-y-10">
                 <select value={newEntrega.producto_id} onChange={e => {
                    const p = productos.find(x => x.id === e.target.value);
                    setNewEntrega({...newEntrega, producto_id: e.target.value, monto: (p?.precio_venta || 0) * newEntrega.cantidad});
                 }} className="w-full bg-white/10 border border-white/10 rounded-[28px] p-7 text-white font-bold outline-none">
                    <option value="">Producto...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                 </select>
                 <input type="text" value={newEntrega.serial_vinculado} onChange={e => setNewEntrega({...newEntrega, serial_vinculado: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-7 text-white font-mono text-center" placeholder="S/N..."/>
                 <div className="grid grid-cols-2 gap-8">
                    <input type="number" value={newEntrega.cantidad} onChange={e => {
                      const c = parseInt(e.target.value) || 0;
                      const p = productos.find(x => x.id === newEntrega.producto_id);
                      setNewEntrega({...newEntrega, cantidad: c, monto: (p?.precio_venta || 0) * c});
                    }} className="bg-white/5 border border-white/10 rounded-[28px] p-7 text-white" placeholder="Cant."/>
                    <input type="number" value={newEntrega.monto} onChange={e => setNewEntrega({...newEntrega, monto: parseFloat(e.target.value) || 0})} className="bg-white/5 border border-white/10 rounded-[28px] p-7 text-white" placeholder="Total Bs."/>
                 </div>
              </div>
              <button onClick={handleEntrega} className="w-full mt-16 py-7 bg-white text-black font-black rounded-[36px] uppercase shadow-2xl">Vincular</button>
           </div>
        </div>
      )}

      {isPagoModalOpen && activeMayorista && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/20 w-full max-w-[500px] rounded-[56px] p-16 shadow-2xl">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-10 text-center">Cobrar</h3>
              <input type="number" value={newPago.monto} onChange={e => setNewPago({monto: parseFloat(e.target.value) || 0})} className="w-full bg-white/5 border border-emerald-500/20 p-8 rounded-[32px] text-white font-mono text-5xl outline-none font-black text-center" placeholder="0.00" />
              <button onClick={handlePago} className="w-full mt-16 py-7 bg-emerald-500 text-white font-black rounded-[40px] uppercase shadow-2xl">Confirmar</button>
           </div>
        </div>
      )}

      {/* VISOR DE IMAGEN FULL SCREEN */}
      {fullViewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-10 right-10 w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10">
              <X size={32}/>
           </button>
           <img src={fullViewImage} className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)]" />
           <p className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.5em]">Haz clic en cualquier lugar para cerrar</p>
        </div>
      )}
    </div>
  );
};

export default Inventario;
