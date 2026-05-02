import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, Users, Plus, Search, Filter, 
  ChevronRight, ArrowLeft, Save, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Box, DollarSign, 
  Percent, ShoppingCart, Truck, X, Image as ImageIcon,
  FileText, Smartphone, MessageCircle, MoreVertical, 
  History, ArrowUpRight, ArrowDownLeft, User as UserIcon,
  Cpu, Info, Hash, MapPin, Tag, BarChart3, Globe,
  ShieldAlert, Trophy, Wallet, Printer, ClipboardList, Scale, Box as BoxIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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

  const handleImageUpload = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from('productos').getPublicUrl(fileName).data.publicUrl;

      if (isGallery) {
         const currentImages = editingProduct.imagenes || [];
         setEditingProduct({ ...editingProduct, imagenes: [...currentImages, publicUrl], imagen: publicUrl });
      } else {
         setEditingProduct({ ...editingProduct, imagen: publicUrl });
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

  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      await supabase.from('productos').upsert(editingProduct);
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
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase underline decoration-white/10 underline-offset-8">Inventario <span className="text-purple-500">Pro Max</span></h2>
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.4em] mt-2 flex items-center gap-2"><Globe size={14}/> Centro Logístico Sovereign OS</p>
            </div>
            <div className="flex bg-neutral-900/50 p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setActiveSubTab('productos')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'productos' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>CATÁLOGO</button>
              <button onClick={() => setActiveSubTab('mayoristas')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeSubTab === 'mayoristas' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>DISTRIBUIDORES</button>
            </div>
          </header>

          {activeSubTab === 'productos' && (
            <div className="space-y-10">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={20}/>
                  <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar por Nombre, Serial o SKU..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-4 pl-16 pr-8 text-sm text-white outline-none focus:border-white/20 shadow-2xl"/>
                </div>
                <button onClick={openNewProduct} className="px-10 py-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl">Nuevo Ingreso</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-0 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden">
                    <div className="aspect-square bg-neutral-900 flex items-center justify-center overflow-hidden border-b border-white/5 relative">
                       {p.imagen ? (
                          <img src={p.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"/>
                       ) : (
                          <div className="flex flex-col items-center gap-3 text-neutral-800">
                             <ImageIcon size={60}/>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sin Imagen</span>
                          </div>
                       )}
                       <div className="absolute top-4 right-4 z-10">
                          <p className={`text-xl font-mono font-black px-4 py-2 rounded-2xl backdrop-blur-xl border border-white/10 ${p.stock_actual <= (p.stock_minimo || 5) ? 'bg-rose-500/80 text-white' : 'bg-black/60 text-white'}`}>{p.stock_actual} U.</p>
                       </div>
                       <div className="absolute top-4 left-4 z-10">
                          <span className="text-[9px] text-white font-black uppercase tracking-widest bg-blue-600/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl">{p.categoria}</span>
                       </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                       <div className="flex-1 space-y-3 mb-6">
                          <h3 className="text-xl font-bold text-white line-clamp-1 leading-tight tracking-tight">{p.nombre}</h3>
                          <div className="flex flex-wrap gap-2">
                             {p.sku && <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-mono text-emerald-500 border border-emerald-500/10 uppercase tracking-widest font-black">SKU: {p.sku}</div>}
                             {p.codigo && <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-mono text-neutral-500 border border-white/5 uppercase tracking-widest">COD: {p.codigo}</div>}
                             {p.garantia && <div className="px-3 py-1 bg-blue-500/10 rounded-lg text-[9px] font-mono text-blue-400 border border-blue-500/10 uppercase tracking-widest">Garantía: {p.garantia}</div>}
                          </div>
                          <p className="text-[11px] text-neutral-500 line-clamp-2 font-medium italic leading-relaxed">{p.ficha_tecnica || 'Sin ficha técnica detallada'}</p>
                          <div className="flex gap-4 mt-2">
                             {p.peso && <p className="text-[9px] text-neutral-600 font-bold flex items-center gap-1"><Scale size={12}/> {p.peso} Kg</p>}
                             {p.volumen && <p className="text-[9px] text-neutral-600 font-bold flex items-center gap-1"><BoxIcon size={12}/> {p.volumen} m³</p>}
                          </div>
                       </div>

                       <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                          <div>
                             <p className="text-[9px] text-neutral-600 font-black uppercase mb-1">Precio Mercado</p>
                             <p className="text-3xl font-mono text-white font-black tracking-tighter">{parseFloat(p.precio_venta || 0).toLocaleString()} <span className="text-sm opacity-30">Bs.</span></p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleDeleteProduct(p.id, p.imagen)} className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg border border-rose-500/20"><Trash2 size={20}/></button>
                              <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-neutral-200 transition-all shadow-xl shadow-white/5"><Edit3 size={20}/></button>
                           </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button 
                    onClick={() => setPage(prev => prev + 1)} 
                    disabled={loading}
                    className="px-16 py-5 bg-white/5 border border-white/10 rounded-[32px] text-[11px] font-black text-white uppercase tracking-[0.4em] hover:bg-white/10 transition-all"
                  >
                    {loading ? 'Cargando Catálogo...' : 'Ver más productos'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'mayoristas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDistributors.map(m => {
                const deuda = parseFloat(m.total_invertido || 0) - parseFloat(m.total_pagado || 0);
                return (
                  <div key={m.id} onClick={() => { setActiveMayorista(m); setViewState('detail'); }} className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-8 hover:border-white/15 cursor-pointer transition-all shadow-xl group">
                     <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-neutral-400 mb-6 border border-white/5"><UserIcon size={28}/></div>
                     <h4 className="text-2xl font-black text-white mb-2 tracking-tight">{m.nombre}</h4>
                     <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest flex items-center gap-2 mb-8"><Globe size={14}/> {m.region}</p>
                     <div className="mt-auto pt-8 border-t border-white/5">
                        <p className="text-[9px] text-neutral-600 font-black uppercase mb-1">Deuda Vigente</p>
                        <p className="text-3xl font-mono text-rose-500 font-black">{deuda.toLocaleString()} Bs.</p>
                     </div>
                  </div>
                );
              })}
              <button onClick={openNewDistributor} className="border-2 border-dashed border-white/10 rounded-[48px] p-10 flex flex-col items-center justify-center text-neutral-600 hover:text-white hover:border-white/20 transition-all"><Plus size={40}/><span className="text-[10px] font-black uppercase mt-4 tracking-widest">Nuevo Distribuidor</span></button>
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
             <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-4 space-y-8">
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-[64px] p-12 shadow-2xl relative overflow-hidden">
                      <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center text-neutral-400 mb-8 border border-white/5"><UserIcon size={32}/></div>
                      <h3 className="text-4xl font-black text-white mb-2 tracking-tighter leading-none">{activeMayorista.nombre}</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-10"><MapPin size={16}/> {activeMayorista.region}</p>
                      <div className="p-10 bg-rose-500/5 border border-rose-500/10 rounded-[48px] text-center shadow-inner mb-8">
                        <p className="text-5xl font-mono text-rose-500 font-black tracking-tighter">{(activeMayorista.total_invertido - activeMayorista.total_pagado).toLocaleString()}</p>
                        <p className="text-[10px] text-rose-500/60 font-black uppercase tracking-[0.4em] mt-4">Saldo Pendiente</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setIsEntregaModalOpen(true)} className="py-7 bg-white text-black rounded-[32px] text-[10px] font-black uppercase shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-3"><Truck size={24}/></button>
                        <button onClick={() => setIsPagoModalOpen(true)} className="py-7 bg-emerald-500 text-white rounded-[32px] text-[10px] font-black uppercase shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-3"><Wallet size={24}/></button>
                      </div>
                      <a href={`https://wa.me/${activeMayorista.contacto}`} target="_blank" rel="noreferrer" className="w-full mt-4 py-6 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 rounded-[32px] text-[10px] font-black uppercase flex items-center justify-center gap-4"><MessageCircle size={24}/> WhatsApp</a>
                   </div>
                </div>
                <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-[64px] p-12 shadow-2xl relative overflow-hidden">
                   <h3 className="text-2xl font-bold text-white mb-12 flex items-center gap-4"><History size={32} className="text-neutral-500"/> Registro de Movimientos</h3>
                   <div className="space-y-4">
                      {movimientos.filter(m => m.mayorista_id === activeMayorista.id).map(mov => (
                        <div key={mov.id} className="flex justify-between items-center p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mov.tipo === 'ENTREGA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                 {mov.tipo === 'ENTREGA' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                              </div>
                              <div>
                                 <p className="text-lg font-bold text-white leading-none mb-2">{mov.tipo === 'ENTREGA' ? `Entrega: ${mov.productos?.nombre}` : 'Pago de Mercancía'}</p>
                                 <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest">{new Date(mov.fecha).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <p className={`text-3xl font-mono font-black ${mov.tipo === 'ENTREGA' ? 'text-rose-500' : 'text-emerald-500'}`}>{parseFloat(mov.monto).toLocaleString()} Bs.</p>
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
                 <div>
                   <h1 className="text-6xl font-black uppercase tracking-tighter">Estado de Cuenta</h1>
                   <p className="text-xl font-bold text-neutral-500 mt-2">Sovereign OS Logistics System</p>
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
                    <div className="aspect-square bg-white/5 border border-white/10 rounded-[48px] overflow-hidden flex items-center justify-center group relative cursor-pointer hover:border-white/20 transition-all shadow-2xl">
                       {editingProduct.imagen ? (
                          <img src={editingProduct.imagen} className="w-full h-full object-cover"/>
                       ) : (
                          <div className="flex flex-col items-center gap-4 text-neutral-600">
                             <ImageIcon size={60}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Foto Principal</span>
                          </div>
                       )}
                       <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="text-white" size={40}/>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)}/>
                       </label>
                    </div>

                    {/* GALERÍA DE FOTOS */}
                    <div className="space-y-4">
                       <label className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest ml-4">Galería / Más Fotos</label>
                       <div className="grid grid-cols-3 gap-3">
                          {editingProduct.imagenes?.map((img, idx) => (
                             <div key={idx} className="aspect-square rounded-2xl border border-white/5 overflow-hidden relative group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button onClick={() => {
                                   const news = editingProduct.imagenes.filter((_, i) => i !== idx);
                                   setEditingProduct({...editingProduct, imagenes: news});
                                }} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                             </div>
                          ))}
                          <label className="aspect-square rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-neutral-600 hover:border-white/30 cursor-pointer transition-all">
                             <Plus size={20}/>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)}/>
                          </label>
                       </div>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 text-center text-white">
                       <label className="text-[9px] font-bold text-neutral-600 uppercase mb-2 block tracking-widest">Stock Disponible</label>
                       <input type="number" value={editingProduct.stock_actual} onChange={e => setEditingProduct({...editingProduct, stock_actual: parseInt(e.target.value) || 0})} className="bg-transparent text-5xl font-mono w-full outline-none font-black text-center tracking-tighter" />
                    </div>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-6">Nombre del Producto</label>
                       <input type="text" value={editingProduct.nombre} onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-7 text-white font-black outline-none text-2xl shadow-inner" placeholder="Ej: MacBook Pro M3 16..."/>
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

                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-emerald-500/5 p-8 rounded-[48px] border border-emerald-500/10">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Precio Venta (Bs.)</label>
                          <input type="number" value={editingProduct.precio_venta} onChange={e => setEditingProduct({...editingProduct, precio_venta: parseFloat(e.target.value) || 0})} className="w-full bg-transparent p-0 text-white font-mono text-4xl outline-none font-black tracking-tighter" />
                       </div>
                       <div className="bg-rose-500/5 p-8 rounded-[48px] border border-rose-500/10 opacity-60">
                          <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 block">Costo Interno</label>
                          <input type="number" value={editingProduct.precio_costo} onChange={e => setEditingProduct({...editingProduct, precio_costo: parseFloat(e.target.value) || 0})} className="w-full bg-transparent p-0 text-white font-mono text-2xl outline-none font-bold" />
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
    </div>
  );
};

export default Inventario;
