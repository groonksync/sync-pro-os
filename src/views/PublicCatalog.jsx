import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, ChevronRight, X, 
  MessageCircle, Info, ShieldCheck, Truck, 
  CreditCard, Smartphone, Zap, Star, Eye, ShoppingCart, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PublicProductCard = ({ p, onViewImage, onConsult }) => {
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

  const isLowStock = parseInt(p.stock_actual) <= (p.stock_minimo || 3) && parseInt(p.stock_actual) > 0;
  const oldPrice = p.precio_anterior || (parseFloat(p.precio_venta || 0) * 1.25);
  const [viewers] = useState(Math.floor(Math.random() * 8) + 3);

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] md:rounded-[48px] p-0 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      {/* SOCIAL PROOF BADGE (Compact Mobile) */}
      <div className="absolute top-3 right-3 md:top-8 md:right-8 z-30 pointer-events-none">
         <div className="px-2 py-1 md:px-4 md:py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-1.5 md:gap-3">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[6px] md:text-[7px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">{viewers} EN LÍNEA</span>
         </div>
      </div>

      {/* IMAGEN CON SLIDER (Compact Mobile) */}
      <div className="aspect-square bg-[#050505] m-2 md:m-4 rounded-[20px] md:rounded-[40px] relative overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => onViewImage(allImages[imgIndex])}>
        {allImages.length > 0 ? (
          <img 
            src={allImages[imgIndex]} 
            className={`max-w-[85%] max-h-[85%] object-contain transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[2px] md:blur-[4px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900">
             <Package size={30} strokeWidth={1} className="text-neutral-800" />
          </div>
        )}

        {/* SELLO AGOTADO INFINITE BAND (Compact Mobile) */}
        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none overflow-hidden">
              <div className="bg-rose-600/90 backdrop-blur-3xl border-y border-white/10 py-2 md:py-6 w-[180%] -rotate-[15deg] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center relative">
                 <span className="text-white text-lg md:text-3xl font-black tracking-[0.3em] md:tracking-[0.6em] uppercase drop-shadow-2xl">AGOTADO</span>
              </div>
           </div>
        )}

        {/* INSIGNIAS DE VENTA (Compact Mobile) */}
        <div className="absolute top-3 left-3 md:top-8 md:left-8 flex flex-col gap-1 md:gap-3 z-20">
           <span className="px-2 py-1 md:px-4 md:py-1.5 bg-blue-600 text-white text-[6px] md:text-[8px] font-black rounded-full uppercase tracking-widest shadow-2xl">
              {p.categoria || 'SYNC PRO'}
           </span>
           {isLowStock && (
              <span className="px-2 py-1 md:px-4 md:py-1.5 bg-orange-600 text-white text-[6px] md:text-[8px] font-black rounded-full uppercase tracking-widest shadow-2xl animate-pulse">
                 ÚLTIMOS {p.stock_actual}
              </span>
           )}
        </div>

        {/* CONTROLES SLIDER (Only Desktop/Large) */}
        {allImages.length > 1 && (
          <div className="hidden md:block">
            <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white hover:text-black">
              <ChevronRight className="rotate-180" size={20}/>
            </button>
            <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white hover:text-black">
              <ChevronRight size={20}/>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 md:p-10 pt-2 md:pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2 md:space-y-4">
          <div className="space-y-0.5 md:space-y-2">
             <h3 className="text-sm md:text-2xl font-black text-white leading-tight tracking-tighter uppercase line-clamp-2">{p.nombre}</h3>
             <p className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] md:tracking-[0.4em]">{p.marca || 'Sovereign Selection'}</p>
          </div>
          
          <div className="flex flex-col gap-0.5 md:gap-1">
             <p className="text-[8px] md:text-[10px] text-rose-500 font-mono line-through opacity-30">
                {oldPrice.toLocaleString()} BS.
             </p>
             <p className="text-xl md:text-4xl font-mono text-white font-black tracking-tighter leading-none">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-[10px] md:text-xs opacity-20 ml-1 md:ml-2 font-sans tracking-widest uppercase">BS.</span>
             </p>
          </div>
        </div>

        <button 
          onClick={() => onConsult(p)}
          className="w-full mt-4 md:mt-10 py-3 md:py-6 bg-white text-black rounded-[1rem] md:rounded-[2rem] font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-4 active:scale-95"
        >
           <WhatsAppIcon size={14} className="md:w-5 md:h-5" />
           Consultar
        </button>
      </div>
    </div>
  );
};

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.117-1.605a11.793 11.793 0 005.932 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.417-8.413z"/>
  </svg>
);

const PublicCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [fullViewImage, setFullViewImage] = useState(null);

  const WHATSAPP_NUMBER = "59169109766"; 

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConsult = (p) => {
    const message = encodeURIComponent(`¡Hola Sync Pro! 👋 Me interesa este producto que vi en su catálogo:\n\n*${p.nombre}*\nPrecio: ${p.precio_venta} Bs.\nLink: ${window.location.origin}/catalogo?id=${p.id}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const categories = ['Todos', ...new Set(productos.map(p => p.categoria))].filter(Boolean);

  const filteredProducts = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'Todos' || p.categoria === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* HEADER COMPACTO (Mobile Focused) */}
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-4 md:py-8 px-5 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-12">
         <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-white text-black rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
               <Zap size={20} className="md:w-7 md:h-7 fill-black" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-xl md:text-3xl font-black tracking-tighter leading-none text-white uppercase">Sync<span className="text-blue-500">PRO</span></h1>
               <div className="flex items-center gap-2 mt-1">
                  <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-neutral-500">MERCADO DE ACTIVOS DIGITALES</p>
                  <ShieldCheck size={10} className="text-blue-500" />
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative flex-1 md:w-[400px] group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-white transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Buscar modelo o serie..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-8 text-[10px] text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-800 font-medium"
               />
            </div>
         </div>
      </header>

      <main className="px-5 md:px-20 py-10 md:py-20">
         {/* FILTROS COMPACTOS (Scroll Horizontal en Móvil) */}
         <div className="flex overflow-x-auto gap-2 md:gap-4 pb-8 md:pb-12 no-scrollbar scroll-smooth snap-x">
            {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setFilterCategory(cat)}
                 className={`px-6 md:px-12 py-3 md:py-5 rounded-[1rem] md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all whitespace-nowrap border snap-start ${
                   filterCategory === cat 
                   ? 'bg-white border-white text-black shadow-lg shadow-white/5' 
                   : 'bg-white/[0.02] border-white/5 text-neutral-600 hover:text-white hover:bg-white/[0.05]'
                 }`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* GRID COMPACTO (2 Columnas en Móvil) */}
         {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-12">
               {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white/[0.03] rounded-[24px] md:rounded-[48px] animate-pulse relative overflow-hidden" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-12">
               {filteredProducts.map(p => (
                  <PublicProductCard 
                    key={p.id} 
                    p={p} 
                    onViewImage={setFullViewImage}
                    onConsult={handleConsult}
                  />
               ))}
            </div>
         )}
      </main>

      {/* FOOTER COMPACTO */}
      <footer className="py-20 md:py-32 border-t border-white/5 text-center px-10 relative overflow-hidden bg-gradient-to-b from-transparent to-white/[0.02]">
         <div className="max-w-4xl mx-auto relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500 mb-6">Sync Pro Global Network</p>
            <h2 className="text-4xl md:text-8xl font-black mb-8 md:mb-12 leading-tight uppercase tracking-tighter">Adquiere<br/><span className="text-neutral-600">Precisión</span></h2>
            <p className="text-neutral-500 mb-12 md:mb-16 leading-relaxed max-w-xl mx-auto text-sm md:text-lg font-medium italic">Sincronización de inventario en tiempo real. Logística segura. Estándares globales para equipos de alto rendimiento.</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-4 md:gap-6 px-10 md:px-16 py-5 md:py-8 bg-white text-black rounded-[1.5rem] md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95">
               <WhatsAppIcon size={20} className="md:w-6 md:h-6" />
               Consulta Segura
            </a>
         </div>
      </footer>

      {/* BOTONES FLOTANTES HUD (Compacto & WhatsApp Real) */}
      <div className="fixed bottom-6 right-6 md:bottom-12 md:right-10 z-[100] flex flex-col gap-4 md:gap-6 animate-in slide-in-from-right duration-700">
         <button 
           onClick={() => alert('Logística Sync Pro: Seguimiento en tiempo real y envíos asegurados.')}
           className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-3xl border border-white/10 text-amber-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-white hover:text-black transition-all group"
         >
            <Truck size={20} className="md:w-7 md:h-7 group-hover:animate-bounce" />
         </button>
         <button 
           onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
           className="w-14 h-14 md:w-20 md:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all relative overflow-hidden group"
         >
            <WhatsAppIcon size={28} className="md:w-10 md:h-10" />
         </button>
      </div>

      {/* VISOR CINEMA (Compacto en Móvil) */}
      {fullViewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in zoom-in duration-500" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-6 right-6 md:top-12 md:right-12 w-12 h-12 md:w-20 md:h-20 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10">
              <X size={24} className="md:w-10 md:h-10" />
           </button>
           
           <div className="relative group/viewer max-w-5xl w-full flex flex-col items-center">
              <img src={fullViewImage} className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain rounded-[2rem] md:rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5" />
              <div className="mt-8 md:mt-12 flex flex-col items-center gap-2 md:gap-4 text-center">
                 <p className="text-white/20 text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] md:tracking-[1em]">Vista de Alta Fidelidad</p>
                 <div className="w-8 md:w-12 h-[1px] bg-white/10" />
                 <p className="text-neutral-500 text-[7px] md:text-[9px] font-black uppercase tracking-widest">Toca en cualquier lugar para regresar</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
