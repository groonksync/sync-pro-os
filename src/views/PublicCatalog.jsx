import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, Search, ChevronRight, ChevronLeft, X, 
  Truck, Zap, ShoppingCart, ShieldCheck, 
  CheckCircle, DollarSign
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
      className="bg-[#121212] border border-white/5 rounded-2xl md:rounded-[28px] p-0 hover:border-emerald-500/30 transition-all flex flex-col group relative shadow-2xl overflow-hidden cursor-pointer h-full"
    >
      <div className="aspect-square bg-[#080808] m-1 md:m-1.5 rounded-xl md:rounded-[22px] relative overflow-hidden flex items-center justify-center border border-white/5">
        {p.imagen ? (
          <img 
            src={p.imagen} 
            loading="lazy"
            className={`w-full h-full object-cover rounded-[inherit] transition-transform duration-700 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-30 blur-[2px]' : ''}`}
            alt={p.nombre}
          />
        ) : (
          <Package size={20} strokeWidth={1} className="text-neutral-800" />
        )}

        {isAgotado ? (
           <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <span className="text-white text-[8px] md:text-[10px] font-black tracking-[0.3em] uppercase">AGOTADO</span>
           </div>
        ) : (
           <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
              <span className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md text-black text-[5px] md:text-[7px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 shadow-2xl">
                <CheckCircle size={6} /> DISPONIBLE
              </span>
           </div>
        )}
      </div>

      <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="space-y-0.5">
            <h3 className="text-[9px] md:text-[13px] font-black text-white leading-tight tracking-tight uppercase line-clamp-1">{p.nombre}</h3>
            <div className="flex items-center justify-between">
               <p className="text-[6px] md:text-[8px] font-black text-neutral-600 uppercase tracking-widest">{p.marca || 'Sovereign'}</p>
               <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${parseInt(p.stock_actual) < 5 ? 'text-amber-500' : 'text-neutral-500'}`}>
                  {p.stock_actual} UDS
               </p>
            </div>
          </div>
          <div className="flex flex-col min-h-[2.2em] justify-end">
             {hasDiscount && <p className="text-[6px] md:text-[9px] text-neutral-700 font-mono line-through mb-[-2px]">{parseFloat(p.precio_antes).toLocaleString()} BS.</p>}
             <p className="text-lg md:text-2xl font-mono text-white font-black tracking-tighter leading-none flex items-baseline">
                {parseFloat(p.precio_venta || 0).toLocaleString()} <span className="text-[7px] md:text-[10px] opacity-20 ml-1 font-sans font-black">BS.</span>
             </p>
          </div>
        </div>
        <button className="w-full mt-3 py-2 md:py-3 bg-emerald-500 text-black rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-lg">
           <ShoppingCart size={10} className="md:w-3.5 md:h-3.5" /> COMPRAR
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
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const WHATSAPP_NUMBER = "59169109766"; 

  const normalizeText = (text) => (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos(data || []);
      setFilteredProducts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let result = productos;
    if (activeCategory !== 'Todos') result = result.filter(p => p.categoria === activeCategory);
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      result = result.filter(p => normalizeText(p.nombre).includes(normalizedSearch) || normalizeText(p.codigo).includes(normalizedSearch));
    }
    setFilteredProducts(result);
  }, [searchTerm, activeCategory, productos]);

  const categories = useMemo(() => ['Todos', ...new Set(productos.map(p => p.categoria).filter(Boolean))], [productos]);

  const allImages = useMemo(() => selectedProduct ? [selectedProduct.imagen, ...(selectedProduct.imagenes || [])].filter(Boolean) : [], [selectedProduct]);

  const nextImg = () => setCurrentImgIndex(prev => (prev + 1) % allImages.length);
  const prevImg = () => setCurrentImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  const handleTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStart.current - touchEnd.current > 50) nextImg();
    if (touchStart.current - touchEnd.current < -50) prevImg();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
      <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-3xl border-b border-white/5 py-3 md:py-5 px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-3">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black"><Zap size={18} className="fill-black" /></div>
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Sync<span className="text-emerald-500">PRO</span></h1>
         </div>
         <div className="relative flex-1 max-w-[400px] w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={14} />
            <input type="text" placeholder="Buscar activos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-6 text-[11px] text-white outline-none focus:border-white/20 transition-all"/>
         </div>
      </header>

      <main className="px-4 md:px-12 py-8">
         <div className="flex overflow-x-auto gap-2 mb-10 no-scrollbar pb-2">
            {categories.map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-neutral-500 border border-white/5 hover:text-white'}`}>{cat}</button>
            ))}
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {filteredProducts.map(p => <PublicProductCard key={p.id} p={p} onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }} />)}
         </div>
      </main>

      {selectedProduct && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
            <div className="bg-[#121212] border border-white/10 w-full max-w-[850px] rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-full max-h-[100dvh] md:max-h-[90vh] overflow-y-auto scrollbar-hide">
               <button onClick={() => setSelectedProduct(null)} className="fixed md:absolute top-4 right-4 z-[160] w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90"><X size={18}/></button>
               
               <div 
                 className="w-full md:w-[45%] bg-[#080808] p-4 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5 min-h-[35vh] md:min-h-auto"
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
               >
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden" key={currentImgIndex}>
                     <img src={allImages[currentImgIndex]} className="max-w-full max-h-[30vh] md:max-h-[50vh] object-contain drop-shadow-2xl rounded-2xl select-none animate-in fade-in duration-200" />
                  </div>
                  {allImages.length > 1 && (
                    <div className="flex gap-2 mt-4 pb-2">
                       {allImages.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(i); }} className={`w-2 h-2 rounded-full transition-all ${currentImgIndex === i ? 'bg-emerald-500 w-6' : 'bg-white/20'}`} />)}
                    </div>
                  )}
               </div>

               <div className="w-full md:w-[55%] p-6 md:p-10 flex flex-col justify-between">
                  <div className="space-y-6">
                     <div>
                        <span className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1.5 block">DETALLES DEL ACTIVO</span>
                        <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase leading-tight">{selectedProduct.nombre}</h2>
                        <p className="text-[10px] md:text-xs font-black text-white/40 uppercase tracking-[0.3em] mt-2">{selectedProduct.marca || 'Sovereign Core'}</p>
                     </div>

                     <div className="bg-white/[0.03] border border-white/5 p-4 md:p-6 rounded-[2rem] shadow-inner relative overflow-hidden group">
                        <p className="text-[7px] md:text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-2">Inversión Final</p>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex items-baseline gap-2">
                              <p className="text-3xl md:text-5xl font-mono text-white font-black tracking-tighter leading-none">{parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}</p>
                              <span className="text-[10px] font-black text-emerald-500">BS.</span>
                           </div>
                           {selectedProduct.precio_antes > selectedProduct.precio_venta && (
                              <div className="flex flex-col items-end">
                                 <span className="text-[6px] font-black text-rose-500/50 uppercase tracking-widest">Antes</span>
                                 <p className="text-xl md:text-3xl text-neutral-600 font-mono line-through font-black leading-none">{parseFloat(selectedProduct.precio_antes).toLocaleString()}</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 pb-20 md:pb-0">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                           <ShieldCheck size={16} className="text-emerald-500" />
                           <div><p className="text-[7px] font-black text-neutral-500 uppercase">Garantía</p><p className="text-[9px] font-black text-white">{selectedProduct.garantia || 'Consulte'}</p></div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                           <Truck size={16} className="text-emerald-500" />
                           <div><p className="text-[7px] font-black text-neutral-500 uppercase">Logística</p><p className="text-[9px] font-black text-white">{selectedProduct.tipo_envio || 'Estándar'}</p></div>
                        </div>
                     </div>
                  </div>

                  <div className="fixed md:relative bottom-0 left-0 w-full p-6 md:p-0 bg-[#121212] md:bg-transparent border-t md:border-t-0 border-white/5">
                     <button onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa: ${selectedProduct.nombre}`, '_blank')} className="w-full py-5 md:py-8 bg-emerald-500 text-black rounded-[2.2rem] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                        <WhatsAppIcon size={20} /> ORDENAR POR WHATSAPP
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default PublicCatalog;
