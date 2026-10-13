import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Landmark, Wallet, Package, Bell, Settings, Dumbbell,
  Briefcase, Plus, Sun, Moon, ArrowRight, Calculator,
  ExternalLink, User, X, Zap
} from 'lucide-react';
import { useTheme } from '../../lib/theme';

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  data = { prestamos: [], egresos: [] },
  onOpenSimulador,
  onNavigateToPrestamo,
}) {
  const t = useTheme(isDark);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus automático al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Lista de deudores / clientes reales a partir de los datos
  const clientesPrestamos = useMemo(() => {
    const list = Array.isArray(data?.prestamos) ? data.prestamos : [];
    return list.map(p => ({
      id: `prestamo-${p.id}`,
      type: 'cliente',
      title: p.nombre || 'Cliente sin nombre',
      subtitle: `${Number(p.capital || 0).toLocaleString()} ${p.moneda || 'BOB'} · ${p.plazo_meses || 12} meses`,
      icon: User,
      action: () => {
        if (onNavigateToPrestamo) {
          onNavigateToPrestamo(p.id);
        } else {
          setActiveTab('prestamos');
        }
        onClose();
      }
    }));
  }, [data?.prestamos, onNavigateToPrestamo, setActiveTab, onClose]);

  // Módulos de navegación
  const navigationItems = useMemo(() => [
    { id: 'nav-resumen', title: 'Ir a Inicio / Resumen', subtitle: 'Módulo principal del sistema', icon: Zap, action: () => { setActiveTab('resumen'); onClose(); } },
    { id: 'nav-prestamos', title: 'Ir a Cartera de Préstamos', subtitle: 'Gestión de créditos y cobranzas', icon: Landmark, action: () => { setActiveTab('prestamos'); onClose(); } },
    { id: 'nav-pagos', title: 'Ir a Egresos & Suscripciones', subtitle: 'Presupuestos y servicios mensuales', icon: Wallet, action: () => { setActiveTab('pagos'); onClose(); } },
    { id: 'nav-inventario', title: 'Ir a Inventario & Activos', subtitle: 'Control de existencias y pedidos', icon: Package, action: () => { setActiveTab('inventario'); onClose(); } },
    { id: 'nav-recordatorios', title: 'Ir a Recordatorios & Tareas', subtitle: 'Actividades programadas', icon: Bell, action: () => { setActiveTab('recordatorios'); onClose(); } },
    { id: 'nav-gimnasio', title: 'Ir a Módulo de Gimnasio', subtitle: 'Gestión de clientes y membresías', icon: Dumbbell, action: () => { setActiveTab('gimnasio'); onClose(); } },
    { id: 'nav-config', title: 'Ir a Configuración & Ajustes', subtitle: 'Preferencias, IA y respaldos', icon: Settings, action: () => { setActiveTab('configuracion'); onClose(); } },
  ], [setActiveTab, onClose]);

  // Acciones Rápidas
  const actionItems = useMemo(() => [
    {
      id: 'act-simulador',
      title: 'Abrir Simulador Financiero',
      subtitle: 'Calcular cuotas, intereses y amortización en tiempo real',
      icon: Calculator,
      action: () => {
        if (onOpenSimulador) onOpenSimulador();
        onClose();
      }
    },
    {
      id: 'act-theme',
      title: isDark ? 'Cambiar a Modo Día (Claro)' : 'Cambiar a Modo Noche (Oscuro)',
      subtitle: 'Alternar tema visual de la interfaz',
      icon: isDark ? Sun : Moon,
      action: () => {
        if (setIsDark) setIsDark(!isDark);
        onClose();
      }
    },
  ], [isDark, setIsDark, onOpenSimulador, onClose]);

  // Filtrado de elementos según búsqueda
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        { category: 'Acciones Rápidas', items: actionItems },
        { category: 'Navegación', items: navigationItems.slice(0, 5) },
        ...(clientesPrestamos.length > 0 ? [{ category: 'Clientes en Cartera', items: clientesPrestamos.slice(0, 4) }] : [])
      ];
    }

    const matchedActions = actionItems.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));
    const matchedNav = navigationItems.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));
    const matchedClientes = clientesPrestamos.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));

    const result = [];
    if (matchedActions.length > 0) result.push({ category: 'Acciones Rápidas', items: matchedActions });
    if (matchedClientes.length > 0) result.push({ category: 'Clientes Coincidentes', items: matchedClientes });
    if (matchedNav.length > 0) result.push({ category: 'Módulos', items: matchedNav });
    return result;
  }, [query, actionItems, navigationItems, clientesPrestamos]);

  // Lista plana de todos los elementos para navegación por teclado
  const flatItems = useMemo(() => {
    return filteredItems.flatMap(group => group.items);
  }, [filteredItems]);

  // Manejador de teclado
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (flatItems.length || 1)) % (flatItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  let currentIndexTracker = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 animate-in fade-in duration-150"
      style={{
        backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: t.panel,
          borderColor: t.borderLight || t.border,
          color: t.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input de Búsqueda */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
          style={{ borderColor: t.borderLight || t.border }}
        >
          <Search size={18} style={{ color: t.textMuted }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando, cliente o módulo..."
            className="flex-1 bg-transparent text-sm outline-none font-medium"
            style={{ color: t.text }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md transition-opacity hover:opacity-80"
              style={{ color: t.textMuted }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
              style={{
                backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6',
                borderColor: t.borderLight || t.border,
                color: t.textMuted,
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Lista de Resultados */}
        <div className="p-2 overflow-y-auto mac-scrollbar flex-1 space-y-3">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-medium m-0" style={{ color: t.textMuted }}>
                No se encontraron comandos ni clientes con "{query}"
              </p>
            </div>
          ) : (
            filteredItems.map(group => (
              <div key={group.category} className="space-y-1">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 block"
                  style={{ color: t.textMuted }}
                >
                  {group.category}
                </span>

                {group.items.map(item => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all border"
                      style={{
                        backgroundColor: isSelected
                          ? (isDark ? '#2C2C30' : '#EAEAEB')
                          : 'transparent',
                        borderColor: isSelected
                          ? (isDark ? '#3F3F46' : '#D4D4D8')
                          : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isSelected
                              ? (isDark ? '#38383D' : '#DCDCE0')
                              : (isDark ? '#1C1C1E' : '#F3F4F6'),
                            borderColor: t.borderLight || t.border,
                            color: t.text,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold m-0 leading-tight" style={{ color: t.text }}>
                            {item.title}
                          </p>
                          <p className="text-[10px] m-0 truncate mt-0.5" style={{ color: t.textMuted }}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <ArrowRight size={14} style={{ color: t.textMuted }} className="shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer con atajos de teclado */}
        <div
          className="px-4 py-2.5 border-t text-[10px] flex items-center justify-between shrink-0"
          style={{
            borderColor: t.borderLight || t.border,
            color: t.textMuted,
            backgroundColor: isDark ? '#141416' : '#F9FAFB',
          }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ para navegar</span>
            <span>↵ para seleccionar</span>
          </div>
          <span>Inefable QuickNav</span>
        </div>
      </div>
    </div>
  );
}
