import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Search, Filter, ChevronRight, ChevronLeft, X, 
  MessageCircle, Info, ShieldCheck, Truck, 
  CreditCard, Smartphone, Zap, Star, Eye, ShoppingCart, ArrowUpRight, FileText,
  BadgePercent, Tag, ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.117-1.605a11.793 11.793 0 005.932 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.417-8.413z"/>
  </svg>
);

const PublicProductCard = ({ p, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(p)}
      className="bg-[#121212] border border-white/5 rounded-2xl md:rounded-[32px] p-0 hover:border-blue-500/30 transition-all flex flex-col group relative shadow-2xl overflow-hidden cursor-pointer h-full"
    >
      <div className="aspect-square bg-[#080808] m-1.5 md:m-2 rounded-xl md:rounded-[24px] relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className={`w-full h-full object-cover rounded-[inherit] transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <Package size={24} strokeWidth={1} className="text-neutral-800" />
        )}

        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md border-y border-white/5 py-1.5 md:py-3 w-[400%] -rotate-[15deg] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                 <span className="text-white text-[9px] md:text-sm font-bold tracking-[0.4em] md:tracking-[0.8em] uppercase opacity-90">AGOTADO</span>
              </div>
           </div>
        )}

        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex flex-col gap-1">
           <span className="px-2 py-0.5 bg-blue-600/80 backdrop-blur-md text-white text-[5px] md:text-[7px] font-black rounded-full uppercase tracking-widest">
              {p.categoria || 'SYNC'}
           </span>
        </div>
      </div>

      <div className="px-3 pb-3 md:px-5 md:pb-6 pt-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-[10px] md:text-base font-black text-white leading-tight tracking-tight uppercase line-clamp-2 min-h-[2.5em]">{p.nombre}</h3>
          
          <div className="flex flex-col">
             <p className="text-xl md:text-4xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[8px] md:text-xs opacity-30 ml-1 font-sans">BS.</span>
             </p>
          </div>
        </div>

        <button 
          className="w-full mt-3 md:mt-6 py-2.5 md:py-4.5 bg-[#1a1a1a] text-white rounded-lg md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
           COMPRAR
        </button>
      </div>
    </div>
  );
};

const PublicCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const WHATSAPP_NUMBER = "59169109766"; 

  const normalizeText = (text) => {
    return (text || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProductos(data || []);
      setFilteredProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = productos;
    if (activeCategory !== 'Todos') {
      result = result.filter(p => p.categoria === activeCategory);
    }
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      result = result.filter(p => {
        return normalizeText(p.nombre).includes(normalizedSearch) || normalizeText(p.codigo).includes(normalizedSearch);
      });
    }
    setFilteredProducts(result);
  }, [searchTerm, activeCategory, productos]);

  const categories = ['Todos', ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const handleConsult = (p) => {
    const text = `Hola! Me interesa: *${p.nombre}* (${p.precio_venta} BS.)`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500">
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-4 md:py-6 px-4 md:px-20 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <Zap size={24} className="text-blue-500 fill-blue-500" />
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Sync<span className="text-blue-500">PRO</span></h1>
         </div>
         <div className="relative flex-1 max-w-[400px] ml-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white outline-none"
            />
         </div>
      </header>

      <main className="px-4 md:px-20 py-8">
         <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar pb-2">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`whitespace-nowrap px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-neutral-500 border border-white/5'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map(p => (
               <PublicProductCard key={p.id} p={p} onSelect={setSelectedProduct} />
            ))}
         </div>
      </main>

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[800px] rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-[130] p-2 bg-white text-black rounded-full"><X size={20}/></button>
               <div className="w-full md:w-[45%] bg-[#080808] p-8 flex items-center justify-center">
                  <img src={selectedProduct.imagen} className="max-w-full max-h-[40vh] md:max-h-[60vh] object-contain rounded-2xl shadow-2xl" />
               </div>
               <div className="w-full md:w-[55%] p-8 flex flex-col justify-center gap-6">
                  <div>
                     <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">{selectedProduct.categoria}</p>
                     <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter uppercase">{selectedProduct.nombre}</h2>
                  </div>
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                     <p className="text-[8px] font-black text-neutral-500 uppercase mb-2">Precio de Venta</p>
                     <p className="text-4xl md:text-6xl font-mono text-white font-black tracking-tighter">{parseFloat(selectedProduct.precio_venta).toLocaleString()} <span className="text-xs text-blue-500">BS.</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black text-neutral-500 uppercase mb-1">Garantía</p>
                        <p className="text-xs font-black text-white">{selectedProduct.garantia || 'Consultar'}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black text-neutral-500 uppercase mb-1">Estado</p>
                        <p className="text-xs font-black text-white">Stock Inmediato</p>
                     </div>
                  </div>
                  <button onClick={() => handleConsult(selectedProduct)} className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:text-white transition-all">WhatsApp Compra</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default PublicCatalog;
