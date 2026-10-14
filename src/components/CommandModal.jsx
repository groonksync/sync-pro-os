import React, { useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

/**
 * Modal de confirmación reutilizable para el CommandCenter.
 * 
 * Props:
 * - isOpen: boolean - controla visibilidad
 * - onClose: function - callback al cerrar
 * - onConfirm: function - callback al confirmar
 * - titulo: string - título del modal
 * - mensaje: string - mensaje principal
 * - icono: ReactNode - icono opcional
 * - colorAccent: string - color de acento (ej: '#f97316')
 * - confirmText: string - texto del botón confirmar (default: 'Confirmar')
 * - cancelText: string - texto del botón cancelar (default: 'Cancelar')
 * - variant: 'default' | 'danger' - variante de color
 * - children: ReactNode - contenido adicional opcional
 */
const CommandModal = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Confirmar acción',
  mensaje = '',
  icono = null,
  colorAccent = null,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  children = null,
  isDark = true,
}) => {
  const t = getTheme(isDark);
  
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const accentColor = colorAccent || (variant === 'danger' ? t.danger : t.accent);
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  
  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-2xl border overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col p-6 sm:p-7"
        style={{
          backgroundColor: t.panel,
          borderColor: t.borderLight || t.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle móvil */}
        <div className="sm:hidden flex justify-center -mt-2 pb-3">
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: isDark ? '#3F3F46' : '#D4D4D8' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icono ? (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${accentColor}15`,
                flexShrink: 0,
              }}>
                {icono}
              </div>
            ) : variant === 'danger' ? (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${t.danger}15`,
                flexShrink: 0,
              }}>
                <AlertTriangle size={22} color={t.danger} />
              </div>
            ) : (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${accentColor}15`,
                flexShrink: 0,
              }}>
                <Check size={22} color={accentColor} />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.3 }}>
                {titulo}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: t.textDim,
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Mensaje */}
        {mensaje && (
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '0 0 16px 0', lineHeight: 1.6, paddingLeft: '56px' }}>
            {mensaje}
          </p>
        )}
        
        {/* Contenido personalizado */}
        {children && (
          <div style={{ paddingLeft: '56px', marginBottom: '16px' }}>
            {children}
          </div>
        )}
        
        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: `1px solid ${t.border}`,
              backgroundColor: 'transparent',
              color: t.textDim,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: accentColor,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${accentColor}40`,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandModal;
