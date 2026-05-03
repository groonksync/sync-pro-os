import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Search, Filter, ChevronRight, ChevronLeft, X, 
  MessageCircle, Info, ShieldCheck, Truck, 
  CreditCard, Smartphone, Zap, Star, Eye, ShoppingCart, ArrowUpRight, FileText
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
      <div className="aspect-square bg-[#080808] m-1.5 md:m-2.5 rounded-xl md:rounded-[24px] relative overflow-hidden flex items-center justify-center">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            className={`max-w-[90%] max-h-[90%] object-contain transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <Package size={24} strokeWidth={1} className="text-neutral-800" />
        )}

        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none overflow-hidden">
              <div className="bg-black/90 backdrop-blur-md border-y border-white/10 py-1.5 md:py-3 w-[200%] -rotate-[15deg] shadow-2xl flex flex-col items-center justify-center">
                 <span className="text-white text-[8px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.4em] uppercase">AGOTADO</span>
              </div>
           </div>
        )}

        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
           <span className="px-2 py-0.5 bg-blue-600/80 backdrop-blur-md text-white text-[5px] md:text-[7px] font-black rounded-full uppercase tracking-widest">
              {p.categoria || 'SYNC'}
           </span>
        </div>
      </div>

      <div className="px-3 pb-3 md:px-5 md:pb-6 pt-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1 md:space-y-3">
          <h3 className="text-[10px] md:text-base font-black text-white leading-tight tracking-tight uppercase line-clamp-2 min-h-[2.5em]">{p.nombre}</h3>
          
          <div className="flex flex-col">
             <p className="text-[6px] md:text-[9px] text-blue-500 font-black uppercase tracking-widest opacity-50 mb-0.5">Inversión</p>
             <p className="text-xl md:text-4xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[8px] md:text-xs opacity-30 ml-1 font-sans">BS.</span>
             </p>
          </div>
        </div>

        <button 
          className="w-full mt-3 md:mt-6 py-2 md:py-4 bg-white text-black rounded-lg md:rounded-2xl font-black text-[7px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg border border-transparent"
        >
           <WhatsAppIcon size={12} className="md:w-4 md:h-4" />
           Ver Detalles
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
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, activeCategory, productos]);

  const categories = ['Todos', ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const handleConsult = (p) => {
    const text = `Hola Sync Pro! Me interesa este producto: *${p.nombre}*\nCódigo: ${p.codigo || 'N/A'}\nPrecio: ${p.precio_venta} BS.\n¿Podrían darme más información?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
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
      nextImg(); // Swipe left -> Next
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevImg(); // Swipe right -> Prev
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-3 md:py-6 px-4 md:px-20 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-12">
         <div className="flex items-center gap-3 md:gap-6">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white text-black rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg">
               <Zap size={16} className="md:w-6 md:h-6 fill-black" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-lg md:text-2xl font-black tracking-tighter leading-none text-white uppercase">Sync<span className="text-blue-500">PRO</span></h1>
               <p className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.3em] text-neutral-500 mt-0.5">MARCADO DE ACTIVOS</p>
            </div>
         </div>

         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-[350px] group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={12} />
               <input 
                 type="text" 
                 placeholder="Buscar..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[9px] text-white outline-none focus:border-white/20 transition-all font-medium"
               />
            </div>
         </div>
      </header>

      <main className="px-4 md:px-20 py-8 md:py-16">
         <div className="flex overflow-x-auto gap-2 md:gap-4 mb-8 md:mb-16 no-scrollbar pb-4">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`whitespace-nowrap px-4 md:px-10 py-2 md:py-4 rounded-xl md:rounded-full text-[8px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-neutral-500 hover:text-white border border-white/5'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
               {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="aspect-[3/4] bg-white/[0.03] rounded-2xl md:rounded-[32px] animate-pulse" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
               {filteredProducts.map(p => (
                  <PublicProductCard 
                    key={p.id} 
                    p={p} 
                    onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }}
                  />
               ))}
            </div>
         )}
      </main>

      <footer className="bg-[#0a0a0a] border-t border-white/5 px-4 md:px-20 py-20 md:py-40 text-center">
         <div className="max-w-4xl mx-auto">
            <Zap size={40} className="mx-auto mb-10 text-white opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500 mb-6">Sync Pro Global Network</p>
            <h2 className="text-4xl md:text-8xl font-black mb-8 md:mb-12 leading-tight uppercase tracking-tighter">Adquiere<br/><span className="text-neutral-600">Precisión</span></h2>
            <p className="text-neutral-500 mb-12 md:mb-16 leading-relaxed max-w-xl mx-auto text-sm md:text-lg font-medium italic">Sincronización de inventario en tiempo real. Logística segura. Estándares globales para equipos de alto rendimiento.</p>
         </div>
      </footer>

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[1200px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative max-h-[95vh] flex flex-col md:flex-row">
               <button 
                 onClick={() => setSelectedProduct(null)}
                 className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] w-10 h-10 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-2xl"
               >
                  <X size={24}/>
               </button>

               {/* ÁREA DE IMAGEN CON CARRUSEL TÁCTIL */}
               <div 
                 className="w-full md:w-1/2 bg-[#080808] p-6 md:p-16 flex items-center justify-center relative touch-pan-y group/carousel"
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
               >
                  <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500" key={currentImgIndex}>
                     <img 
                       src={allImages[currentImgIndex]} 
                       className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                       alt={`Product ${currentImgIndex}`}
                     />
                  </div>

                  {/* CONTROLES DEL CARRUSEL (Escritorio) */}
                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 opacity-0 group-hover/carousel:opacity-100 hidden md:flex">
                        <ChevronLeft size={24}/>
                      </button>
                      <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 opacity-0 group-hover/carousel:opacity-100 hidden md:flex">
                        <ChevronRight size={24}/>
                      </button>
                      
                      {/* INDICADORES (Dots) */}
                      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                        {allImages.map((_, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setCurrentImgIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentImgIndex ? 'bg-blue-500 w-6' : 'bg-white/20 hover:bg-white/40'}`} 
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12">
                     <span className="px-4 py-1 md:px-8 md:py-3 bg-blue-600 text-white text-[7px] md:text-xs font-black rounded-full uppercase tracking-widest shadow-2xl">
                        {selectedProduct.categoria}
                     </span>
                  </div>
               </div>

               {/* ÁREA DE ESPECIFICACIONES */}
               <div className="w-full md:w-1/2 p-6 md:p-16 overflow-y-auto mac-scrollbar bg-[#121212] flex flex-col">
                  <div className="flex-1 space-y-8 md:space-y-12">
                     <div className="space-y-2 md:space-y-4">
                        <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">Asset ID: {selectedProduct.codigo || 'N/A'}</p>
                        <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase">{selectedProduct.nombre}</h2>
                     </div>
                     
                     <div className="bg-white/[0.03] border border-white/5 p-6 md:p-10 rounded-[2rem] shadow-inner">
                        <p className="text-[7px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 md:mb-4">Inversión Final</p>
                        <p className="text-4xl md:text-8xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                           {parseFloat(selectedProduct.precio_venta || 0).toLocaleString()} 
                           <span className="text-lg md:text-3xl opacity-20 ml-3 md:ml-6 font-sans">BS.</span>
                        </p>
                     </div>

                     <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:pb-4">
                           <FileText size={16} className="text-blue-500"/>
                           <p className="text-[8px] md:text-[11px] font-black text-white uppercase tracking-widest">Ficha Técnica & Detalles</p>
                        </div>
                        <div className="text-neutral-400 text-xs md:text-lg leading-relaxed italic whitespace-pre-wrap">
                           {selectedProduct.ficha_tecnica || 'No hay especificaciones detalladas para este activo.'}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 md:gap-6">
                        <div className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                           <p className="text-[6px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Garantía</p>
                           <p className="text-[10px] md:text-sm font-black text-white uppercase tracking-tighter">Sync Pro Oficial</p>
                        </div>
                        <div className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                           <p className="text-[6px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Entrega</p>
                           <p className="text-[10px] md:text-sm font-black text-white uppercase tracking-tighter">Inmediata</p>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={() => handleConsult(selectedProduct)}
                    className="w-full mt-12 md:mt-20 py-5 md:py-10 bg-white text-black rounded-2xl md:rounded-[3rem] font-black text-xs md:text-lg uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 md:gap-8 active:scale-95"
                  >
                     <WhatsAppIcon size={24} className="md:w-8 md:h-8" />
                     Consultar Vía WhatsApp
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* HUD FLOTANTE */}
      <div className="fixed bottom-6 right-6 md:bottom-12 md:right-10 z-[100] flex flex-col gap-4 md:gap-6">
         <button className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-3xl border border-white/10 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all group">
            <Truck size={20} className="md:w-7 md:h-7 group-hover:animate-bounce" />
         </button>
         <button 
           onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
           className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-3xl border border-white/10 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all"
         >
            <WhatsAppIcon size={24} className="md:w-8 md:h-8" />
         </button>
      </div>
    </div>
  );
};

export default PublicCatalog;
