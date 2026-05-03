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
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[48px] p-0 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      {/* SOCIAL PROOF BADGE */}
      <div className="absolute top-8 right-8 z-30 pointer-events-none">
         <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[7px] font-black text-white uppercase tracking-[0.3em]">{viewers} GUESTS VIEWING</span>
         </div>
      </div>

      {/* IMAGEN CON SLIDER (Executive Padding) */}
      <div className="aspect-square bg-[#050505] m-4 rounded-[40px] relative overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => onViewImage(allImages[imgIndex])}>
        {allImages.length > 0 ? (
          <img 
            src={allImages[imgIndex]} 
            className={`max-w-[80%] max-h-[80%] object-contain transition-transform duration-1000 group-hover:scale-110 ${parseInt(p.stock_actual) === 0 ? 'grayscale opacity-30 blur-[4px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900">
             <Package size={40} strokeWidth={1} className="text-neutral-800" />
          </div>
        )}

        {/* SELLO AGOTADO INFINITE BAND (Improved Aesthetics) */}
        {parseInt(p.stock_actual) === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none overflow-hidden">
              <div className="bg-black/80 backdrop-blur-3xl border-y border-white/10 py-6 w-[180%] -rotate-[15deg] shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center relative">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                 <span className="text-white text-3xl font-black tracking-[0.6em] uppercase drop-shadow-2xl">SOLDOUT</span>
                 <span className="text-white/40 text-[8px] font-black uppercase tracking-[0.5em] mt-2">Sovereign Reserve</span>
              </div>
           </div>
        )}

        {/* INSIGNIAS DE VENTA */}
        <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
           <span className="px-4 py-1.5 bg-blue-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-2xl">
              {p.categoria || 'SYNC PRO'}
           </span>
           {isLowStock && (
              <span className="px-4 py-1.5 bg-orange-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-2xl animate-pulse">
                 {p.stock_actual} LEFT
              </span>
           )}
        </div>

        {/* CONTROLES SLIDER */}
        {allImages.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white hover:text-black">
              <ChevronRight className="rotate-180" size={20}/>
            </button>
            <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white hover:text-black">
              <ChevronRight size={20}/>
            </button>
          </>
        )}
      </div>

      <div className="p-10 pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
             <h3 className="text-2xl font-black text-white leading-tight tracking-tighter uppercase line-clamp-2">{p.nombre}</h3>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">{p.marca || 'Sovereign Selection'}</p>
          </div>
          
          <div className="flex flex-col gap-1">
             <p className="text-[10px] text-rose-500 font-mono line-through opacity-30">
                {oldPrice.toLocaleString()} BS.
             </p>
             <p className="text-4xl font-mono text-white font-black tracking-tighter leading-none">
                {parseFloat(p.precio_venta || 0).toLocaleString()} 
                <span className="text-xs opacity-20 ml-2 font-sans tracking-widest uppercase">BS.</span>
             </p>
          </div>
        </div>

        <button 
          onClick={() => onConsult(p)}
          className="w-full mt-10 py-6 bg-white text-black rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
        >
           <MessageCircle size={20} strokeWidth={2.5}/>
           Identify Asset
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
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-8 px-10 lg:px-20 flex flex-col lg:flex-row justify-between items-center gap-12">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white text-black rounded-[1.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
               <Zap size={28} className="fill-black" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-3xl font-black tracking-tighter leading-none text-white uppercase">Sovereign<span className="text-blue-500">OS</span></h1>
               <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500">Digital Asset Marketplace</p>
                  <ShieldCheck size={12} className="text-blue-500" />
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-[500px] group">
               <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-white transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by model or series..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-6 pl-20 pr-10 text-xs text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-800 font-medium"
               />
            </div>
         </div>
      </header>

      <main className="px-10 lg:px-20 py-20">
         {/* FILTROS DE CATEGORÍA (Executive Layout) */}
         <div className="flex overflow-x-auto gap-4 pb-12 no-scrollbar scroll-smooth snap-x">
            {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setFilterCategory(cat)}
                 className={`px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap border snap-start ${
                   filterCategory === cat 
                   ? 'bg-white border-white text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)]' 
                   : 'bg-white/[0.02] border-white/5 text-neutral-600 hover:text-white hover:bg-white/[0.05]'
                 }`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* SKELETON LOADING GRID */}
         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white/[0.03] rounded-[48px] animate-pulse relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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

      {/* FOOTER (Executive Authority) */}
      <footer className="py-32 border-t border-white/5 text-center px-10 relative overflow-hidden bg-gradient-to-b from-transparent to-white/[0.02]">
         <div className="max-w-4xl mx-auto relative z-10">
            <div className="w-1 h-20 bg-gradient-to-b from-blue-500 to-transparent mx-auto mb-12 opacity-50" />
            <p className="text-[12px] font-black uppercase tracking-[0.8em] text-blue-500 mb-8">Sovereign Global Asset Network</p>
            <h2 className="text-6xl md:text-8xl font-black mb-12 leading-tight uppercase tracking-tighter">Acquire<br/><span className="text-neutral-600">Precision</span></h2>
            <p className="text-neutral-500 mb-16 leading-relaxed max-w-xl mx-auto text-lg font-medium">Real-time inventory synchronization. Secure logistics. Global distribution standards for elite performance equipment.</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-6 px-16 py-8 bg-white text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_30px_60px_rgba(255,255,255,0.1)] active:scale-95">
               <MessageCircle size={24} />
               Secure Consultation
            </a>
         </div>
      </footer>

      {/* BOTONES FLOTANTES HUD (Premium Glass) */}
      <div className="fixed bottom-12 right-10 z-[100] flex flex-col gap-6 animate-in slide-in-from-right duration-700">
         <button 
           onClick={() => alert('Sovereign Global Logistics: Real-time tracking and insured shipping enabled.')}
           className="w-16 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 text-amber-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-white hover:text-black transition-all group"
         >
            <Truck size={28} className="group-hover:animate-bounce" />
         </button>
         <button 
           onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
           className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all relative overflow-hidden group"
         >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <MessageCircle size={36} strokeWidth={2.5} />
         </button>
      </div>

      {/* VISOR CINEMA (Total Immersion) */}
      {fullViewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in duration-500" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-12 right-12 w-20 h-20 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10 shadow-2xl group">
              <X size={40} className="group-hover:rotate-90 transition-transform duration-500"/>
           </button>
           
           <div className="relative group/viewer max-w-5xl w-full flex flex-col items-center">
              <img src={fullViewImage} className="max-w-full max-h-[75vh] object-contain rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5" />
              <div className="mt-12 flex flex-col items-center gap-4">
                 <p className="text-white/20 text-[10px] font-black uppercase tracking-[1em]">High Fidelity Asset Preview</p>
                 <div className="w-12 h-[1px] bg-white/10" />
                 <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Tap anywhere to return to vault</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
