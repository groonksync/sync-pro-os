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
  Settings, Layers, ShieldCheck, List
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WHATSAPP_NUMBER = "59169109766";

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
  const [filterCategory, setFilterCategory] = useState('Todos');
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
      // PRE-PROCESAMIENTO DEFENSIVO: Solo usamos columnas garantizadas
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
        // precio_antes: SE ELIMINA POR ERROR DE SCHEMA
        stock_actual: parseInt(editingProduct.stock_actual) || 0,
        stock_minimo: parseInt(editingProduct.stock_minimo) || 5,
        // stock_vendido: SE ELIMINA POR PRECAUCIÓN
        ficha_tecnica: editingProduct.ficha_tecnica,
        estado: editingProduct.estado || 'Stock',
        imagen: editingProduct.imagen, // Usamos el campo imagen estándar
        codigo: editingProduct.codigo,
        ubicacion: editingProduct.ubicacion,
        serial: editingProduct.serial,
        garantia: garantiaString,
        // tipo_envio: SE ELIMINA POR PRECAUCIÓN
        // imagenes: SE ELIMINA POR PRECAUCIÓN (USAR CAMPO IMAGEN)
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      
      await fetchData();
      setIsModalOpen(false);
      setEditingProduct(null);
      alert('✅ Producto guardado con éxito');
    } catch (e) { 
      alert('Error crítico de base de datos: ' + e.message); 
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id, imageUrl) => {
     if (!confirm('¿Eliminar producto?')) return;
     setLoading(true);
     try {
        await supabase.from('productos').delete().eq('id', id);
        await fetchData();
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

    setEditingProduct({
      ...p,
      garantia_num: gNum,
      garantia_unit: gUnit,
      tipo_envio: 'Envío Gratuito' // Valor local temporal
    });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({ 
      id: crypto.randomUUID(), 
      nombre: '', categoria: 'Computadoras', marca: '',
      precio_costo: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 5,
      ficha_tecnica: '', estado: 'Stock', imagen: '', codigo: '', 
      ubicacion: '', serial: '', garantia_num: 0, garantia_unit: 'Días'
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
      setEditingProduct(prev => ({ ...prev, imagen: publicUrl }));
    } catch (err) { alert('Error subiendo imagen: ' + err.message); }
    finally { setLoading(false); }
  };

  const filteredProducts = (productos || []).filter(p => {
    const norm = normalizeText(searchTerm);
    return normalizeText(p.nombre).includes(norm) || normalizeText(p.codigo).includes(norm) || normalizeText(p.marca).includes(norm);
  });

  return (
    <div className="flex flex-col h-full max-w-full w-full animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Inventario <span className="text-blue-500">Pro</span></h2>
          <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mt-1">Sincronización con Base de Datos Activa</p>
        </div>
        <button onClick={openNewProduct} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl flex items-center gap-2">
           <Plus size={18} strokeWidth={3}/> Nuevo
        </button>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
        <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Identificar activos..." className="w-full bg-[#121212] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-sm text-white outline-none"/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {filteredProducts.map(p => (
          <ProductCard key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onSelect={setSelectedProduct} />
        ))}
      </div>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[800px] rounded-[32px] p-8 md:p-12 shadow-2xl relative">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-white uppercase">Editor Maestro</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                       {editingProduct.imagen ? (
                          <img src={editingProduct.imagen} className="w-full h-full object-cover" />
                       ) : (
                          <ImageIcon size={40} className="text-neutral-800" />
                       )}
                       <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                          <input type="file" className="hidden" onChange={handleImageUpload} />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Imagen</span>
                       </label>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <p className="text-[7px] font-black text-neutral-500 uppercase mb-2 tracking-widest">Código / Serial</p>
                       <input type="text" value={editingProduct.codigo || ''} onChange={e=>setEditingProduct({...editingProduct, codigo: e.target.value})} className="w-full bg-transparent text-xs font-mono font-black text-blue-500 outline-none" placeholder="COD-001" />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-4">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Nombre del Producto</p>
                          <input type="text" value={editingProduct.nombre || ''} onChange={e=>setEditingProduct({...editingProduct, nombre: e.target.value})} className="w-full bg-transparent text-sm font-black text-white outline-none" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Costo</p>
                             <input type="number" value={editingProduct.precio_costo} onChange={e=>setEditingProduct({...editingProduct, precio_costo: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-rose-500 outline-none" />
                          </div>
                          <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                             <p className="text-[7px] font-black text-blue-500 uppercase mb-2">Venta</p>
                             <input type="number" value={editingProduct.precio_venta} onChange={e=>setEditingProduct({...editingProduct, precio_venta: e.target.value})} className="w-full bg-transparent text-xl font-mono font-black text-white outline-none" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Stock Actual</p>
                             <input type="number" value={editingProduct.stock_actual} onChange={e=>setEditingProduct({...editingProduct, stock_actual: e.target.value})} className="w-full bg-transparent text-lg font-mono font-black text-white outline-none" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[7px] font-black text-neutral-500 uppercase mb-2">Garantía</p>
                             <div className="flex items-center gap-1">
                                <input type="number" value={editingProduct.garantia_num} onChange={e=>setEditingProduct({...editingProduct, garantia_num: e.target.value})} className="w-12 bg-transparent text-xs font-black text-white outline-none" />
                                <select value={editingProduct.garantia_unit} onChange={e=>setEditingProduct({...editingProduct, garantia_unit: e.target.value})} className="bg-transparent text-[8px] font-black text-neutral-500 uppercase">
                                   <option value="Días">Días</option>
                                   <option value="Años">Años</option>
                                   <option value="Sin Garantía">N/A</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                    <button onClick={handleSaveProduct} disabled={loading} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3">
                       {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" /> : <Save size={18}/>}
                       Guardar en Nube
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
