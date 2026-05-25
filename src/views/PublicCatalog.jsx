import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, Search, ChevronRight, ChevronLeft, X, 
  Truck, Zap, ShoppingCart, ShieldCheck, 
  CheckCircle, DollarSign, Sun, Moon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const WhatsAppIcon = ({ size = 24, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.117-1.605a11.793 11.793 0 005.932 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.417-8.413z"/>
  </svg>
);

const PublicProductCard = ({ p, onSelect, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const hasDiscount = p.precio_antes && p.precio_antes > p.precio_venta;
  const isAgotado = parseInt(p.stock_actual) === 0;
  
  return (
    <div 
      onClick={() => onSelect(p)}
      style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', height: '100%', transition: 'all 0.3s' }}
    >
      <div style={{ backgroundColor: isDark ? t.surface : t.inputBg, aspectRatio: '1/1', margin: 4, borderRadius: 10, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}` }}>
        {p.imagen ? (
          <img 
            src={p.imagen} 
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s', filter: isAgotado ? 'grayscale(1) opacity(0.3) blur(2px)' : 'none' }}
            alt={p.nombre}
          />
        ) : (
          <Package size={20} strokeWidth={1} color={isDark ? '#333' : '#bbb'} />
        )}

        {isAgotado ? (
           <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,0.4)', backdropFilter: 'blur(2px)' }}>
              <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>AGOTADO</span>
           </div>
        ) : (
           <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}>
              <span style={{ padding: '2px 8px', backgroundColor: t.accent, color: '#000', fontSize: 5, fontWeight: 900, borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <CheckCircle size={5} /> DISPONIBLE
              </span>
           </div>
        )}
      </div>

      <div style={{ padding: '8px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3 style={{ fontSize: 11, fontWeight: 900, color: t.text, lineHeight: '1.2', letterSpacing: '-0.02em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <p style={{ fontSize: 7, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.marca || 'Sovereign'}</p>
             <p style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.accent }}>
                {p.stock_actual} UDS
             </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             {hasDiscount && <p style={{ fontSize: 7, color: t.textDim, fontFamily: 'monospace', textDecoration: 'line-through', marginBottom: -2 }}>{parseFloat(p.precio_antes).toLocaleString()} BS.</p>}
             <p style={{ fontSize: 22, fontFamily: 'monospace', color: t.text, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
                {parseFloat(p.precio_venta || 0).toLocaleString()} <span style={{ fontSize: 8, color: t.textDim, marginLeft: 4 }}>BS.</span>
             </p>
          </div>
        </div>
        <button style={{ width: '100%', marginTop: 8, padding: '8px 12px', backgroundColor: t.accent, color: '#000', borderRadius: 8, fontWeight: 900, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
           <ShoppingCart size={10} /> COMPRAR
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
  const [isDark, setIsDark] = useState(true);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const t = useMemo(() => getTheme(isDark), [isDark]);
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
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text, fontFamily: 'sans-serif', transition: 'background-color 0.5s, color 0.5s' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 60, backgroundColor: isDark ? 'rgba(20,20,20,0.8)' : 'rgba(245,245,247,0.8)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${t.border}`, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, backgroundColor: t.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}><Zap size={16} /></div>
            <h1 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Sync<span style={{ color: t.accent }}>PRO</span></h1>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 300 }}>
               <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={14} />
               <input type="text" placeholder="Buscar activos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px 8px 36px', fontSize: 10, outline: 'none', color: t.text }} />
            </div>
            
            <button onClick={() => setIsDark(!isDark)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, color: t.text, fontWeight: 900, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}>
               {isDark ? <><Sun size={14}/> Día</> : <><Moon size={14}/> Noche</>}
            </button>
         </div>
      </header>

      <main style={{ padding: '24px 32px' }}>
         <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 24, paddingBottom: 8 }}>
            {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)} 
                 style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 20, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: activeCategory === cat ? t.accent : t.inputBg, color: activeCategory === cat ? '#000' : t.textMuted, border: activeCategory === cat ? 'none' : `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
               >
                 {cat}
               </button>
            ))}
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {filteredProducts.map(p => <PublicProductCard key={p.id} p={p} isDark={isDark} onSelect={(prod) => { setSelectedProduct(prod); setCurrentImgIndex(0); }} />)}
         </div>
      </main>

      {selectedProduct && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: t.overlay, backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isDark ? 24 : 24 }}>
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, width: '100%', maxWidth: 850, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', flexDirection: 'row', maxHeight: '90vh', overflowY: 'auto' }}>
               <button onClick={() => setSelectedProduct(null)} style={{ position: 'fixed', top: 16, right: 16, zIndex: 160, width: 36, height: 36, backgroundColor: t.accent, color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}><X size={16}/></button>
                
               <div 
                 style={{ width: '45%', backgroundColor: isDark ? t.surface : t.inputBg, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRight: `1px solid ${t.border}`, minHeight: '35vh' }}
                 onTouchStart={handleTouchStart}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleTouchEnd}
               >
                  <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     <img src={allImages[currentImgIndex]} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 12 }} />
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); prevImg(); }} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, color: t.text, cursor: 'pointer', zIndex: 20 }}><ChevronLeft size={18}/></button>
                      <button onClick={(e) => { e.stopPropagation(); nextImg(); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, color: t.text, cursor: 'pointer', zIndex: 20 }}><ChevronRight size={18}/></button>
                    </>
                  )}
                  {allImages.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingBottom: 4, zIndex: 20 }}>
                       {allImages.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(i); }} style={{ width: currentImgIndex === i ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: currentImgIndex === i ? t.accent : t.textDim, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />)}
                    </div>
                  )}
               </div>

               <div style={{ width: '55%', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                     <div>
                        <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: 4, display: 'block' }}>DETALLES DEL ACTIVO</span>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: t.text, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: '1.1' }}>{selectedProduct.nombre}</h2>
                        <p style={{ fontSize: 10, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: 6 }}>{selectedProduct.marca || 'Sovereign Core'}</p>
                     </div>

                     <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, padding: 20, borderRadius: 16 }}>
                        <p style={{ fontSize: 7, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Inversión Final</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                           <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <p style={{ fontSize: 40, fontFamily: 'monospace', color: t.text, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>{parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}</p>
                              <span style={{ fontSize: 9, fontWeight: 900, color: t.accent }}>BS.</span>
                           </div>
                           {selectedProduct.precio_antes > selectedProduct.precio_venta && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                 <span style={{ fontSize: 5, fontWeight: 900, color: t.danger, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Antes</span>
                                 <p style={{ fontSize: 18, color: t.textDim, fontFamily: 'monospace', textDecoration: 'line-through', fontWeight: 900, lineHeight: 1 }}>{parseFloat(selectedProduct.precio_antes).toLocaleString()}</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ backgroundColor: t.inputBg, padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                           <ShieldCheck size={14} color={t.accent} />
                           <div><p style={{ fontSize: 6, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>Garantía</p><p style={{ fontSize: 8, fontWeight: 900, color: t.text }}>{selectedProduct.garantia || 'Consulte'}</p></div>
                        </div>
                        <div style={{ backgroundColor: t.inputBg, padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                           <Truck size={14} color={t.accent} />
                           <div><p style={{ fontSize: 6, fontWeight: 900, color: t.textDim, textTransform: 'uppercase' }}>Logística</p><p style={{ fontSize: 8, fontWeight: 900, color: t.text }}>{selectedProduct.tipo_envio || 'Estándar'}</p></div>
                        </div>
                     </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                     <button onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa: ${selectedProduct.nombre}`, '_blank')} style={{ width: '100%', padding: '16px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 14, fontWeight: 900, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.2em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
                        <WhatsAppIcon size={18} color="#000" /> ORDENAR POR WHATSAPP
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
