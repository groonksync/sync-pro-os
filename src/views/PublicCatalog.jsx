import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Search, ChevronRight, ChevronLeft, X, 
  Truck, Zap, ShoppingCart, Info, ShieldCheck, 
  FileText, ShieldAlert, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.117-1.605a11.793 11.793 0 005.932 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.417-8.413z"/>
  </svg>
);

const PublicProductCard = ({ p, onSelect }) => {
  const hasDiscount = p.precio_antes && p.precio_antes > p.precio_venta;
  const isAgotado = parseInt(p.stock_actual) === 0;
  
  return (
    <div 
      onClick={() => onSelect(p)}
      className="bg-[#121212] border border-white/5 rounded-2xl md:rounded-[32px] p-0 hover:border-blue-500/30 transition-all flex flex-col group relative shadow-2xl overflow-hidden cursor-pointer h-full"
    >
      <div className="aspect-square bg-[#080808] m-1.5 md:m-2 rounded-xl md:rounded-[24px] relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className={`w-full h-full object-cover rounded-[inherit] transition-transform duration-1000 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <Package size={24} strokeWidth={1} className="text-neutral-800" />
        )}

        {isAgotado && (
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
           {p.tipo_envio === 'Envío Gratuito' && (
             <span className="px-2 py-0.5 bg-emerald-500/80 backdrop-blur-md text-white text-[5px] md:text-[7px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                <Truck size={6} className="md:w-2 md:h-2" /> Envío Gratis
             </span>
           )}
        </div>
      </div>

      <div className="px-3 pb-3 md:px-5 md:pb-6 pt-1 flex-1 flex flex-col justify-between">
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-[10px] md:text-base font-black text-white leading-tight tracking-tight uppercase line-clamp-2 min-h-[2.5em]">{p.nombre}</h3>
            <div className="flex items-center gap-2">
               <p className="text-[6px] md:text-[8px] font-black text-neutral-600 uppercase tracking-widest">{p.marca || 'Sovereign'}</p>
               <span className="w-1 h-1 bg-neutral-800 rounded-full" />
               <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${parseInt(p.stock_actual) < 5 ? 'text-amber-500' : 'text-neutral-500'}`}>
                  {p.stock_actual} UNIDADES
               </p>
            </div>
          </div>
          
          <div className="flex flex-col min-h-[3em] justify-end">
             {hasDiscount && (
               <p className="text-[7px] md:text-[10px] text-neutral-600 font-mono line-through mb-[-2px] md:mb-[-4px]">
                  {parseFloat(p.precio_antes).toLocaleString()} BS.
               </p>
             )}
             <p className="text-xl md:text-4xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[8px] md:text-xs opacity-30 ml-1 font-sans">BS.</span>
             </p>
          </div>
        </div>

        <button 
          className="w-full mt-4 md:mt-6 py-2.5 md:py-4.5 bg-emerald-500 text-black rounded-lg md:rounded-2xl font-black text-[8px] md:text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
        >
           <ShoppingCart size={12} className="md:w-4 md:h-4" />
           COMPRAR AHORA
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
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

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

  const allImages = selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [];
  const nextImg = () => setCurrentImgIndex(prev => (prev + 1) % allImages.length);
  const prevImg = () => setCurrentImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-4 md:py-8 px-4 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
               <Zap size={22} className="fill-black" />
            </div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Sync<span className="text-blue-500">PRO</span></h1>
         </div>
         <div className="relative flex-1 max-w-[500px] w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" size={16} />
            <input 
              type="text" 
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 text-sm text-white outline-none focus:border-white/20 transition-all"
            />
         </div>
      </header>

      <main className="px-4 md:px-20 py-10 md:py-16">
         <div className="flex overflow-x-auto gap-3 mb-12 no-scrollbar pb-2">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`whitespace-nowrap px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-neutral-500 border border-white/5 hover:text-white'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
            {filteredProducts.map(p => (
               <PublicProductCard key={p.id} p={p} onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }} />
            ))}
         </div>
      </main>

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[950px] rounded-[24px] md:rounded-[40px] overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-[160] w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 hover:text-white transition-all"><X size={20}/></button>
               <div className="w-full md:w-[42%] bg-[#080808] p-4 md:p-10 flex items-center justify-center relative group/carousel">
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
               <div className="w-full md:w-[58%] p-6 md:p-12 flex flex-col justify-between bg-[#121212]">
                  <div className="space-y-6">
                     <div>
                        <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">{selectedProduct.categoria}</p>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-tight">{selectedProduct.nombre}</h2>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 p-6 md:p-8 rounded-[2.5rem] shadow-inner">
                        <p className="text-[7px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Precio de Adquisición</p>
                        <div className="flex items-baseline gap-4">
                           <p className="text-4xl md:text-6xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}</p>
                           <div className="flex flex-col">
                              {selectedProduct.precio_antes > selectedProduct.precio_venta && <p className="text-xs md:text-base text-neutral-600 font-mono line-through opacity-50">{parseFloat(selectedProduct.precio_antes).toLocaleString()}</p>}
                              <span className="text-xs md:text-base font-black text-emerald-500 uppercase">Bolivianos</span>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                           <p className="text-[8px] font-black text-neutral-500 uppercase mb-1">Garantía</p>
                           <p className="text-xs md:text-sm font-black text-white uppercase">{selectedProduct.garantia || 'Consultar'}</p>
                        </div>
                        <div className={`p-5 rounded-3xl border flex items-center gap-3 ${selectedProduct.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                           <Truck size={18} /><p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">{selectedProduct.tipo_envio || 'Cobro Adicional'}</p>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => handleConsult(selectedProduct)} className="w-full py-6 md:py-8 bg-emerald-500 text-black rounded-[2.5rem] font-black uppercase text-xs md:text-base tracking-[0.3em] hover:bg-white hover:scale-[1.02] transition-all shadow-[0_20px_60px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4 active:scale-95">
                     <WhatsAppIcon size={24} />
                     COMPRAR POR WHATSAPP
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default PublicCatalog;
