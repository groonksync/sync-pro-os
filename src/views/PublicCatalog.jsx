import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Search, X, ShoppingCart, CheckCircle, 
  Home, Music, Smartphone, LayoutGrid, Star, ChevronLeft, ChevronRight,
  TrendingUp, Tag, Plus, Minus, Trash2, ArrowRight, Image as ImageIcon,
  Box as BoxIcon, Video, Zap, Briefcase, Sparkles, Sun, Moon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';

const parseWhatsAppMarkdown = (text) => {
  if (!text) return '';
  // Escapar HTML básico para prevenir XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Reemplazar *negrita* por <strong>negrita</strong>
  html = html.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');
  
  // Reemplazar _cursiva_ por <em>cursiva</em>
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Reemplazar ~tachado~ por <del>tachado</del>
  html = html.replace(/~([^~]+)~/g, '<del>$1</del>');
  
  // Reemplazar saltos de línea por <br />
  html = html.replace(/\n/g, '<br />');
  
  return html;
};

const getCategoryIcon = (category) => {
  const catLower = category?.toLowerCase() || '';
  if (catLower.includes('computadoras') || catLower.includes('pc') || catLower.includes('laptop')) return BoxIcon;
  if (catLower.includes('audio') || catLower.includes('música') || catLower.includes('micrófono')) return Music;
  if (catLower.includes('celular') || catLower.includes('teléfono') || catLower.includes('tablet') || catLower.includes('accesorio')) return Smartphone;
  if (catLower.includes('cámara') || catLower.includes('dron') || catLower.includes('seguridad') || catLower.includes('video')) return Video;
  if (catLower.includes('electrónica') || catLower.includes('electrodoméstico') || catLower.includes('gamer') || catLower.includes('videojuego') || catLower.includes('fuente') || catLower.includes('forza')) return Zap;
  if (catLower.includes('herramienta') || catLower.includes('construcción') || catLower.includes('material')) return Briefcase;
  if (catLower.includes('hogar') || catLower.includes('cocina') || catLower.includes('decoración') || catLower.includes('adorno')) return Sparkles;
  return Tag;
};


const Toast = ({ message, type = 'success', show, onClose, t }) => {
  useEffect(() => {
    if (show) { const timer = setTimeout(() => onClose(), 3000); return () => clearTimeout(timer); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, animation: 'slideIn 0.3s ease-out' }}>
      <div style={{ 
        backgroundColor: type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)', 
        backdropFilter: 'blur(12px)', 
        border: `1px solid rgba(255,255,255,0.1)`, 
        padding: '12px 24px', 
        borderRadius: 12, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12 
      }}>
        <CheckCircle size={16} color="#fff" />
        <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{message}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, t, addToCart, onOpenDetails, WHATSAPP_NUMBER, isMobile }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const cardImages = useMemo(() => {
    const list = [];
    if (p.imagen) list.push(p.imagen);
    if (Array.isArray(p.imagenes)) {
      p.imagenes.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [p]);

  const stock = parseInt(p.stock_actual || 0);
  const displayMode = p.metadata?.stock_display_mode || 'auto';
  
  const isUnlimited = displayMode === 'force_disponible_sin_stock';
  const isAgotado = (displayMode === 'force_agotado' || (displayMode === 'auto' && stock <= 0)) && !isUnlimited && displayMode !== 'force_lanzamiento';
  const isLow = displayMode === 'force_por_agotarse' || (displayMode === 'auto' && stock > 0 && stock <= 5 && !isUnlimited && displayMode !== 'force_lanzamiento');

  const isOferta = !!(p.es_oferta || p.metadata?.es_oferta);
  const isCombo = !!(p.es_combo || p.metadata?.es_combo);
  const precioOferta = parseFloat(p.precio_oferta || p.metadata?.precio_oferta) || 0;
  const productosRegalo = p.productos_regalo || p.metadata?.productos_regalo || '';

  const precioVentaFinal = isOferta && precioOferta > 0 ? precioOferta : parseFloat(p.precio_venta || 0);
  const precioAntesVal = isOferta && precioOferta > 0 ? parseFloat(p.precio_venta || 0) : parseFloat(p.precio_antes || 0);
  const hasDiscount = precioAntesVal > precioVentaFinal;

  // Percentage discount calculate
  const discountPercent = hasDiscount ? Math.round(((precioAntesVal - precioVentaFinal) / precioAntesVal) * 100) : 0;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardImages.length > 1) {
      setActiveImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveImageIndex(0);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (cardImages.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % cardImages.length);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (cardImages.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
    }
  };

  const handleSelectDot = (e, index) => {
    e.stopPropagation();
    setActiveImageIndex(index);
  };

  return (
    <div 
      onClick={() => onOpenDetails(p)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="product-grid-card"
      style={{ 
        backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: isMobile ? 16 : 24, padding: isMobile ? 12 : 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: 'pointer', position: 'relative', overflow: 'hidden'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 8 : 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: t.inputBg, color: t.textMuted, padding: '3px 8px', borderRadius: 20 }}>
              {p.categoria || 'General'}
            </span>
            {isOferta && (
              <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: 20 }}>
                OFERTA
              </span>
            )}
            {isCombo && (
              <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '3px 8px', borderRadius: 20 }}>
                COMBO
              </span>
            )}
          </div>
          {isAgotado ? (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{"Sin Stock"}</span>
          ) : displayMode === 'force_lanzamiento' ? (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{"Muy Pronto"}</span>
          ) : isUnlimited ? (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{"Disponible"}</span>
          ) : displayMode === 'force_por_agotarse' ? (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{"Últimas uds"}</span>
          ) : isLow ? (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stock} Disp.</span>
          ) : (
            <span style={{ fontSize: isMobile ? 6 : 7, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stock} uds</span>
          )}
        </div>

        {/* Image container */}
        <div style={{ height: isMobile ? 140 : 250, borderRadius: 12, backgroundColor: t.isDark ? t.bg : '#ffffff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, position: 'relative' }}>
          {/* Eye-catching badge overlays */}
          {!isAgotado && isOferta && discountPercent > 0 && (
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, backgroundColor: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 950, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}>
              -{discountPercent}% OFF
            </div>
          )}
          {!isAgotado && isCombo && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, backgroundColor: '#3b82f6', color: '#fff', fontSize: 8, fontWeight: 950, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
              COMBO PACK
            </div>
          )}

          {/* Bottom overlays without card blur */}
          {isAgotado ? (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: isMobile ? 7 : 9,
              fontWeight: 900,
              padding: '5px 0',
              textAlign: 'center',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 5
            }}>
              {"\u26a0\ufe0f Agotado / Sin Stock"}
            </div>
          ) : displayMode === 'force_lanzamiento' ? (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              color: '#ffffff',
              fontSize: isMobile ? 7 : 9,
              fontWeight: 900,
              padding: '5px 0',
              textAlign: 'center',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 5
            }}>
              {"\ud83d\ude80 Pr\u00f3ximo Lanzamiento"}
            </div>
          ) : (!isAgotado && isLow) ? (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(245, 158, 11, 0.95)',
              color: '#000000',
              fontSize: isMobile ? 7 : 9,
              fontWeight: 900,
              padding: '5px 0',
              textAlign: 'center',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 5
            }}>
              {"\u26a0\ufe0f \u00a1Por Agotarse!"}
            </div>
          ) : null}

          {cardImages.length > 0 ? (
            <img 
              src={cardImages[activeImageIndex]} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: isMobile ? 6 : 12 }} 
              alt={p.nombre} 
              loading="lazy"
              decoding="async"
            />
          ) : (
            <ImageIcon size={isMobile ? 20 : 32} style={{ color: t.textDim }} />
          )}

          {!isAgotado && cardImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                  width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)',
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: isHovered || isMobile ? 1 : 0, transition: 'opacity 0.2s', zIndex: 5
                }}
              >
                <ChevronLeft size={10} />
              </button>
              <button
                onClick={handleNextImage}
                style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)',
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: isHovered || isMobile ? 1 : 0, transition: 'opacity 0.2s', zIndex: 5
                }}
              >
                <ChevronRight size={10} />
              </button>
            </>
          )}

          {!isAgotado && cardImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 5 }}>
              {cardImages.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => handleSelectDot(e, idx)}
                  style={{
                    width: 4, height: 4, borderRadius: '50%',
                    backgroundColor: idx === activeImageIndex ? t.accent : 'rgba(0,0,0,0.25)',
                    cursor: 'pointer', border: idx === activeImageIndex ? 'none' : '1px solid rgba(255,255,255,0.4)',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h3 style={{ 
          fontSize: isMobile ? 11 : 13, 
          fontWeight: 900, 
          color: t.text, 
          textTransform: 'uppercase', 
          letterSpacing: '-0.02em', 
          marginTop: isMobile ? 10 : 16, 
          marginBottom: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          height: '2.8em',
          lineHeight: '1.4em'
        }} title={String(p.nombre || '').toUpperCase()}>
          {String(p.nombre || '').toUpperCase()}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: isMobile ? 4 : 8 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={isMobile ? 8 : 11} fill={star <= Math.round(p.metadata?.rating || 4.5) ? t.accent : 'none'} stroke={star <= Math.round(p.metadata?.rating || 4.5) ? t.accent : t.textMuted} />
            ))}
          </div>
          <span style={{ fontSize: isMobile ? 8 : 9, fontWeight: 900, color: t.textMuted }}>{p.metadata?.rating || 4.5}</span>
        </div>

        {/* Combo Gifts List */}
        {isCombo && productosRegalo && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px 10px', borderRadius: 8, marginBottom: 12, fontSize: 9, color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            🎁 Regalo: {productosRegalo}
          </div>
        )}
      </div>

      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          borderTop: `1px solid ${t.border}`, 
          paddingTop: 10, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: isMobile ? 'stretch' : 'center', 
          justifyContent: 'space-between',
          gap: isMobile ? 8 : 0
        }}
      >
        <div>
          {hasDiscount && (
            <span style={{ fontSize: isMobile ? 7 : 8, fontFamily: 'monospace', textDecoration: 'line-through', color: t.textMuted, display: 'block', marginBottom: -2 }}>
              {precioAntesVal.toLocaleString()} BS.
            </span>
          )}
          <span style={{ fontSize: isMobile ? 16 : 20, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>
            {precioVentaFinal.toLocaleString()} <span style={{ fontSize: isMobile ? 7 : 8, color: t.textMuted }}>BS.</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, width: isMobile ? '100%' : 'auto' }}>
          {displayMode === 'force_lanzamiento' ? (
            <button 
              disabled
              style={{ 
                width: '100%',
                padding: isMobile ? '6px 8px' : '8px 12px', borderRadius: 8, backgroundColor: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.border}`, color: t.textDim, fontSize: isMobile ? 7 : 8, fontWeight: 900, 
                textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'not-allowed', textAlign: 'center'
              }}
            >
              {"Pr\u00f3ximamente"}
            </button>
          ) : (
            <>
              <button 
                onClick={() => addToCart(p)}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '6px 8px' : '8px 12px', borderRadius: 8, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontSize: isMobile ? 7 : 8, fontWeight: 900, 
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}
              >
                + Carrito
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa comprar: ${p.nombre}`, '_blank')}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '6px 8px' : '8px 14px', borderRadius: 8, backgroundColor: t.accent, border: 'none', color: '#000', fontSize: isMobile ? 7 : 8, fontWeight: 900, 
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}
              >
                Comprar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubfilter, setActiveSubfilter] = useState('Todos los ítems');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const carruselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carruselRef.current) {
      const scrollAmount = 300;
      carruselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WhatsApp Pre-visualization States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [pedidoId, setPedidoId] = useState('');

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mediaTab, setMediaTab] = useState('images'); // 'images' or 'video'

  const uniqueCategories = useMemo(() => {
    const list = new Set();
    productos.forEach(p => {
      if (p.categoria) list.add(p.categoria);
    });
    return Array.from(list).sort();
  }, [productos]);

  const featuredProducts = useMemo(() => {
    return productos.filter(p => p.metadata?.is_featured === true);
  }, [productos]);

  const t = useMemo(() => {
    const baseTheme = getTheme(isDark);
    return {
      ...baseTheme,
      accent: '#10b981',
      accentSoft: 'rgba(16, 185, 129, 0.08)',
      accentHover: '#059669',
      accentGlow: 'rgba(16, 185, 129, 0.15)',
    };
  }, [isDark]);
  const WHATSAPP_NUMBER = "59169109766";

  useEffect(() => { 
    fetchProducts(); 
    document.body.style.setProperty('overflow', 'auto', 'important');
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos(data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const getProductRating = (p) => p.metadata?.rating || 4.5;
  const getVideoUrl = (p) => p.video_url || p.metadata?.video_url || '';

  // Get Embed Link
  const getEmbedVideoUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    const vimeoReg = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = productos;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.nombre?.toLowerCase().includes(searchLower) || 
        p.marca?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.codigo?.toLowerCase().includes(searchLower)
      );
    }

    if (activeCategory !== 'Todos') {
      result = result.filter(p => p.categoria?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (activeSubfilter === 'Novedades') {
      result = result.filter(p => p.metadata?.is_new === true);
    } else if (activeSubfilter === 'Más Vendidos') {
      result = result.filter(p => p.metadata?.is_bestseller === true || p.stock_vendido > 10);
    } else if (activeSubfilter === 'En Descuento') {
      result = result.filter(p => p.precio_antes && p.precio_antes > p.precio_venta);
    }

    // Sort by category order when viewing "Todos" to keep layout organized
    if (activeCategory === 'Todos') {
      const categoryOrder = [
        'computadoras',
        'laptop',
        'tablet',
        'gamer',
        'celulares',
        'audio',
        'drones',
        'electrodomésticos',
        'cocina',
        'hogar',
        'herramientas'
      ];
      
      result = [...result].sort((a, b) => {
        const catA = (a.categoria || '').toLowerCase();
        const catB = (b.categoria || '').toLowerCase();
        
        let indexA = categoryOrder.findIndex(c => catA.includes(c));
        let indexB = categoryOrder.findIndex(c => catB.includes(c));
        
        if (indexA === -1) indexA = 9999;
        if (indexB === -1) indexB = 9999;
        
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        
        const catCompare = catA.localeCompare(catB);
        if (catCompare !== 0) return catCompare;
        
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    }

    return result;
  }, [productos, searchTerm, activeCategory, activeSubfilter]);

  const categoryCounts = useMemo(() => {
    const counts = { Todos: productos.length };
    productos.forEach(p => {
      const cat = p.categoria || 'Otros';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [productos]);

  // Cart operations
  const addToCart = (product) => {
    const stockLimit = parseInt(product.stock_actual || 0);
    const displayMode = product.metadata?.stock_display_mode || 'auto';
    const isUnlimited = displayMode === 'force_disponible_sin_stock';
    const isAgotado = (displayMode === 'force_agotado' || (displayMode === 'auto' && stockLimit <= 0)) && !isUnlimited && displayMode !== 'force_lanzamiento';

    if (isAgotado || displayMode === 'force_lanzamiento') {
      setToast({ show: true, message: 'Producto no disponible para compra', type: 'error' });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (!isUnlimited && displayMode !== 'force_por_agotarse' && existing.quantity >= stockLimit) {
          setToast({ show: true, message: 'No hay más unidades en stock', type: 'error' });
          return prev;
        }
        setToast({ show: true, message: 'Cantidad aumentada en el carrito', type: 'success' });
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      setToast({ show: true, message: 'Añadido al carrito', type: 'success' });
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, amount) => {
    const product = productos.find(p => p.id === id);
    const stockLimit = parseInt(product?.stock_actual || 0);
    const displayMode = product?.metadata?.stock_display_mode || 'auto';

    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + amount;
          if (newQty <= 0) return null;
          const isUnlimited = displayMode === 'force_disponible_sin_stock';
          if (!isUnlimited && displayMode !== 'force_por_agotarse' && newQty > stockLimit) {
            setToast({ show: true, message: 'Excede el stock disponible', type: 'error' });
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    setToast({ show: true, message: 'Eliminado del carrito', type: 'success' });
  };

  const getItemFinalPrice = (item) => {
    const isOferta = !!(item.es_oferta || item.metadata?.es_oferta);
    if (isOferta) {
      const ofertaPrice = parseFloat(item.precio_oferta || item.metadata?.precio_oferta);
      if (ofertaPrice > 0) return ofertaPrice;
    }
    return parseFloat(item.precio_venta) || 0;
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (getItemFinalPrice(item) * item.quantity), 0), [cart]);

  // WhatsApp Checkout integration
  const checkoutMessage = useMemo(() => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let text = `🛒 *NUEVO PEDIDO — SYNCPRO CATALOG*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔖 *Pedido:* *${pedidoId || 'Generando...'}*\n`;
    text += `📅 *Fecha:* ${fecha} — ${hora}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (clientName.trim()) {
      text += `👤 *Cliente:* ${clientName.trim()}\n`;
    }
    if (clientAddress.trim()) {
      text += `📍 *Dirección de entrega:* ${clientAddress.trim()}\n`;
    }
    text += `💳 *Método de Pago:* ${paymentMethod}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📦 *DETALLE DE PRODUCTOS (${cart.length} ítem${cart.length !== 1 ? 's' : ''})*\n\n`;
    cart.forEach((item, index) => {
      const itemSku = item.sku || item.codigo || 'S/C';
      const itemPrice = getItemFinalPrice(item);
      const itemTotal = itemPrice * item.quantity;
      const categoria = item.categoria || 'General';
      text += `*${index + 1}.* 🏷️ *${String(item.nombre).toUpperCase()}*\n`;
      text += `   📂 Categoría: ${categoria}\n`;
      text += `   🔢 Código/SKU: \`${itemSku}\`\n`;
      text += `   📦 Cantidad: *${item.quantity}* ud(s)\n`;
      text += `   💰 Precio unitario: *${itemPrice.toLocaleString()} BS.*\n`;
      text += `   🧾 Subtotal: *${itemTotal.toLocaleString()} BS.*\n`;
      if (item.imagenes && item.imagenes[0]) {
        text += `   🖼️ Ver producto: ${item.imagenes[0]}\n`;
      }
      text += `\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 *TOTAL DEL PEDIDO: ${cartTotal.toLocaleString()} BS.*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Pedido generado automáticamente desde SyncPro Catalog_`;
    return text;
  }, [cart, cartTotal, clientName, clientAddress, paymentMethod, pedidoId]);

  const handleWhatsAppCheckout = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const fechaStr = now.toISOString().split('T')[0];

      // Insert pending sale to Supabase
      const newVenta = {
        id: crypto.randomUUID(),
        fecha: fechaStr,
        producto: `Pedido ${pedidoId} — ${clientName.trim() || 'Cliente Catálogo'}`,
        categoria: 'Catálogo',
        plataforma: 'WhatsApp',
        monto: parseFloat(cartTotal),
        estado: 'Pendiente',
        notas: `Envío a: ${clientAddress.trim() || 'No especificado'}. Pago: ${paymentMethod}`,
        metadata: {
          pedidoCode: pedidoId,
          clientName: clientName.trim(),
          clientAddress: clientAddress.trim(),
          paymentMethod: paymentMethod,
          cart: cart.map(item => ({
            id: item.id,
            nombre: item.nombre,
            quantity: item.quantity,
            precio_venta: getItemFinalPrice(item),
            precio_original: parseFloat(item.precio_venta) || 0,
            precio_costo: parseFloat(item.precio_costo) || 0,
            sku: item.sku || item.codigo || ''
          }))
        }
      };

      const { error } = await supabase.from('ventas').insert(newVenta);
      if (error) throw error;

      const encodedText = encodeURIComponent(checkoutMessage);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;

      setToast({ show: true, message: 'Pedido registrado como pendiente. Abriendo WhatsApp...', type: 'success' });
      setCart([]);
      setIsCheckoutOpen(false);
      setClientName('');
      setClientAddress('');
      setPaymentMethod('Efectivo');
      await fetchProducts();
      window.open(url, '_blank');
    } catch (e) {
      setToast({ show: true, message: 'Error al procesar la compra', type: 'error' });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Product secondary media images array
  const allImages = useMemo(() => {
    if (!selectedProduct) return [];
    const imgs = [];
    if (selectedProduct.imagen) imgs.push(selectedProduct.imagen);
    if (Array.isArray(selectedProduct.imagenes)) {
      selectedProduct.imagenes.forEach(img => {
        if (img && !imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs;
  }, [selectedProduct]);

  return (
    <div 
      className={isDark ? '' : 'light-mode'}
      style={{ 
        height: '100%', minHeight: '100vh', width: '100%', backgroundColor: t.bg, color: t.text, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", transition: 'background-color 0.4s', overflowX: 'hidden', overflowY: 'auto',
        paddingBottom: isMobile ? 'calc(90px + env(safe-area-inset-bottom))' : 0
      }}
    >
      <Toast message={toast.message} type={toast.type} show={toast.show} t={t} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* TOP CONTROL PANEL */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        padding: isMobile ? '16px 20px' : '24px 32px', 
        borderBottom: `1px solid ${t.border}`,
        gap: isMobile ? 12 : 0,
        backgroundColor: t.panel
      }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
            {/* Theme Toggle for Mobile */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textDim }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {/* Cart for Mobile */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.accent }}
            >
              <ShoppingCart size={14} />
              {cartCount > 0 && (
                <span className="animate-bounce" style={{ position: 'absolute', top: -3, right: -3, backgroundColor: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 900, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Search Input Centralized */}
        <div 
          className="catalog-search-container"
          style={{ 
            position: 'relative', 
            width: isMobile ? '100%' : '50%', 
            minWidth: isMobile ? 'auto' : 320,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Search size={16} style={{ position: 'absolute', left: 16, color: t.textDim, pointerEvents: 'none', zIndex: 10 }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU, marca..." 
            className="catalog-search-input-field"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 16, background: 'none', border: 'none', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Controls: Cart & Theme Toggles (Desktop only) */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textDim, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              title={isDark ? "Activar Modo Día" : "Activar Modo Noche"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.accent, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="animate-bounce" style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.bg}` }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '12px' : '32px' }}>
        {/* SIDEBAR FILTROS (Desktop only) */}
        {!isMobile && (
          <aside style={{ width: 260, paddingRight: 32, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0 }}>
            {/* Categorías */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.textMuted, margin: 0 }}>Categorías</h4>
                {uniqueCategories.length > 7 && (
                  <button 
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    style={{ background: 'none', border: 'none', color: t.accent, fontSize: 8, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', padding: 0 }}
                  >
                    {showAllCategories ? 'Menos' : 'Más'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button 
                  onClick={() => setActiveCategory('Todos')}
                  className={`catalog-category-btn ${activeCategory === 'Todos' ? 'active' : ''}`}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    backgroundColor: activeCategory === 'Todos' ? t.accentSoft : 'transparent', color: activeCategory === 'Todos' ? t.accent : t.textDim, width: '100%', textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LayoutGrid size={16} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Todos</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: activeCategory === 'Todos' ? t.accent : t.inputBg, color: activeCategory === 'Todos' ? '#000' : t.textMuted, padding: '2px 8px', borderRadius: 20 }}>
                    {productos.length}
                  </span>
                </button>

                {uniqueCategories.slice(0, showAllCategories ? undefined : 7).map(catName => {
                  const Icon = getCategoryIcon(catName);
                  const isActive = activeCategory === catName;
                  const count = categoryCounts[catName] || 0;
                  return (
                    <button 
                      key={catName}
                      onClick={() => setActiveCategory(catName)}
                      className={`catalog-category-btn ${isActive ? 'active' : ''}`}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        backgroundColor: isActive ? t.accentSoft : 'transparent', color: isActive ? t.accent : t.textDim, width: '100%', textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{catName}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: isActive ? t.accent : t.inputBg, color: isActive ? '#000' : t.textMuted, padding: '2px 8px', borderRadius: 20 }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subfiltros de Estado */}
            <div>
              <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.textMuted, marginBottom: 16 }}>Subfiltros Estado</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Todos los ítems', 'Novedades', 'Más Vendidos', 'En Descuento'].map(sub => {
                  const isActive = activeSubfilter === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubfilter(sub)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        backgroundColor: 'transparent', color: isActive ? t.accent : t.textMuted, transition: 'all 0.2s', width: '100%', textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: isActive ? 900 : 500 }}>{sub}</span>
                      <ArrowRight size={12} style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s', color: t.accent }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* PRODUCTS GRID SECTION */}
        <section style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Mobile Horizontal Category Slider */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 4px 16px 4px', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
              <button
                onClick={() => setActiveCategory('Todos')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${activeCategory === 'Todos' ? t.accent : t.border}`,
                  backgroundColor: activeCategory === 'Todos' ? t.accentSoft : t.panel,
                  color: activeCategory === 'Todos' ? t.accent : t.textDim,
                  fontSize: 10,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Todos ({productos.length})
              </button>
              {uniqueCategories.map(catName => {
                const count = categoryCounts[catName] || 0;
                const isActive = activeCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => setActiveCategory(catName)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: `1px solid ${isActive ? t.accent : t.border}`,
                      backgroundColor: isActive ? t.accentSoft : t.panel,
                      color: isActive ? t.accent : t.textDim,
                      fontSize: 10,
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {catName} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Productos Destacados Slider */}
          {!loading && featuredProducts.length > 0 && (
            <div
              style={{ marginBottom: 24, padding: isMobile ? '0 4px' : '0' }}
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Star size={13} style={{ color: '#fbbf24' }} fill="#fbbf24" />
                <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.text, margin: 0 }}>
                  {"Productos Destacados"}
                </h4>
              </div>
              <div style={{ position: 'relative', padding: !isMobile ? '0 28px' : '0' }}>
                {!isMobile && isCarouselHovered && (
                  <>
                    <button
                      onClick={() => scrollCarousel('left')}
                      aria-label="Anterior"
                      style={{
                        position: 'absolute',
                        left: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backgroundColor: t.isDark ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        color: t.text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      className="carousel-nav-btn"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => scrollCarousel('right')}
                      aria-label="Siguiente"
                      style={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backgroundColor: t.isDark ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        color: t.text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      className="carousel-nav-btn"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                <div
                  ref={carruselRef}
                  style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    paddingBottom: 12,
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  className="hide-scrollbar"
                >
                  {featuredProducts.map(p => {
                    const isProdOferta = !!(p.es_oferta || p.metadata?.es_oferta);
                    const pOferta = parseFloat(p.precio_oferta || p.metadata?.precio_oferta) || 0;
                    const finalPriceVal = isProdOferta && pOferta > 0 ? pOferta : parseFloat(p.precio_venta || 0);
                    const prodImages = [];
                    if (p.imagen) prodImages.push(p.imagen);
                    if (Array.isArray(p.imagenes)) {
                      p.imagenes.forEach(img => { if (img && !prodImages.includes(img)) prodImages.push(img); });
                    }

                    return (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setSelectedImageIndex(0); setMediaTab('images'); }}
                        className="product-featured-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 10,
                          borderRadius: 14,
                          backgroundColor: t.panel,
                          border: `1px solid ${t.borderLight}`,
                          minWidth: isMobile ? '220px' : '260px',
                          maxWidth: isMobile ? '220px' : '260px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: isDark ? t.bg : '#ffffff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, flexShrink: 0, padding: 4 }}>
                          {prodImages.length > 0 ? (
                            <img
                              src={prodImages[0]}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              alt={p.nombre}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ImageIcon size={14} style={{ color: t.textDim }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: t.text, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3em', height: '2.6em', letterSpacing: '0.03em' }}>{p.nombre}</span>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>{finalPriceVal.toLocaleString()} <span style={{ fontSize: 7, color: t.textMuted }}>BS.</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: t.textMuted }}>Cargando catálogo...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', opacity: 0.5 }}>
              <Package size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sin resultados en esta categoría</p>
            </div>
          ) : (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: isMobile ? 12 : 20 
              }}>
                {filteredProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    p={p} 
                    t={t} 
                    addToCart={addToCart} 
                    onOpenDetails={(prod) => { setSelectedProduct(prod); setSelectedImageIndex(0); setMediaTab('images'); }} 
                    WHATSAPP_NUMBER={WHATSAPP_NUMBER}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* DETAIL MODAL WITH LARGE IMAGE GALLERY AND EMBEDDED VIDEOS */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 740, borderRadius: isMobile ? 18 : 28, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 16px' : '20px 28px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Detalles del Producto</span>
              <button 
                onClick={() => setSelectedProduct(null)} 
                style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              
              {/* Media viewer on top (fully occupying width) */}
              <div style={{ position: 'relative', width: '100%', height: isMobile ? 220 : 320, backgroundColor: isDark ? t.bg : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
                {mediaTab === 'video' && getVideoUrl(selectedProduct) ? (
                  <iframe 
                    src={getEmbedVideoUrl(getVideoUrl(selectedProduct))}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedProduct.nombre}
                  />
                ) : allImages.length > 0 ? (
                  <img 
                    src={allImages[selectedImageIndex]} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    alt={selectedProduct.nombre} 
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <ImageIcon size={60} style={{ color: t.textDim }} />
                )}

                {/* Media tabs (Imágenes / Video) — clean toggle pill */}
                {getVideoUrl(selectedProduct) && (
                  <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', backgroundColor: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 3, gap: 2 }}>
                    <button 
                      onClick={() => setMediaTab('images')}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 9, fontWeight: 900, border: 'none', cursor: 'pointer',
                        backgroundColor: mediaTab === 'images' ? '#fff' : 'transparent',
                        color: mediaTab === 'images' ? '#000' : 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 5
                      }}
                    >
                      📷 Imágenes
                    </button>
                    <button 
                      onClick={() => setMediaTab('video')}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 9, fontWeight: 900, border: 'none', cursor: 'pointer',
                        backgroundColor: mediaTab === 'video' ? t.accent : 'transparent',
                        color: mediaTab === 'video' ? '#000' : 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 5
                      }}
                    >
                      ▶ Ver Video
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Selector (Only shown in Images tab) */}
              {mediaTab === 'images' && allImages.length > 1 && (
                <div style={{ 
                  display: 'flex', 
                  gap: 10, 
                  padding: isMobile ? '12px 16px' : '16px 28px', 
                  overflowX: 'auto', 
                  backgroundColor: t.inputBg, 
                  borderBottom: `1px solid ${t.border}`,
                  flexShrink: 0 
                }}>
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{ 
                        width: isMobile ? 50 : 60, 
                        height: isMobile ? 50 : 60, 
                        borderRadius: 8, 
                        border: `2px solid ${selectedImageIndex === idx ? t.accent : t.border}`, 
                        overflow: 'hidden', 
                        padding: 0, 
                        cursor: 'pointer', 
                        flexShrink: 0,
                        backgroundColor: isDark ? t.bg : '#ffffff',
                        transition: 'border-color 0.2s, transform 0.1s'
                      }}
                    >
                      <img src={img} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Text Description Box */}
              <div style={{ padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
                
                {/* Title & Brand */}
                <div>
                  <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
                    {selectedProduct.nombre}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginTop: 8, gap: isMobile ? 4 : 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Marca: {selectedProduct.marca || 'Sovereign'}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      SKU/Código: {selectedProduct.sku || selectedProduct.codigo || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                {(() => {
                  const isOferta = !!(selectedProduct.es_oferta || selectedProduct.metadata?.es_oferta);
                  const isCombo = !!(selectedProduct.es_combo || selectedProduct.metadata?.es_combo);
                  const precioOferta = parseFloat(selectedProduct.precio_oferta || selectedProduct.metadata?.precio_oferta) || 0;
                  const productosRegalo = selectedProduct.productos_regalo || selectedProduct.metadata?.productos_regalo || '';
                  
                  const precioVentaFinal = isOferta && precioOferta > 0 ? precioOferta : parseFloat(selectedProduct.precio_venta || 0);
                  const precioAntesVal = isOferta && precioOferta > 0 ? parseFloat(selectedProduct.precio_venta || 0) : parseFloat(selectedProduct.precio_antes || 0);
                  const hasDiscount = precioAntesVal > precioVentaFinal;

                  return (
                    <>
                      {isCombo && productosRegalo && (
                        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 18px', borderRadius: 14, fontSize: 10, color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>
                          🎁 COMBO PACK — REGALO INCLUIDO:
                          <div style={{ color: '#fff', fontSize: 11, marginTop: 4, fontWeight: 900 }}>{productosRegalo}</div>
                        </div>
                      )}

                      <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: isMobile ? 14 : 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {isOferta ? 'Precio de Oferta' : 'Precio Público'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: isMobile ? 20 : 24, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>
                              {precioVentaFinal.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 900, color: t.accent }}>BS.</span>
                          </div>
                        </div>
                        {hasDiscount && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Antes</span>
                            <p style={{ fontSize: isMobile ? 14 : 18, fontFamily: 'monospace', textDecoration: 'line-through', color: t.textMuted, margin: '4px 0 0 0' }}>
                              {precioAntesVal.toLocaleString()} BS.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Info parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 8 : 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: t.inputBg, padding: 14, borderRadius: 14, border: `1px solid ${t.border}` }}>
                    <Star size={16} style={{ color: t.accent }} fill={t.accent} />
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', margin: 0 }}>Garantía</p>
                      <p style={{ fontSize: 10, fontWeight: 900, color: t.text, margin: '2px 0 0 0' }}>{selectedProduct.garantia || 'Consulte'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: t.inputBg, padding: 14, borderRadius: 14, border: `1px solid ${t.border}` }}>
                    <Tag size={16} style={{ color: t.accent }} />
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', margin: 0 }}>Envío / Logística</p>
                      <p style={{ fontSize: 10, fontWeight: 900, color: t.text, margin: '2px 0 0 0' }}>{selectedProduct.tipo_envio || 'Estándar'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(selectedProduct.descripcion || selectedProduct.ficha_tecnica) && (
                  <div>
                    <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: t.textMuted, letterSpacing: '0.1em', marginBottom: 8 }}>Descripción del Producto</h4>
                    <p 
                      style={{ fontSize: 11, color: t.textDim, lineHeight: '1.6', margin: 0 }}
                      dangerouslySetInnerHTML={{ __html: parseWhatsAppMarkdown(selectedProduct.descripcion || selectedProduct.ficha_tecnica || '') }}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Footer actions */}
            <div style={{ padding: isMobile ? '12px 16px' : '20px 28px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12, backgroundColor: t.inputBg }}>
              {selectedProduct.metadata?.stock_display_mode === 'force_lanzamiento' ? (
                <>
                  <button 
                    disabled
                    style={{ width: '100%', padding: isMobile ? '12px' : '14px', borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'not-allowed' }}
                  >
                    {"Pr\u00f3ximamente"}
                  </button>
                  <button 
                    onClick={() => {
                      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa saber m\u00e1s sobre el pr\u00f3ximo lanzamiento de: ${selectedProduct.nombre}`, '_blank');
                      setSelectedProduct(null);
                    }}
                    style={{ width: '100%', padding: isMobile ? '12px' : '14px', borderRadius: 10, border: 'none', backgroundColor: t.accent, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    Preguntar por Chat
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{ width: '100%', padding: isMobile ? '12px' : '14px', borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    + Añadir al Carrito
                  </button>
                  <button 
                    onClick={() => window.open(`https://wa.me/c/${WHATSAPP_NUMBER}`, '_blank')}
                    style={{ width: '100%', padding: isMobile ? '12px' : '14px', borderRadius: 10, border: 'none', backgroundColor: '#25D366', color: '#ffffff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    📱 Catálogo WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa: ${selectedProduct.nombre} (SKU: ${selectedProduct.sku || selectedProduct.codigo || 'N/A'})`, '_blank');
                      setSelectedProduct(null);
                    }}
                    style={{ width: '100%', padding: isMobile ? '12px' : '14px', borderRadius: 10, border: 'none', backgroundColor: t.accent, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    Preguntar por Chat
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DRAWER LATERAL DEL CARRITO */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', cursor: 'pointer' }} 
          />

          {/* Drawer Body */}
          <div style={{ 
            position: 'relative', width: '100%', maxWidth: 420, height: '100%', backgroundColor: t.panel, borderLeft: `1px solid ${t.border}`, 
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', zIndex: 1 
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={18} color={t.accent} />
                <h3 style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Bolsa de Compra</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                  <ShoppingCart size={32} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: t.bg, border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.imagen ? (
                        <img src={item.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.nombre} />
                      ) : (
                        <ImageIcon size={20} style={{ color: t.textDim }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.nombre}</h4>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted, display: 'block', marginTop: 4 }}>
                        {parseFloat(item.precio_venta).toLocaleString()} BS.
                      </span>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 20, padding: '2px 8px' }}>
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            style={{ border: 'none', backgroundColor: 'transparent', color: t.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Minus size={10} />
                          </button>
                          <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'monospace', color: t.text }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            style={{ border: 'none', backgroundColor: 'transparent', color: t.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.id)}
                          style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Checkout */}
            {cart.length > 0 && (
              <div style={{ padding: '24px', borderTop: `1px solid ${t.border}`, backgroundColor: t.inputBg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted }}>Total Estimado</span>
                  <span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>
                    {cartTotal.toLocaleString()} <span style={{ fontSize: 10, color: t.textMuted }}>BS.</span>
                  </span>
                </div>

                <button 
                  onClick={() => {
                    const now = new Date();
                    const randomId = Math.floor(1000 + Math.random() * 9000);
                    const code = `PED-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${randomId}`;
                    setPedidoId(code);
                    setIsCheckoutOpen(true);
                    setIsCartOpen(false);
                  }}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 14, backgroundColor: t.accent, border: 'none', color: '#000', fontSize: 10, fontWeight: 900, 
                    textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' 
                  }}
                >
                  Pedir por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL INNOVADOR DE PREVISUALIZACIÓN DE WHATSAPP (SIMULADOR DE CELULAR) */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 900, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: `1px solid ${t.border}` }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.1em', margin: 0 }}>
                  Previsualización de Pedido y Envío
                </h3>
                <span style={{ fontSize: 9, color: t.textMuted }}>Verifica tu mensaje tal como se enviará por WhatsApp</span>
              </div>
              <button 
                onClick={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }} 
                style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Split content */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              
              {/* Form Column */}
              <div style={{ flex: 1.1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }} className="mac-scrollbar">
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: t.accent, letterSpacing: '0.05em' }}>Datos de Entrega</span>
                
                {/* Client name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>

                {/* Delivery address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección de Envío</label>
                  <textarea 
                    placeholder="Ej: Calle Bolívar #123, Zona Central" 
                    value={clientAddress} 
                    onChange={e => setClientAddress(e.target.value)}
                    rows={3}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text, resize: 'none', fontFamily: 'inherit' }} 
                  />
                </div>

                {/* Payment Method */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de Pago Preferido</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }}
                  >
                    <option value="Efectivo">Efectivo contra entrega</option>
                    <option value="Transferencia QR">Transferencia Bancaria / QR</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                  </select>
                </div>

                {/* Info summary */}
                <div style={{ marginTop: 'auto', padding: 14, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <ShoppingCart size={20} style={{ color: '#10b981' }} />
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted }}>Total de Compra</span>
                    <p style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 900, color: t.text, margin: 0 }}>{cartTotal.toLocaleString()} BS.</p>
                  </div>
                </div>
              </div>

              {/* Live WhatsApp Smartphone Simulator Column */}
              <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderLeft: `1px solid ${t.border}`, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                
                {/* Smartphone Device Wrap */}
                <div style={{ width: '100%', maxWidth: 320, height: 480, borderRadius: 32, border: '6px solid #2e2e30', backgroundColor: '#0b141a', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', position: 'relative' }}>
                  
                  {/* Speaker and Camera notch */}
                  <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 60, height: 12, backgroundColor: '#2e2e30', borderRadius: 6, zIndex: 10 }} />
                  
                  {/* WhatsApp Top Header Bar */}
                  <div style={{ backgroundColor: '#075e54', padding: '16px 12px 10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', opacity: 0.8 }} />
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <ShoppingCart size={11} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', display: 'block' }}>SyncPro Catalog</span>
                      <span style={{ fontSize: 7, color: '#10b981', fontWeight: 600 }}>En línea</span>
                    </div>
                  </div>

                  {/* Chat screen Area */}
                  <div style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundImage: 'radial-gradient(#152026 15%, transparent 16%)', backgroundSize: '12px 12px', backgroundColor: '#0b141a' }} className="mac-scrollbar">
                    
                    {/* Simulated System date info badge */}
                    <div style={{ alignSelf: 'center', backgroundColor: '#182229', color: '#8696a0', fontSize: 8, padding: '3px 8px', borderRadius: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Hoy
                    </div>

                    {/* Chat Bubble Message */}
                    <div style={{ alignSelf: 'flex-end', backgroundColor: '#005c4b', color: '#e9edef', padding: '10px 12px', borderRadius: '10px 0 10px 10px', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', position: 'relative', wordBreak: 'break-word' }}>
                      <pre style={{ margin: 0, fontSize: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
                        {checkoutMessage}
                      </pre>
                      
                      {/* Check tick and time stamp */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, marginTop: 4 }}>
                        <span style={{ fontSize: 7, color: '#8696a0' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div style={{ display: 'flex', color: '#53bdeb' }}>
                          <span style={{ fontSize: 8, fontWeight: 'bold' }}>✓✓</span>
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  {/* WhatsApp Bottom typing bar placeholder */}
                  <div style={{ backgroundColor: '#1f2c34', padding: 8, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ flex: 1, backgroundColor: '#2a3942', borderRadius: 20, padding: '6px 12px', fontSize: 8, color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                      Mensaje de compra...
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>
                      ▶
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Footer buttons */}
            <div style={{ padding: '20px 28px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 12, backgroundColor: t.inputBg }}>
              <button 
                onClick={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              >
                Volver al Carrito
              </button>
              <button 
                onClick={handleWhatsAppCheckout}
                disabled={loading}
                style={{ flex: 1.5, padding: '14px', borderRadius: 14, border: 'none', backgroundColor: '#10b981', color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
              >
                Confirmar y Enviar a WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BOTTOM TAB BAR FOR MOBILE */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          height: 'calc(64px + env(safe-area-inset-bottom))', 
          backgroundColor: t.panel, borderTop: `1px solid ${t.border}`, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 800, 
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          boxSizing: 'border-box'
        }}>
          <button 
            onClick={() => { setActiveCategory('Todos'); setActiveSubfilter('Todos los ítems'); setSearchTerm(''); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: activeCategory === 'Todos' ? t.accent : t.textDim, cursor: 'pointer' }}
          >
            <Home size={18} />
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>Inicio</span>
          </button>
          
          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: t.textDim, cursor: 'pointer' }}
          >
            <LayoutGrid size={18} />
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>Filtros</span>
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: cartCount > 0 ? t.accent : t.textDim, cursor: 'pointer' }}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="animate-bounce" style={{ position: 'absolute', top: -4, right: 8, backgroundColor: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 900, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>Carrito</span>
          </button>

          <button 
            onClick={() => window.open(`https://wa.me/c/${WHATSAPP_NUMBER}`, '_blank')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#25D366', cursor: 'pointer' }}
          >
            <Briefcase size={18} />
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>Catálogo</span>
          </button>
          
          <button 
            onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Vengo del catálogo y tengo una consulta.`, '_blank')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            <Smartphone size={18} />
            <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>Consulta</span>
          </button>
        </div>
      )}

      {/* MOBILE FILTERS SHEET */}
      {isMobile && isMobileFiltersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div 
            onClick={() => setIsMobileFiltersOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{ 
            position: 'relative', width: '100%', backgroundColor: t.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '24px', zIndex: 1, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 20,
            maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: t.text }}>Filtros del Catálogo</h3>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: t.inputBg, border: 'none', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Categorías */}
            <div>
              <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: t.textMuted, marginBottom: 12 }}>Categorías</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button 
                  onClick={() => { setActiveCategory('Todos'); setIsMobileFiltersOpen(false); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none',
                    backgroundColor: activeCategory === 'Todos' ? t.accentSoft : 'transparent', color: activeCategory === 'Todos' ? t.accent : t.textDim, width: '100%', textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Todos</span>
                  <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: activeCategory === 'Todos' ? t.accent : t.inputBg, color: activeCategory === 'Todos' ? '#000' : t.textMuted, padding: '2px 8px', borderRadius: 20 }}>{productos.length}</span>
                </button>
                {uniqueCategories.map(catName => {
                  const count = categoryCounts[catName] || 0;
                  const isActive = activeCategory === catName;
                  return (
                    <button 
                      key={catName}
                      onClick={() => { setActiveCategory(catName); setIsMobileFiltersOpen(false); }}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none',
                        backgroundColor: isActive ? t.accentSoft : 'transparent', color: isActive ? t.accent : t.textDim, width: '100%', textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{catName}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: isActive ? t.accent : t.inputBg, color: isActive ? '#000' : t.textMuted, padding: '2px 8px', borderRadius: 20 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subfiltros */}
            <div>
              <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: t.textMuted, marginBottom: 12 }}>Subfiltros Estado</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Todos los ítems', 'Novedades', 'Más Vendidos', 'En Descuento'].map(sub => {
                  const isActive = activeSubfilter === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => { setActiveSubfilter(sub); setIsMobileFiltersOpen(false); }}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: 'none',
                        backgroundColor: isActive ? t.accentSoft : 'transparent', color: isActive ? t.accent : t.textMuted, width: '100%', textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: isActive ? 900 : 500 }}>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
