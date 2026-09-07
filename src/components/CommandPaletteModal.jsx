import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ArrowRight, Activity, Landmark, Building2, 
  Wallet, Dumbbell, Video, Briefcase, Bell, Image, 
  Trash2, Settings, ShoppingBag, Sun, Moon, Sparkles,
  Command, CornerDownLeft
} from 'lucide-react';
import { useTheme } from '../lib/theme';

export const CommandPaletteModal = ({
  isOpen,
  onClose,
  onNavigate,
  isDark,
  setIsDark
}) => {
  const t = useTheme(isDark);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const ACTIONS = [
    { id: 'resumen', title: 'Centro de Control', category: 'Navegación', icon: Activity, keywords: 'dashboard kpis metricas inicio home' },
    { id: 'prestamos', title: 'Gestión de Préstamos', category: 'Finanzas', icon: Landmark, keywords: 'prestamos cobrar capital cuota amortizacion' },
    { id: 'inventario', title: 'Empresa & Catálogo', category: 'Comercial', icon: Building2, keywords: 'inventario productos stock sku precio' },
    { id: 'pagos', title: 'Mis Egresos & Gastos', category: 'Finanzas', icon: Wallet, keywords: 'egresos suscripciones pagos servicios gastos' },
    { id: 'gimnasio', title: 'Sistema Gimnasio', category: 'Sistemas', icon: Dumbbell, keywords: 'gym membresias clientes socios rutinas' },
    { id: 'editor', title: 'Agencia de Marketing', category: 'Agencia', icon: Video, keywords: 'video reuniones clientes postproduccion' },
    { id: 'proyectos-edicion', title: 'Proyectos de Edición', category: 'Agencia', icon: Briefcase, keywords: 'edicion proyectos timeline' },
    { id: 'recordatorios', title: 'Recordatorios & Tareas', category: 'Productividad', icon: Bell, keywords: 'google tasks tareas notificaciones alertas' },
    { id: 'conversor-imagenes', title: 'Conversor WebP', category: 'Herramientas', icon: Image, keywords: 'imagenes fotos webp comprimir' },
    { id: 'papelera', title: 'Papelera de Reciclaje', category: 'Sistema', icon: Trash2, keywords: 'papelera eliminados recuperar' },
    { id: 'configuracion', title: 'Ajustes del Sistema', category: 'Sistema', icon: Settings, keywords: 'configuracion tema api token google apariencia' },
    { id: '__toggle_theme', title: isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro', category: 'Acciones', icon: isDark ? Sun : Moon, keywords: 'tema oscuro claro luz noche dia' },
    { id: '__open_catalog', title: 'Ver Catálogo Público Web', category: 'Acciones', icon: ShoppingBag, keywords: 'catalogo publico tienda web' },
  ];

  const filteredActions = ACTIONS.filter(action => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return action.title.toLowerCase().includes(q) || 
           action.category.toLowerCase().includes(q) ||
           action.keywords.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredActions[selectedIndex];
        if (selected) executeAction(selected);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions]);

  const executeAction = (action) => {
    if (action.id === '__toggle_theme') {
      setIsDark(!isDark);
      onClose();
    } else if (action.id === '__open_catalog') {
      window.open(window.location.origin + '/catalogo', '_blank');
      onClose();
    } else {
      onNavigate(action.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-28 px-4"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border transition-all animate-fadeInScale"
        style={{
          backgroundColor: isDark ? 'rgba(18, 18, 22, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
          boxShadow: isDark 
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Input Bar */}
        <div 
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}
        >
          <Search size={18} className="text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="¿A dónde deseas ir o qué acción buscas?..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[14px] font-medium placeholder:text-neutral-500"
            style={{ color: t.text }}
          />
          <kbd 
            className="text-[10px] font-mono px-2 py-0.5 rounded border text-neutral-400 flex-shrink-0"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 mac-scrollbar">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
                      : 'transparent',
                    border: isSelected 
                      ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`
                      : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected 
                          ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
                          : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                        color: isSelected ? t.accent : t.textMuted,
                      }}
                    >
                      <ActionIcon size={16} strokeWidth={isSelected ? 2.2 : 1.8} />
                    </div>
                    <div className="min-w-0">
                      <p 
                        className="text-[13px] font-semibold truncate m-0 leading-tight"
                        style={{ color: isSelected ? t.text : t.textSecondary }}
                      >
                        {action.title}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {action.category}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 pr-1">
                      <span>Abrir</span>
                      <CornerDownLeft size={12} />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs">
              No se encontraron acciones ni secciones para "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between px-4 py-2 text-[10px] font-medium text-neutral-500 border-t"
          style={{
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar</span>
            <span>ESC Salir</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-[9px] uppercase tracking-wider text-neutral-400">
            <Sparkles size={10} className="text-amber-400" />
            <span>Inefable QuickNav</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
