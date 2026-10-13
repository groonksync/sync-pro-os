import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../lib/theme';

/**
 * BottomSheet: Componente responsivo inteligente.
 * - En smartphone (< 768px): Se despliega como una Bottom Sheet táctil nativa desde abajo
 *   con drag handle y esquinas superiores redondeadas (rounded-t-3xl).
 * - En laptop / escritorio (>= 768px): Se centra elegantemente como modal flotante de alta fidelidad.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  isDark = true,
  maxWidth = 'max-w-xl',
  showClose = true,
}) {
  const t = useTheme(isDark);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={`w-full ${maxWidth} flex flex-col max-h-[92vh] md:max-h-[85vh] rounded-t-3xl md:rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-6 md:zoom-in-95`}
        style={{
          backgroundColor: t.panel,
          borderColor: t.borderLight || t.border,
          color: t.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de arrastre táctil (visible en smartphone) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div
            className="w-12 h-1.5 rounded-full"
            style={{ backgroundColor: isDark ? '#3F3F46' : '#D4D4D8' }}
          />
        </div>

        {/* Cabecera del Sheet / Modal */}
        {(title || showClose) && (
          <div
            className="flex items-center justify-between px-5 pt-3 pb-3.5 border-b shrink-0"
            style={{ borderColor: t.borderLight || t.border }}
          >
            <div>
              {title && (
                <h3 className="text-sm md:text-base font-bold tracking-tight m-0" style={{ color: t.text }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] mt-0.5 m-0" style={{ color: t.textMuted }}>
                  {subtitle}
                </p>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 border"
                style={{
                  backgroundColor: isDark ? '#1F1F22' : '#F3F4F6',
                  borderColor: t.borderLight || t.border,
                  color: t.textMuted,
                }}
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {/* Contenido con scroll interno suave */}
        <div className="p-5 overflow-y-auto mac-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
