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

  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-[24px] md:rounded-[32px] p-0 hover:border-white/20 transition-all flex flex-col group relative shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* IMAGEN CON SLIDER */}
      <div className="aspect-square bg-[#050505] relative overflow-hidden cursor-zoom-in" onClick={() => onViewImage(allImages[imgIndex])}>
        {allImages.length > 0 ? (
          <img 
            src={allImages[imgIndex]} 
            className="w-full h-full object-contain p-2 md:p-4 transition-transform duration-1000 group-hover:scale-110"
            alt={p.nombre}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900">
             <Package size={30} className="text-neutral-800" />
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

      <div className="p-4 md:p-8 flex-1 flex flex-col">
        <div className="flex-1 space-y-2 md:space-y-4 mb-4 md:mb-8">
          <h3 className="text-sm md:text-2xl font-black text-white leading-tight tracking-tight group-hover:text-blue-400 transition-colors line-clamp-2">{p.nombre}</h3>
          
          <div className="flex flex-wrap gap-1 md:gap-2">
             <div className="px-2 py-0.5 bg-white/5 rounded-md text-[7px] md:text-[9px] font-mono text-neutral-400 border border-white/5 uppercase tracking-widest">Garantía: {p.garantia || '180 Días'}</div>
             <div className="hidden md:block px-3 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-mono text-emerald-500 border border-emerald-500/10 uppercase tracking-widest font-black text-center">Certificado Sync Pro</div>
          </div>
        </div>

        <div className="pt-4 md:pt-8 border-t border-white/5 flex flex-col gap-4 md:gap-6">
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[7px] md:text-[10px] text-neutral-600 font-black uppercase mb-1 tracking-[0.3em]">Precio Mercado</p>
                 <p className="text-xl md:text-5xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(p.precio_venta || 0).toLocaleString()} <span className="text-[10px] md:text-lg opacity-20 ml-1">Bs.</span></p>
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
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-2xl border-b border-white/5 py-8 px-6 lg:px-20 flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
               <Zap size={32} className="text-white fill-white" />
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tighter leading-none">SYNC PRO <span className="text-blue-500 italic">CATALOG</span></h1>
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-neutral-500 mt-1">Soberanía Tecnológica</p>
            </div>
         </div>

         <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar equipo..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-8 text-sm outline-none focus:border-blue-500/50 transition-all"
               />
            </div>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" className="hidden lg:flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl">
               <MessageCircle size={18} />
               Soporte Live
            </a>
         </div>
      </header>

      <main className="px-6 lg:px-20 py-16">
         {/* SECCIÓN PASOS PARA COMPRAR */}
         <section className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})}>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
               <p className="text-5xl font-black text-white/10 mb-4 font-mono">01</p>
               <h4 className="text-xl font-bold mb-3 uppercase tracking-tight">Elige tu Equipo</h4>
               <p className="text-sm text-neutral-500 leading-relaxed">Explora nuestra selección premium de tecnología Sync Pro con fotos reales.</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
               <p className="text-5xl font-black text-white/10 mb-4 font-mono">02</p>
               <h4 className="text-xl font-bold mb-3 uppercase tracking-tight">Pide por WhatsApp</h4>
               <p className="text-sm text-neutral-500 leading-relaxed">Toca aquí para recibir atención personalizada al instante.</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] relative overflow-hidden group hover:border-yellow-500/30 transition-all cursor-pointer" onClick={() => alert('Coordinamos envíos a todo el país vía Courier')}>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all"></div>
               <p className="text-5xl font-black text-white/10 mb-4 font-mono">03</p>
               <h4 className="text-xl font-bold mb-3 uppercase tracking-tight">Envío Inmediato</h4>
               <p className="text-sm text-neutral-500 leading-relaxed">Coordinamos el pago y enviamos tu equipo con certificado Sync Pro.</p>
            </div>
         </section>

         {/* FILTROS DE CATEGORÍA */}
         <div className="flex overflow-x-auto gap-3 pb-8 no-scrollbar scroll-smooth snap-x touch-pan-x">
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

         {/* GRID DE PRODUCTOS */}
         {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
               <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-600">Sincronizando Catálogo...</p>
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
