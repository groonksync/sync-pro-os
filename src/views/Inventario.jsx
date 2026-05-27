import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Save, Trash2, Edit3, X, Image as ImageIcon,
  Truck, Tag, Box as BoxIcon, Layout, CheckCircle, ChevronLeft, ChevronRight,
  Briefcase, ShoppingBag, DollarSign, Hash, MapPin, ShieldCheck, FileText, Info, Zap, ShoppingCart,
  Layers, Ruler, Weight, Globe, Star, AlertTriangle, List, ArrowUpRight, ArrowLeft, ArrowRight,
  Barcode, Shield, ZapOff, Activity, Palette, ClipboardList, RotateCcw, Search
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import { ProductIllustration } from '../components/ProductIllustration';

const Toast = ({ message, show, onClose, isDark, t }) => {
  useEffect(() => {
    if (show) { const timer = setTimeout(() => onClose(), 3000); return () => clearTimeout(timer); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 600 }}>
      <div style={{ backgroundColor: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(245,245,247,0.95)', backdropFilter: 'blur(24px)', border: `1px solid ${t.border}`, padding: '12px 24px', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}><CheckCircle size={16} /></div>
        <span style={{ color: isDark ? '#fff' : '#1a1a1a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>{message}</span>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, t }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, padding: 24, borderRadius: 20, maxWidth: 400, width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: t.text, letterSpacing: '-0.02em', margin: '0 0 12px 0' }}>{title}</h4>
        <p style={{ fontSize: 11, color: t.textMuted, lineHeight: '1.6', margin: '0 0 24px 0' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_PRODUCTS = [
  {
    nombre: "Soporte Sakti",
    categoria: "Celular",
    marca: "Sakti",
    precio_venta: 150,
    precio_costo: 90,
    precio_antes: 200,
    stock_actual: 12,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "STAND-SAKTI",
    garantia: "6 Meses",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "holder",
      illustration_color: "sky",
      rating: 4.8,
      is_new: true
    }
  },
  {
    nombre: "Auriculares Max",
    categoria: "Música",
    marca: "Sovereign",
    precio_venta: 790,
    precio_costo: 450,
    precio_antes: 990,
    stock_actual: 8,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "HEAD-MAX",
    garantia: "1 Año",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "headphones",
      illustration_color: "indigo",
      rating: 4.9,
      is_bestseller: true
    }
  },
  {
    nombre: "Aspiradora Adudu",
    categoria: "Hogar",
    marca: "Adudu",
    precio_venta: 1200,
    precio_costo: 800,
    precio_antes: 1500,
    stock_actual: 4,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "ROBOT-ADUDU",
    garantia: "2 Años",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "cleaner",
      illustration_color: "amber",
      rating: 4.5,
      is_discounted: true
    }
  },
  {
    nombre: "Cámara Sentinel",
    categoria: "Hogar",
    marca: "Sovereign",
    precio_venta: 350,
    precio_costo: 200,
    precio_antes: 450,
    stock_actual: 15,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "CAM-SENTINEL",
    garantia: "1 Año",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "camera",
      illustration_color: "rose",
      rating: 4.7,
      is_new: true
    }
  },
  {
    nombre: "Altavoz Aura",
    categoria: "Música",
    marca: "Sovereign",
    precio_venta: 290,
    precio_costo: 180,
    precio_antes: 350,
    stock_actual: 0,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "SPK-AURA",
    garantia: "6 Meses",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "speaker",
      illustration_color: "emerald",
      rating: 4.6
    }
  },
  {
    nombre: "Estuche Pods Pro",
    categoria: "Celular",
    marca: "Sovereign",
    precio_venta: 450,
    precio_costo: 280,
    precio_antes: 550,
    stock_actual: 20,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "EAR-PODS",
    garantia: "1 Año",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "earbuds",
      illustration_color: "violet",
      rating: 4.8,
      is_bestseller: true
    }
  },
  {
    nombre: "Piano Steinway",
    categoria: "Música",
    marca: "Steinway",
    precio_venta: 18500,
    precio_costo: 12000,
    precio_antes: 22000,
    stock_actual: 2,
    stock_minimo: 2,
    stock_vendido: 0,
    codigo: "PIANO-STEIN",
    garantia: "5 Años",
    tipo_envio: "Costo Adicional",
    metadata: {
      illustration_type: "piano",
      illustration_color: "slate",
      rating: 5.0,
      is_new: true
    }
  },
  {
    nombre: "Soporte Nimbus",
    categoria: "Celular",
    marca: "Nimbus",
    precio_venta: 180,
    precio_costo: 110,
    precio_antes: 240,
    stock_actual: 10,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "STAND-NIMBUS",
    garantia: "6 Meses",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "holder",
      illustration_color: "violet",
      rating: 4.4,
      is_discounted: true
    }
  },
  {
    nombre: "Auriculares Beat",
    categoria: "Música",
    marca: "Beat",
    precio_venta: 580,
    precio_costo: 350,
    precio_antes: 690,
    stock_actual: 3,
    stock_minimo: 5,
    stock_vendido: 0,
    codigo: "HEAD-BEAT",
    garantia: "1 Año",
    tipo_envio: "Envío Gratuito",
    metadata: {
      illustration_type: "headphones",
      illustration_color: "rose",
      rating: 4.7,
      is_discounted: true
    }
  }
];

const Inventario = ({ isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Custom dialog state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleRestoreCatalog = async () => {
    try {
      setLoading(true);
      // Delete existing records
      const { error: deleteError } = await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) throw deleteError;

      // Seed default items
      const { error: insertError } = await supabase.from('productos').insert(
        DEFAULT_PRODUCTS.map(p => ({
          ...p,
          id: crypto.randomUUID()
        }))
      );
      if (insertError) throw insertError;

      setToast({ show: true, message: 'Catálogo Restaurado' });
      setConfirmRestore(false);
      await fetchData();
    } catch (e) {
      alert("Error al restaurar catálogo: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.nombre) return;
    setLoading(true);
    try {
      const payload = {
        ...editingProduct,
        precio_venta: parseFloat(editingProduct.precio_venta) || 0,
        precio_costo: parseFloat(editingProduct.precio_costo) || 0,
        precio_antes: parseFloat(editingProduct.precio_antes) || 0,
        stock_actual: parseInt(editingProduct.stock_actual) || 0,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(editingProduct.metadata || {}),
          video_url: editingProduct.video_url || '',
          sku: editingProduct.sku || '',
          codigo: editingProduct.codigo || ''
        }
      };
      
      const { error } = await supabase.from('productos').upsert(payload);
      if (error) throw error;
      
      await fetchData();
      setIsModalOpen(false);
      setEditingProduct(null);
      setToast({ show: true, message: 'Producto Guardado' });
    } catch (e) {
      alert('Error de guardado: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (p) => {
    setEditingProduct({
      ...p,
      imagen: p.imagen || '',
      imagenes: p.imagenes || [],
      descripcion: p.descripcion || p.ficha_tecnica || '',
      sku: p.sku || p.metadata?.sku || '',
      codigo: p.codigo || p.metadata?.codigo || '',
      garantia: p.garantia || '6 Meses',
      tipo_envio: p.tipo_envio || 'Envío Gratuito',
      video_url: p.video_url || p.metadata?.video_url || '',
      metadata: p.metadata || {}
    });
    setIsModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({
      id: crypto.randomUUID(),
      nombre: '',
      categoria: 'Celular',
      marca: '',
      precio_costo: 0,
      precio_venta: 0,
      precio_antes: 0,
      stock_actual: 10,
      stock_minimo: 5,
      stock_vendido: 0,
      codigo: '',
      sku: '',
      imagen: '',
      imagenes: [],
      descripcion: '',
      garantia: '6 Meses',
      tipo_envio: 'Envío Gratuito',
      video_url: '',
      metadata: {}
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!confirmDelete.id) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('productos').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      setToast({ show: true, message: 'Producto Eliminado' });
      setConfirmDelete({ isOpen: false, id: null });
      await fetchData();
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
        urls.push(publicUrl);
      }
      const newImages = [...(editingProduct.imagenes || []), ...urls];
      setEditingProduct(prev => ({
        ...prev,
        imagenes: newImages,
        imagen: prev.imagen || newImages[0]
      }));
      setToast({ show: true, message: 'Imagen Subida' });
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filters search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productos;
    const lower = searchTerm.toLowerCase();
    return productos.filter(p => 
      p.nombre?.toLowerCase().includes(lower) || 
      p.categoria?.toLowerCase().includes(lower) || 
      p.sku?.toLowerCase().includes(lower) ||
      p.codigo?.toLowerCase().includes(lower)
    );
  }, [productos, searchTerm]);

  // Metrics
  const totalProducts = productos.length;
  const totalValue = useMemo(() => productos.reduce((sum, p) => sum + (parseFloat(p.precio_venta || 0) * parseInt(p.stock_actual || 0)), 0), [productos]);
  const criticalStockCount = useMemo(() => productos.filter(p => parseInt(p.stock_actual || 0) <= 5 && parseInt(p.stock_actual || 0) > 0).length, [productos]);
  const activeCategories = useMemo(() => new Set(productos.map(p => p.categoria).filter(Boolean)).size, [productos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', fontFamily: 'Outfit, sans-serif' }}>
      <Toast show={toast.show} message={toast.message} isDark={isDark} t={t} onClose={() => setToast({ ...toast, show: false })} />
      
      {/* CONFIRMATION DIALOGS */}
      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        title="Eliminar Producto" 
        message="¿Estás seguro de que deseas eliminar este producto permanentemente del inventario? Esta acción no se puede deshacer." 
        onConfirm={handleDeleteProduct} 
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })} 
        t={t} 
      />
      <ConfirmModal 
        isOpen={confirmRestore} 
        title="Restaurar Catálogo" 
        message="Esta acción reemplazará todos los productos actuales en la base de datos por el catálogo predeterminado de 9 artículos tecnológicos de prueba. ¿Deseas continuar?" 
        onConfirm={handleRestoreCatalog} 
        onCancel={() => setConfirmRestore(false)} 
        t={t} 
      />

      {/* TOP HEADER PANEL */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: t.text, letterSpacing: '-0.03em', margin: 0, textTransform: 'uppercase' }}>
            Gestor de Inventario
          </h2>
          <p style={{ fontSize: 9, color: t.accent, marginTop: 4, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Panel de Administración Pro
          </p>
        </div>

        {/* Action buttons (removed selector pill) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setConfirmRestore(true)}
            style={{ padding: '10px 18px', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, color: t.text, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RotateCcw size={13} /> Restaurar Catálogo
          </button>

          <button 
            onClick={openNewProduct}
            style={{ padding: '10px 20px', backgroundColor: t.accent, border: 'none', borderRadius: 12, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={14} /> Nuevo Producto
          </button>
        </div>
      </header>

      {/* METRICS DASHBOARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Productos Totales', value: totalProducts, icon: Package },
          { label: 'Valor del Inventario', value: `$${totalValue.toLocaleString()}`, icon: DollarSign },
          { label: 'Stock Crítico', value: criticalStockCount, icon: AlertTriangle, status: criticalStockCount > 0 ? 'warning' : 'ok' },
          { label: 'Categorías Activas', value: activeCategories, icon: Layers }
        ].map((m, i) => (
          <div key={i} style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 18, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div>
              <span style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{m.label}</span>
              <p style={{ fontSize: 24, fontWeight: 900, color: m.status === 'warning' ? '#fbbf24' : t.text, fontFamily: 'monospace', margin: '6px 0 0 0' }}>{m.value}</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.status === 'warning' ? '#fbbf24' : t.accent }}>
              <m.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND ADVANCED TABLE */}
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        {/* Table Search Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 36, top: '50%', transform: 'translateY(-50%)', color: t.textDim }} size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría, SKU o código..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 20px 12px 42px', fontSize: 11, outline: 'none', color: t.text }}
          />
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.inputBg }}>
                {['Código / SKU', 'Producto', 'Categoría', 'Precio Venta', 'Stock', 'Acciones'].map((th, idx) => (
                  <th key={idx} style={{ padding: '14px 24px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.textMuted }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const stock = parseInt(p.stock_actual || 0);
                const isAgotado = stock <= 0;
                const isLow = stock > 0 && stock <= 5;
                const statusColor = isAgotado ? '#ef4444' : isLow ? '#fbbf24' : '#10b981';

                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontSize: 10, fontFamily: 'monospace', color: t.textMuted }}>
                      {p.sku || p.codigo || (p.id ? p.id.substring(0, 8) : 'N/A')}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Huge Product Image container w-24 h-24 */}
                        <div style={{ width: 96, height: 96, borderRadius: 14, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.imagen ? (
                            <img src={p.imagen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.nombre} />
                          ) : (
                            <ImageIcon size={28} style={{ color: t.textDim }} />
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 900, color: t.text, display: 'block', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{p.nombre}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, display: 'block' }}>SKU: {p.sku || p.codigo || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: t.inputBg, color: t.textMuted, padding: '4px 10px', borderRadius: 20 }}>
                        {p.categoria || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: t.text }}>
                      {parseFloat(p.precio_venta || 0).toLocaleString()} <span style={{ fontSize: 8, color: t.textMuted }}>BS.</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>{stock} unidades</span>
                        {isAgotado && (
                          <span style={{ fontSize: 7, fontWeight: 900, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agotado</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditProduct(p)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete({ isOpen: true, id: p.id })} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (CREATION AND EDITION) */}
      {isModalOpen && editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 780, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: `1px solid ${t.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
                {editingProduct.nombre ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textDim, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Field: Nombre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nombre del Artículo</label>
                <input 
                  type="text" 
                  value={editingProduct.nombre} 
                  onChange={e => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                />
              </div>

              {/* Grid: SKU & Codigo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SKU Interno</label>
                  <input 
                    type="text" 
                    value={editingProduct.sku} 
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="Ej: SAKTI-STAND-01"
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Código de barras</label>
                  <input 
                    type="text" 
                    value={editingProduct.codigo} 
                    onChange={e => setEditingProduct({ ...editingProduct, codigo: e.target.value })}
                    placeholder="Ej: 779123456789"
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
              </div>

              {/* Grid: Categoria & Marca */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Categoría</label>
                  <select 
                    value={editingProduct.categoria} 
                    onChange={e => setEditingProduct({ ...editingProduct, categoria: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 11, outline: 'none', color: t.text }}
                  >
                    <option value="Celular">Celular</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Música">Música</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marca</label>
                  <input 
                    type="text" 
                    value={editingProduct.marca} 
                    onChange={e => setEditingProduct({ ...editingProduct, marca: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
              </div>

              {/* Grid: Precios */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precio Costo (BS)</label>
                  <input 
                    type="number" 
                    value={editingProduct.precio_costo} 
                    onChange={e => setEditingProduct({ ...editingProduct, precio_costo: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precio Venta (Público)</label>
                  <input 
                    type="number" 
                    value={editingProduct.precio_venta} 
                    onChange={e => setEditingProduct({ ...editingProduct, precio_venta: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precio Antes (Oferta)</label>
                  <input 
                    type="number" 
                    value={editingProduct.precio_antes} 
                    onChange={e => setEditingProduct({ ...editingProduct, precio_antes: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
              </div>

              {/* Grid: Stock, Garantia & Envio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stock Disponible</label>
                  <input 
                    type="number" 
                    value={editingProduct.stock_actual} 
                    onChange={e => setEditingProduct({ ...editingProduct, stock_actual: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Garantía</label>
                  <input 
                    type="text" 
                    value={editingProduct.garantia} 
                    onChange={e => setEditingProduct({ ...editingProduct, garantia: e.target.value })}
                    placeholder="Ej: 6 Meses"
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logística / Envío</label>
                  <select 
                    value={editingProduct.tipo_envio} 
                    onChange={e => setEditingProduct({ ...editingProduct, tipo_envio: e.target.value })}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 11, outline: 'none', color: t.text }}
                  >
                    <option value="Envío Gratuito">Envío Gratuito</option>
                    <option value="Costo Adicional">Costo Adicional</option>
                  </select>
                </div>
              </div>

              {/* URL de Imagen Principal & Uploader */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Imagen Principal (URL)</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    value={editingProduct.imagen} 
                    onChange={e => setEditingProduct({ ...editingProduct, imagen: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    style={{ flex: 1, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                  />
                  <label style={{ padding: '12px 20px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                    Subir Archivo
                  </label>
                </div>
              </div>

              {/* URLs de Imágenes Secundarias */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Imágenes adicionales (Una URL por línea)</label>
                <textarea 
                  value={Array.isArray(editingProduct.imagenes) ? editingProduct.imagenes.join('\n') : ''} 
                  onChange={e => setEditingProduct({ ...editingProduct, imagenes: e.target.value.split('\n').filter(line => line.trim() !== '') })}
                  placeholder="https://ejemplo.com/imagen2.jpg&#10;https://ejemplo.com/imagen3.jpg"
                  style={{ width: '100%', height: 80, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text, fontFamily: 'monospace', resize: 'vertical' }} 
                />
              </div>

              {/* URL de Video */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>URL de Video (YouTube/Vimeo/Directo)</label>
                <input 
                  type="text" 
                  value={editingProduct.video_url} 
                  onChange={e => setEditingProduct({ ...editingProduct, video_url: e.target.value })}
                  placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text }} 
                />
              </div>

              {/* Descripción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Descripción del Producto</label>
                <textarea 
                  value={editingProduct.descripcion} 
                  onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })}
                  placeholder="Escribe la descripción del artículo..."
                  style={{ width: '100%', height: 100, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 12, outline: 'none', color: t.text, resize: 'vertical' }} 
                />
              </div>

            </div>

            {/* Actions */}
            <div style={{ padding: '24px 32px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: t.inputBg }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.textDim, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProduct}
                style={{ padding: '10px 24px', borderRadius: 12, border: 'none', backgroundColor: t.accent, color: '#000', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
