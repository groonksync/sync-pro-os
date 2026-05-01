import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, Users, Plus, Search, Filter, 
  ChevronRight, ArrowLeft, Save, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Box, DollarSign, 
  Percent, ShoppingCart, Truck, X, Image as ImageIcon,
  FileText, Smartphone, MessageCircle, MoreVertical, 
  History, ArrowUpRight, ArrowDownLeft, User as UserIcon,
  Cpu, Info, Hash, MapPin, Tag, BarChart3, Globe,
  ShieldAlert, Trophy, Wallet, Printer, ClipboardList
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: prodData } = await supabase.from('productos').select('*');
      setProductos(Array.isArray(prodData) ? prodData : []);
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

  const openNewProduct = () => {
    setEditingProduct({ 
      id: Date.now().toString(), nombre: '', categoria: 'Computadoras', 
      precio_costo: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 5, 
      stock_vendido: 0, ficha_tecnica: '', estado: 'Stock', imagen: '', 
      codigo: '', ubicacion: '', serial: '' 
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
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase underline decoration-white/10 underline-offset-8">Inventario <span className="text-neutral-500">Pro</span></h2>
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
                  <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-6 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden">
                    <div className="flex gap-6 mb-6">
                       <div className="w-28 h-28 bg-neutral-900 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                          {p.imagen ? <img src={p.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"/> : <ImageIcon size={40} className="text-neutral-800"/>}
                       </div>
                       <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                             <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">{p.categoria}</span>
                             <p className={`text-xl font-mono font-black ${p.stock_actual <= (p.stock_minimo || 5) ? 'text-rose-500' : 'text-white'}`}>{p.stock_actual} U.</p>
                          </div>
                          <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight">{p.nombre}</h3>
                          <div className="flex flex-wrap gap-2">
                             {p.codigo && <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-mono text-neutral-400 border border-white/5 uppercase tracking-widest">SKU: {p.codigo}</div>}
                             {p.serial && <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-mono text-neutral-400 border border-white/5 uppercase tracking-widest">S/N: {p.serial}</div>}
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><MapPin size={10}/> Ubicación</p>
                          <p className="text-xs text-white font-bold">{p.ubicacion || '---'}</p>
                       </div>
                       <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Cpu size={10}/> Ficha Técnica</p>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 italic">{p.ficha_tecnica || 'Sin detalles'}</p>
                       </div>
                    </div>
                    <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                       <div>
                          <p className="text-[9px] text-neutral-600 font-black uppercase mb-1">Precio Público</p>
                          <p className="text-3xl font-mono text-white font-black">{parseFloat(p.precio_venta || 0).toLocaleString()} <span className="text-sm opacity-30">Bs.</span></p>
                       </div>
                       <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-neutral-200 transition-all shadow-xl"><Edit3 size={20}/></button>
                    </div>
                    {p.stock_actual <= (p.stock_minimo || 5) && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
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

      {/* MODAL PRODUCTO */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[900px] rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[95vh] mac-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Ficha Logística</h3>
                 <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="text-neutral-700 hover:text-white p-3 bg-white/5 rounded-full"><X size={32}/></button>
              </div>
              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <input type="text" value={editingProduct.nombre} onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-white font-black outline-none text-2xl" placeholder="Nombre..."/>
                  <div className="grid grid-cols-2 gap-6">
                    <input type="text" value={editingProduct.serial} onChange={e => setEditingProduct({...editingProduct, serial: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 px-6 text-white font-mono uppercase text-sm outline-none" placeholder="S/N..."/>
                    <input type="text" value={editingProduct.ubicacion} onChange={e => setEditingProduct({...editingProduct, ubicacion: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 px-6 text-white text-sm outline-none" placeholder="Ubicación..."/>
                  </div>
                  <textarea value={editingProduct.ficha_tecnica} onChange={e => setEditingProduct({...editingProduct, ficha_tecnica: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-8 text-white outline-none h-40 resize-none italic" placeholder="Especificaciones..."/>
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-8">
                   <div className="bg-emerald-500/5 p-8 rounded-[40px] border border-emerald-500/10">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 block">Venta Final</label>
                      <input type="number" value={editingProduct.precio_venta} onChange={e => setEditingProduct({...editingProduct, precio_venta: parseFloat(e.target.value) || 0})} className="w-full bg-black/40 border border-emerald-500/20 p-6 rounded-3xl text-white font-mono text-3xl outline-none font-black" />
                   </div>
                   <div className="bg-rose-500/5 p-8 rounded-[40px] border border-rose-500/10">
                      <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 block">Costo Interno</label>
                      <input type="number" value={editingProduct.precio_costo} onChange={e => setEditingProduct({...editingProduct, precio_costo: parseFloat(e.target.value) || 0})} className="w-full bg-black/40 border border-rose-500/10 p-5 rounded-2xl text-white font-mono text-xl outline-none font-bold" />
                   </div>
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 text-center text-white">
                      <label className="text-[9px] font-bold text-neutral-600 uppercase mb-2 block tracking-widest">Stock</label>
                      <input type="number" value={editingProduct.stock_actual} onChange={e => setEditingProduct({...editingProduct, stock_actual: parseInt(e.target.value) || 0})} className="bg-transparent text-3xl font-mono w-full outline-none font-black text-center" />
                   </div>
                </div>
              </div>
              <button onClick={handleSaveProduct} disabled={loading} className="w-full mt-16 py-8 bg-white text-black font-black rounded-[40px] uppercase text-sm shadow-2xl hover:bg-neutral-200 transition-all">Finalizar</button>
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
