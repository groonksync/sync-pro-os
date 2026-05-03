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
  const hasDiscount = p.precio_antes && p.precio_antes > p.precio_venta;
  
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
           {p.tipo_envio === 'Envío Gratuito' && (
             <span className="px-2 py-0.5 bg-emerald-500/80 backdrop-blur-md text-white text-[5px] md:text-[7px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                <Truck size={6} className="md:w-2 md:h-2" /> Envío Gratis
             </span>
           )}
        </div>
      </div>

      <div className="px-3 pb-3 md:px-5 md:pb-6 pt-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-[10px] md:text-base font-black text-white leading-tight tracking-tight uppercase line-clamp-2 min-h-[2.5em]">{p.nombre}</h3>
          
          <div className="flex flex-col">
             {hasDiscount && (
               <p className="text-[7px] md:text-[10px] text-neutral-600 font-mono line-through mb-[-4px] md:mb-[-8px]">
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
          className="w-full mt-3 md:mt-6 py-2.5 md:py-4.5 bg-[#1a1a1a] text-white rounded-lg md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-2xl border border-white/5 group/btn"
        >
           <ShoppingCart size={12} className="md:w-4 md:h-4 text-neutral-500 group-hover/btn:text-white transition-colors" />
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
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
        const nameMatch = normalizeText(p.nombre).includes(normalizedSearch);
        const codeMatch = normalizeText(p.codigo).includes(normalizedSearch);
        const brandMatch = normalizeText(p.marca).includes(normalizedSearch);
        return nameMatch || codeMatch || brandMatch;
      });
    }
    setFilteredProducts(result);
  }, [searchTerm, activeCategory, productos]);

  const categories = ['Todos', ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const handleConsult = (p) => {
    const text = `Hola Sync Pro! Me interesa este producto: *${p.nombre}*\nPrecio: ${p.precio_venta} BS.\n¿Podrían darme más información?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-3 md:py-6 px-4 md:px-20 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-12">
         <div className="flex items-center gap-3 md:gap-6">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white text-black rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
               <Zap size={16} className="md:w-6 md:h-6 fill-black" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-lg md:text-2xl font-black tracking-tighter leading-none text-white uppercase">Sync<span className="text-blue-500">PRO</span></h1>
               <p className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.3em] text-neutral-500 mt-0.5">SISTEMA DE ACTIVOS</p>
            </div>
         </div>

         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-[350px] group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={12} />
               <input 
                 type="text" 
                 placeholder="Buscar productos..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[9px] text-white outline-none focus:border-white/20 transition-all font-medium"
               />
            </div>
         </div>
      </header>

      <main className="px-4 md:px-20 py-8 md:py-12">
         <div className="flex overflow-x-auto gap-2 md:gap-4 mb-8 md:mb-12 no-scrollbar pb-2">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`whitespace-nowrap px-4 md:px-8 py-2 md:py-3.5 rounded-xl md:rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-neutral-500 hover:text-white border border-white/5'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
               {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="aspect-[3/4] bg-white/[0.03] rounded-2xl md:rounded-[32px] animate-pulse border border-white/5" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
               {filteredProducts.map(p => (
                  <PublicProductCard key={p.id} p={p} onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }} />
               ))}
            </div>
         )}
      </main>

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[950px] rounded-[24px] md:rounded-[40px] overflow-hidden shadow-2xl relative max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row">
               <button 
                 onClick={() => setSelectedProduct(null)}
                 className="absolute top-4 right-4 md:top-6 md:right-6 z-[130] w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-2xl"
               >
                  <X size={20}/>
               </button>

               <div 
                 className="w-full md:w-[42%] bg-[#080808] p-4 md:p-10 flex items-center justify-center relative touch-pan-y group/carousel"
                 onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
               >
                  <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500" key={currentImgIndex}>
                     <img 
                       src={allImages[currentImgIndex]} 
                       className="max-w-full max-h-[35vh] md:max-h-[55vh] object-cover drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl" 
                     />
                  </div>

                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 hidden md:flex"><ChevronLeft size={18}/></button>
                      <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 hidden md:flex"><ChevronRight size={18}/></button>
                    </>
                  )}
               </div>

               <div className="w-full md:w-[58%] p-4 md:p-8 flex flex-col justify-between bg-[#121212]">
                  <div className="space-y-3 md:space-y-5">
                     <div>
                        <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[6px] md:text-[8px] font-black rounded-full uppercase tracking-widest border border-blue-500/20">
                           {selectedProduct.categoria}
                        </span>
                        <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tighter uppercase mt-1.5">{selectedProduct.nombre}</h2>
                     </div>
                     
                     <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 bg-white/[0.03] border border-white/5 p-3 md:p-5 rounded-2xl md:rounded-3xl">
                           <p className="text-[6px] md:text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Inversión Final</p>
                           <div className="flex items-baseline gap-2 md:gap-3">
                              <p className="text-2xl md:text-5xl font-mono text-white font-black tracking-tighter leading-none">
                                 {parseFloat(selectedProduct.precio_venta || 0).toLocaleString()} 
                              </p>
                              <div className="flex flex-col">
                                 {selectedProduct.precio_antes > selectedProduct.precio_venta && (
                                    <p className="text-[9px] md:text-xs text-neutral-600 font-mono line-through opacity-50">
                                       {parseFloat(selectedProduct.precio_antes).toLocaleString()}
                                    </p>
                                 )}
                                 <span className="text-[9px] md:text-xs font-black text-blue-500">BS.</span>
                              </div>
                           </div>
                        </div>

                        <div className={`px-4 py-5 md:px-6 md:py-6 rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center text-center ${selectedProduct.tipo_envio === 'Envío Gratuito' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                           <Truck size={16} className="mb-1.5" />
                           <p className="text-[7px] md:text-[9px] font-black uppercase leading-tight">
                              {selectedProduct.tipo_envio || 'Cobro Adicional'}
                           </p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 md:p-3.5 rounded-xl md:rounded-2xl border border-white/5">
                           <div className="flex items-center gap-2 mb-0.5">
                              {selectedProduct.garantia === 'Sin Garantía' ? <ShieldAlert size={10} className="text-rose-500" /> : <ShieldCheck size={10} className="text-blue-500" />}
                              <p className="text-[6px] md:text-[8px] font-black text-neutral-500 uppercase">Garantía</p>
                           </div>
                           <p className="text-[9px] md:text-xs font-black text-white">{selectedProduct.garantia || 'Consultar'}</p>
                        </div>
                        <div className="bg-white/5 p-3 md:p-3.5 rounded-xl md:rounded-2xl border border-white/5">
                           <div className="flex items-center gap-2 mb-0.5">
                              <Zap size={10} className="text-emerald-500" />
                              <p className="text-[6px] md:text-[8px] font-black text-neutral-500 uppercase">Disponibilidad</p>
                           </div>
                           <p className="text-[9px] md:text-xs font-black text-white">Stock Inmediato</p>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                           <FileText size={12} className="text-blue-500"/>
                           <p className="text-[7px] md:text-[9px] font-black text-white uppercase tracking-widest">Especificaciones</p>
                        </div>
                        <p className="text-neutral-400 text-[9px] md:text-sm leading-relaxed italic line-clamp-3">
                           {selectedProduct.ficha_tecnica || 'Calidad Sync Pro garantizada para uso profesional.'}
                        </p>
                     </div>
                  </div>

                  <button 
                    onClick={() => handleConsult(selectedProduct)}
                    className="w-full mt-4 py-3.5 md:py-6 bg-white text-black rounded-xl md:rounded-[2rem] font-black text-[9px] md:text-base uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 border border-white/10"
                  >
                     <WhatsAppIcon size={18} className="md:w-5 md:h-5" />
                     COMPRAR AHORA
                  </button>
               </div>
            </div>
         </div>
      )}

      <footer className="bg-[#0a0a0a] border-t border-white/5 px-4 md:px-20 py-12 md:py-16 text-center">
         <Zap size={20} className="mx-auto mb-3 text-white opacity-20" />
         <p className="text-[7px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Sync Pro Global</p>
         <p className="text-neutral-500 text-[9px] font-medium max-w-xs mx-auto">Equipos de precisión para profesionales.</p>
      </footer>
    </div>
  );
};

export default PublicCatalog;
