import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, X, ShoppingCart, CheckCircle, 
  Home, Music, Smartphone, LayoutGrid, Star, ChevronLeft, ChevronRight,
  TrendingUp, Tag, Plus, Minus, Trash2, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import { ProductIllustration } from '../components/ProductIllustration';

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

const PublicCatalog = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubfilter, setActiveSubfilter] = useState('Todos los ítems');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDark, setIsDark] = useState(true);

  const t = useMemo(() => getTheme(isDark), [isDark]);
  const WHATSAPP_NUMBER = "59169109766";
  const itemsPerPage = 6;

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(false);
      const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos(data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Helper formatting values
  const getIllustrationType = (p) => p.metadata?.illustration_type || p.imagen || 'headphones';
  const getIllustrationColor = (p) => p.metadata?.illustration_color || p.color || 'indigo';
  const getProductRating = (p) => p.metadata?.rating || 4.5;

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = productos;

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(p => p.nombre?.toLowerCase().includes(searchLower) || p.marca?.toLowerCase().includes(searchLower));
    }

    // Category filter
    if (activeCategory !== 'Todos') {
      result = result.filter(p => p.categoria?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Subfilter status
    if (activeSubfilter === 'Novedades') {
      result = result.filter(p => p.metadata?.is_new === true || p.condicion === 'Nuevo');
    } else if (activeSubfilter === 'Más Vendidos') {
      result = result.filter(p => p.metadata?.is_bestseller === true || p.stock_vendido > 10);
    } else if (activeSubfilter === 'En Descuento') {
      result = result.filter(p => p.precio_antes && p.precio_antes > p.precio_venta);
    }

    return result;
  }, [productos, searchTerm, activeCategory, activeSubfilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Category counts
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

  const handleCheckout = async () => {
    try {
      setLoading(true);
      // Process purchase: decrement stock in Supabase for each item
      for (const item of cart) {
        const currentStock = parseInt(item.stock_actual || 0);
        const nextStock = Math.max(0, currentStock - item.quantity);
        const nextVendido = parseInt(item.stock_vendido || 0) + item.quantity;

        const { error } = await supabase
          .from('productos')
          .update({ stock_actual: nextStock, stock_vendido: nextVendido })
          .eq('id', item.id);
        
        if (error) throw error;
      }

      setToast({ show: true, message: '¡Compra simulada con éxito! Stock actualizado', type: 'success' });
      setCart([]);
      setIsCartOpen(false);
      await fetchProducts();
    } catch (e) {
      setToast({ show: true, message: 'Error al procesar la compra', type: 'error' });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0), [cart]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text, fontFamily: 'Outfit, sans-serif', transition: 'background-color 0.4s' }}>
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
        <div style={{ position: 'relative', width: '35%', minWidth: 260 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={16} />
          <input 
            type="text" 
            placeholder="Buscar en el catálogo..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 30, padding: '12px 20px 12px 42px', fontSize: 11, outline: 'none', color: t.text, transition: 'all 0.2s' }} 
          />
        </div>

        {/* Controls: Pill Selector & Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 30, padding: 2 }}>
            <button 
              style={{ padding: '8px 20px', borderRadius: 28, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'default', backgroundColor: t.accent, color: '#000' }}
            >
              Tienda
            </button>
            <button 
              onClick={() => { window.location.hash = '#inventario'; window.location.reload(); }}
              style={{ padding: '8px 20px', borderRadius: 28, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: t.textDim }}
            >
              Gestor
            </button>
          </div>

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
              {[
                { name: 'Todos', icon: LayoutGrid },
                { name: 'Hogar', icon: Home },
                { name: 'Música', icon: Music },
                { name: 'Celular', icon: Smartphone }
              ].map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.name;
                const count = categoryCounts[cat.name] || 0;
                return (
                  <button 
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); setCurrentPage(1); }}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      backgroundColor: isActive ? t.accentSoft : 'transparent', color: isActive ? t.accent : t.textDim, transition: 'all 0.2s', width: '100%', textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{cat.name}</span>
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
                    onClick={() => { setActiveSubfilter(sub); setCurrentPage(1); }}
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
                {paginatedProducts.map(p => {
                  const stock = parseInt(p.stock_actual || 0);
                  const isAgotado = stock <= 0;
                  const isLow = stock > 0 && stock <= 5;
                  const hasDiscount = p.precio_antes && p.precio_antes > p.precio_venta;

                  return (
                    <div 
                      key={p.id}
                      style={{ 
                        backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'all 0.3s' 
                      }}
                    >
                      <div>
                        {/* Tag category & stock status */}
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

                        {/* Graphic Illustration */}
                        <div style={{ height: 160, borderRadius: 16, backgroundColor: t.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, position: 'relative' }}>
                          <ProductIllustration type={getIllustrationType(p)} color={getIllustrationColor(p)} />
                        </div>

                        {/* Title & Star Rating */}
                        <h3 style={{ fontSize: 14, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: 16, marginBottom: 6 }}>{p.nombre}</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={11} fill={star <= Math.round(getProductRating(p)) ? t.accent : 'none'} stroke={star <= Math.round(getProductRating(p)) ? t.accent : t.textMuted} />
                            ))}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 900, color: t.textMuted }}>{getProductRating(p)}</span>
                        </div>
                      </div>

                      {/* Pricing & Cart Action */}
                      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                })}
              </div>

              {/* PAGINACIÓN MINIMALISTA */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 42 }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ 
                    padding: '8px 16px', borderRadius: 10, backgroundColor: t.panel, border: `1px solid ${t.border}`, color: currentPage === 1 ? t.textMuted : t.text,
                    fontSize: 8, fontWeight: 900, textTransform: 'uppercase', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 
                  }}
                >
                  <ChevronLeft size={12} style={{ marginRight: 4 }} /> Anterior
                </button>
                <div style={{ fontSize: 10, fontWeight: 900, color: t.text }}>
                  {currentPage} <span style={{ color: t.textMuted }}>/ {totalPages}</span>
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ 
                    padding: '8px 16px', borderRadius: 10, backgroundColor: t.panel, border: `1px solid ${t.border}`, color: currentPage === totalPages ? t.textMuted : t.text,
                    fontSize: 8, fontWeight: 900, textTransform: 'uppercase', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 
                  }}
                >
                  Siguiente <ChevronRight size={12} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

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
                      <ProductIllustration type={getIllustrationType(item)} color={getIllustrationColor(item)} />
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
                  onClick={handleCheckout}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 14, backgroundColor: t.accent, border: 'none', color: '#000', fontSize: 10, fontWeight: 900, 
                    textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' 
                  }}
                >
                  Proceder al Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
