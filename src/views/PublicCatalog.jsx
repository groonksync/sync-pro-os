import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, ChevronRight, X, 
  MessageCircle, Info, ShieldCheck, Truck, 
  CreditCard, Smartphone, Zap, Star
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
    <div className="bg-[#0d0d0d] border border-white/5 rounded-[40px] p-0 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SOCIAL PROOF BADGE */}
      <div className="absolute top-6 right-6 z-30 pointer-events-none">
         <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">{viewers} viendo ahora</span>
         </div>
      </div>

      {/* IMAGEN CON SLIDER */}
      <div className="aspect-square bg-[#050505] m-3 rounded-[32px] relative overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => onViewImage(allImages[imgIndex])}>
        {allImages.length > 0 ? (
          <img 
            src={allImages[imgIndex]} 
            className={`max-w-[90%] max-h-[90%] object-contain transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900">
             <Package size={30} className="text-neutral-800" />
          </div>
        )}

        {/* SELLO AGOTADO INFINITE BAND */}
        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none group-hover:scale-110 transition-transform duration-1000 overflow-hidden">
              <div className="bg-black/60 backdrop-blur-3xl border-y border-white/20 py-4 md:py-8 w-[160%] -rotate-[45deg] shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center relative">
                 {/* Efecto Shimmer interno */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                 
                 <span className="text-white text-lg md:text-4xl font-black tracking-[0.8em] md:tracking-[1em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                    Agotado
                 </span>
                 <div className="h-[1px] w-full bg-rose-600/50 mt-4 shadow-[0_0_30px_rgba(225,29,72,1)]" />
              </div>
           </div>
        )}

        {/* INSIGNIAS DE VENTA */}
        <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-col gap-1 md:gap-2 z-20">
           <span className="px-2 py-1 md:px-4 md:py-2 bg-blue-600 text-white text-[7px] md:text-[9px] font-black rounded-full uppercase tracking-widest shadow-2xl backdrop-blur-md">
              {p.categoria || 'Sync Pro'}
           </span>
           {isLowStock && (
              <span className="px-2 py-1 md:px-4 md:py-2 bg-orange-600 text-white text-[7px] md:text-[9px] font-black rounded-full uppercase tracking-widest shadow-2xl animate-pulse">
                 {p.stock_actual} disp.
              </span>
           )}
        </div>

        {/* CONTROLES SLIDER */}
        {allImages.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black">
              <ChevronRight className="rotate-180" size={16}/>
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black">
              <ChevronRight size={16}/>
            </button>
          </>
        )}
      </div>

        <div className="flex-1 space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[8px] font-black rounded-full uppercase tracking-[0.2em] border border-blue-500/10">
                {p.categoria || 'Sync Pro'}
             </span>
             {isLowStock && (
                <span className="px-2 py-1 bg-orange-600 text-white text-[7px] font-black rounded-full uppercase tracking-widest animate-pulse">
                   {p.stock_actual} disp.
                </span>
             )}
          </div>
          <h3 className="text-sm md:text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-400 transition-colors line-clamp-2 uppercase">{p.nombre}</h3>
          {p.marca && (
            <p className="text-[10px] md:text-xs font-bold text-blue-500/80 uppercase tracking-widest">{p.marca}</p>
          )}
        </div>

        <div className="pt-4 md:pt-6 border-t border-white/5 flex flex-col gap-4">
           <div className="flex flex-col">
              <p className="text-[10px] md:text-xs text-rose-500 font-mono line-through opacity-50 mb-1">
                 {oldPrice.toLocaleString()} Bs.
              </p>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-2xl md:text-4xl font-mono text-white font-black tracking-tighter leading-none">
                       {parseFloat(p.precio_venta || 0).toLocaleString()} 
                       <span className="text-[10px] md:text-sm opacity-20 ml-2 font-sans tracking-widest uppercase">Bs.</span>
                    </p>
                 </div>
              </div>
           </div>

           <button 
             onClick={() => onConsult(p)}
             className="w-full py-3 md:py-5 bg-white text-black rounded-xl md:rounded-2xl font-black text-[8px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-3 group/btn"
           >
              <MessageCircle size={14} className="md:w-[18px] md:h-[18px] group-hover/btn:animate-bounce"/>
              Consultar
           </button>
        </div>
      </div>
  );
};

const PublicCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [fullViewImage, setFullViewImage] = useState(null);

  const WHATSAPP_NUMBER = "59169109766"; // Tu número actualizado

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
      {/* HEADER MINIMALISTA EXECUTIVE */}
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-4 md:py-6 px-6 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
               <Zap size={20} className="text-white fill-white" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-lg md:text-xl font-black tracking-[0.2em] leading-none text-white">SYNC PRO</h1>
               <div className="flex items-center gap-2 mt-1">
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-blue-500">EXECUTIVE CATALOG</p>
                  <ShieldCheck size={8} className="text-blue-500" />
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
               <input 
                 type="text" 
                 placeholder="Buscar equipo..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-[11px] md:text-xs outline-none focus:border-blue-500/50 transition-all placeholder:text-neutral-700"
               />
            </div>
         </div>
      </header>

      <main className="px-4 md:px-20 py-8 md:py-16">
         {/* FILTROS DE CATEGORÍA */}
         <div className="flex overflow-x-auto gap-2 md:gap-3 pb-6 md:pb-8 no-scrollbar scroll-smooth snap-x touch-pan-x">
            {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setFilterCategory(cat)}
                 className={`px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border snap-start ${filterCategory === cat ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 border-white/10 text-neutral-500 hover:text-white hover:bg-white/10'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* SKELETON LOADING GRID */}
         {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
               {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white/5 rounded-[40px] animate-pulse relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
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

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 text-center px-10">
         <div className="max-w-2xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500 mb-6">Sync Pro Logistics</p>
            <h2 className="text-4xl font-black mb-8 leading-tight uppercase tracking-tighter">¿Buscas algo específico?</h2>
            <p className="text-neutral-500 mb-12 leading-relaxed">Nuestro inventario se actualiza en tiempo real. Si no encuentras el modelo exacto, contáctanos para importación directa.</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
               <MessageCircle size={20} />
               Hablar con un Experto
            </a>
         </div>
      </footer>

      {/* BOTONES FLOTANTES HUD */}
      <div className="fixed bottom-8 right-6 z-[100] flex flex-col gap-4 animate-in slide-in-from-right duration-500">
         <button 
           onClick={() => alert('Logística VIP Sync Pro: Envíos asegurados y garantizados a nivel nacional.')}
           className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-xl border border-white/10 text-orange-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-white transition-all"
         >
            <Truck size={24} />
         </button>
         <button 
           onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
           className="w-14 h-14 md:w-20 md:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all animate-bounce-subtle"
         >
            <MessageCircle size={32} />
         </button>
      </div>

      {/* VISOR CINEMA */}
      {fullViewImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-10 right-10 w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10">
              <X size={32}/>
           </button>
           <img src={fullViewImage} className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)]" />
           <p className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.5em]">Toca en cualquier lugar para cerrar</p>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
