import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, X, ShoppingCart, CheckCircle, 
  Home, Music, Smartphone, LayoutGrid, Star, ChevronLeft, ChevronRight,
  TrendingUp, Tag, Plus, Minus, Trash2, ArrowRight, Image as ImageIcon,
  Box as BoxIcon, Video, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const getCategoryIcon = (category) => {
  const catLower = category?.toLowerCase() || '';
  if (catLower.includes('computadoras') || catLower.includes('pc') || catLower.includes('laptop')) return BoxIcon;
  if (catLower.includes('audio') || catLower.includes('sonido') || catLower.includes('música') || catLower.includes('micrófono')) return Music;
  if (catLower.includes('celular') || catLower.includes('teléfono') || catLower.includes('accesorio')) return Smartphone;
  if (catLower.includes('cámara') || catLower.includes('fotografía') || catLower.includes('seguridad') || catLower.includes('video')) return Video;
  if (catLower.includes('electrónica') || catLower.includes('fuente') || catLower.includes('forza')) return Zap;
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

const ProductCard = ({ p, t, addToCart, onOpenDetails, WHATSAPP_NUMBER }) => {
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
  const isAgotado = stock <= 0;
  const isLow = stock > 0 && stock <= 5;
  const hasDiscount = p.precio_antes && p.precio_antes > p.precio_venta;

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
      style={{ 
        backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)', transition: 'all 0.3s', cursor: 'pointer', position: 'relative', overflow: 'hidden'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: t.inputBg, color: t.textMuted, padding: '4px 10px', borderRadius: 20 }}>
            {p.categoria || 'General'}
          </span>
          {isAgotado ? (
            <span style={{ fontSize: 7, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sin Stock</span>
          ) : isLow ? (
            <span style={{ fontSize: 7, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stock} disponibles</span>
          ) : (
            <span style={{ fontSize: 7, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stock} unidades</span>
          )}
        </div>

        {/* Image container — AGOTADO overlay lives ONLY here */}
        <div style={{ height: 250, borderRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, position: 'relative' }}>
          {isAgotado && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 6,
              borderRadius: 16
            }}>
              <span style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 900,
                padding: '9px 22px',
                borderRadius: 30,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
              }}>AGOTADO</span>
            </div>
          )}

          {cardImages.length > 0 ? (
            <img src={cardImages[activeImageIndex]} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} alt={p.nombre} />
          ) : (
            <ImageIcon size={32} style={{ color: t.textDim }} />
          )}

          {!isAgotado && cardImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)',
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', zIndex: 5
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextImage}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)',
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', zIndex: 5
                }}
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {!isAgotado && cardImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
              {cardImages.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => handleSelectDot(e, idx)}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
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
          fontSize: 13, 
          fontWeight: 900, 
          color: t.text, 
          textTransform: 'uppercase', 
          letterSpacing: '-0.02em', 
          marginTop: 16, 
          marginBottom: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          height: '2.8em',
          lineHeight: '1.4em'
        }} title={String(p.nombre || '').toUpperCase()}>
          {String(p.nombre || '').toUpperCase()}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={11} fill={star <= Math.round(p.metadata?.rating || 4.5) ? t.accent : 'none'} stroke={star <= Math.round(p.metadata?.rating || 4.5) ? t.accent : t.textMuted} />
            ))}
          </div>
          <span style={{ fontSize: 9, fontWeight: 900, color: t.textMuted }}>{p.metadata?.rating || 4.5}</span>
        </div>
      </div>

      <div 
        onClick={e => e.stopPropagation()} 
        style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          {hasDiscount && (
            <span style={{ fontSize: 8, fontFamily: 'monospace', textDecoration: 'line-through', color: t.textMuted, display: 'block', marginBottom: -2 }}>
              {parseFloat(p.precio_antes).toLocaleString()} BS.
            </span>
          )}
          <span style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>
            {parseFloat(p.precio_venta).toLocaleString()} <span style={{ fontSize: 8, color: t.textMuted }}>BS.</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => addToCart(p)}
            style={{ 
              padding: '8px 12px', borderRadius: 10, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontSize: 8, fontWeight: 900, 
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            + Carrito
          </button>
          <button 
            onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa comprar: ${p.nombre}`, '_blank')}
            style={{ 
              padding: '8px 14px', borderRadius: 10, backgroundColor: t.accent, border: 'none', color: '#000', fontSize: 8, fontWeight: 900, 
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            Comprar
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
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubfilter, setActiveSubfilter] = useState('Todos los ítems');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDark, setIsDark] = useState(true);

  // WhatsApp Pre-visualization States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

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
      result = result.filter(p => p.metadata?.is_new === true || p.condicion === 'Nuevo');
    } else if (activeSubfilter === 'Más Vendidos') {
      result = result.filter(p => p.metadata?.is_bestseller === true || p.stock_vendido > 10);
    } else if (activeSubfilter === 'En Descuento') {
      result = result.filter(p => p.precio_antes && p.precio_antes > p.precio_venta);
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
    if (stockLimit <= 0) {
      setToast({ show: true, message: 'Producto sin stock disponible', type: 'error' });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= stockLimit) {
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

    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + amount;
          if (newQty <= 0) return null;
          if (newQty > stockLimit) {
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

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0), [cart]);

  // WhatsApp Checkout integration
  const checkoutMessage = useMemo(() => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const pedidoId = `#SP-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = `🛒 *NUEVO PEDIDO — SYNCPRO CATALOG*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔖 *Pedido:* ${pedidoId}\n`;
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
      const itemTotal = parseFloat(item.precio_venta) * item.quantity;
      const categoria = item.categoria || 'General';
      text += `*${index + 1}.* 🏷️ *${String(item.nombre).toUpperCase()}*\n`;
      text += `   📂 Categoría: ${categoria}\n`;
      text += `   🔢 Código/SKU: \`${itemSku}\`\n`;
      text += `   📦 Cantidad: *${item.quantity}* ud(s)\n`;
      text += `   💰 Precio unitario: *${parseFloat(item.precio_venta).toLocaleString()} BS.*\n`;
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
  }, [cart, cartTotal, clientName, clientAddress, paymentMethod]);

  const handleWhatsAppCheckout = async () => {
    try {
      setLoading(true);
      
      // Dec stock
      for (const item of cart) {
        const currentStock = parseInt(item.stock_actual || 0);
        const nextStock = Math.max(0, currentStock - item.quantity);
        const nextVendido = parseInt(item.stock_vendido || 0) + item.quantity;
        await supabase
          .from('productos')
          .update({ stock_actual: nextStock, stock_vendido: nextVendido })
          .eq('id', item.id);
      }

      const encodedText = encodeURIComponent(checkoutMessage);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;

      setToast({ show: true, message: 'Pedido procesado. Abriendo WhatsApp...', type: 'success' });
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
    <div style={{ height: '100%', minHeight: '100vh', width: '100%', backgroundColor: t.bg, color: t.text, fontFamily: 'Outfit, sans-serif', transition: 'background-color 0.4s', overflowX: 'hidden', overflowY: 'auto' }}>
      <Toast message={toast.message} type={toast.type} show={toast.show} t={t} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* TOP CONTROL PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: `1px solid ${t.border}` }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: 0 }}>
            Inventario
          </h1>
          <span style={{ fontSize: 9, fontWeight: 900, color: t.accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Catálogo Principal
          </span>
        </div>

        {/* Search Input Centralized */}
        <div style={{ position: 'relative', width: '40%', minWidth: 260 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría, SKU o código..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 30, padding: '12px 20px 12px 42px', fontSize: 11, outline: 'none', color: t.text, transition: 'all 0.2s' }} 
          />
        </div>

        {/* Controls: Cart Trigger (removed Tienda/Gestor pill selector) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div style={{ display: 'flex', padding: '32px' }}>
        {/* SIDEBAR FILTROS */}
        <aside style={{ width: 260, paddingRight: 32, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0 }}>
          {/* Categorías */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.textMuted, marginBottom: 16 }}>Categorías</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button 
                onClick={() => setActiveCategory('Todos')}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  backgroundColor: activeCategory === 'Todos' ? t.accentSoft : 'transparent', color: activeCategory === 'Todos' ? t.accent : t.textDim, transition: 'all 0.2s', width: '100%', textAlign: 'left'
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

              {uniqueCategories.map(catName => {
                const Icon = getCategoryIcon(catName);
                const isActive = activeCategory === catName;
                const count = categoryCounts[catName] || 0;
                return (
                  <button 
                    key={catName}
                    onClick={() => setActiveCategory(catName)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      backgroundColor: isActive ? t.accentSoft : 'transparent', color: isActive ? t.accent : t.textDim, transition: 'all 0.2s', width: '100%', textAlign: 'left'
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

        {/* PRODUCTS GRID SECTION */}
        <section style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: t.textMuted }}>Cargando catálogo...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', opacity: 0.5 }}>
              <Package size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sin resultados en esta categoría</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {filteredProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    p={p} 
                    t={t} 
                    addToCart={addToCart} 
                    onOpenDetails={(prod) => { setSelectedProduct(prod); setSelectedImageIndex(0); setMediaTab('images'); }} 
                    WHATSAPP_NUMBER={WHATSAPP_NUMBER}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* DETAIL MODAL WITH LARGE IMAGE GALLERY AND EMBEDDED VIDEOS */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 740, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: `1px solid ${t.border}` }}>
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
              <div style={{ position: 'relative', width: '100%', height: 320, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${t.border}` }}>
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
                <div style={{ display: 'flex', gap: 10, padding: '16px 28px', overflowX: 'auto', backgroundColor: t.inputBg, borderBottom: `1px solid ${t.border}` }}>
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{ 
                        width: 54, height: 54, borderRadius: 10, border: `2px solid ${selectedImageIndex === idx ? t.accent : t.border}`, overflow: 'hidden', padding: 0, cursor: 'pointer', flexShrink: 0 
                      }}
                    >
                      <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Text Description Box */}
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Title & Brand */}
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
                    {selectedProduct.nombre}
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Marca: {selectedProduct.marca || 'Sovereign'}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      SKU/Código: {selectedProduct.sku || selectedProduct.codigo || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 18, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precio Público</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 900, color: t.text }}>
                        {parseFloat(selectedProduct.precio_venta || 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: t.accent }}>BS.</span>
                    </div>
                  </div>
                  {selectedProduct.precio_antes > selectedProduct.precio_venta && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Antes</span>
                      <p style={{ fontSize: 18, fontFamily: 'monospace', textDecoration: 'line-through', color: t.textMuted, margin: '4px 0 0 0' }}>
                        {parseFloat(selectedProduct.precio_antes).toLocaleString()} BS.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                    <p style={{ fontSize: 11, color: t.textDim, lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
                      {(selectedProduct.descripcion || selectedProduct.ficha_tecnica || '').replace(/\*/g, '\n• ')}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Footer actions */}
            <div style={{ padding: '20px 28px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 12, backgroundColor: t.inputBg }}>
              <button 
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              >
                + Añadir al Carrito
              </button>
              <button 
                onClick={() => {
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me interesa: ${selectedProduct.nombre} (SKU: ${selectedProduct.sku || selectedProduct.codigo || 'N/A'})`, '_blank');
                  setSelectedProduct(null);
                }}
                style={{ flex: 1.2, padding: '14px', borderRadius: 14, border: 'none', backgroundColor: t.accent, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              >
                Preguntar por WhatsApp
              </button>
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
                  onClick={() => { setIsCheckoutOpen(true); setIsCartOpen(false); }}
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
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: '#fff' }} 
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
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: '#fff', resize: 'none', fontFamily: 'inherit' }} 
                  />
                </div>

                {/* Payment Method */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de Pago Preferido</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: '#fff' }}
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
                    <p style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 900, color: '#fff', margin: 0 }}>{cartTotal.toLocaleString()} BS.</p>
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
    </div>
  );
};

export default PublicCatalog;
