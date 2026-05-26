import React, { useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { getTheme } from '../lib/theme';

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '420px',
          backgroundColor: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
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
