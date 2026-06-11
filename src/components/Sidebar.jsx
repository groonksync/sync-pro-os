import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Wallet, Bell, Settings, CreditCard,
  Package, TrendingUp, Activity, Video, Briefcase, Cloud,
  Landmark, Trash2, ShoppingBag, PanelLeftClose, PanelLeftOpen,
  Sun, Moon, ShieldCheck, Building2, Workflow, Image
} from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

// ─── MENU STRUCTURE ─────────────────────────────────────────────────────────

const MENU_GROUPS = [
  {
    label: 'Principal',
    items: [
      { id: 'resumen',       label: 'Centro de Control',    icon: Activity },
      { id: 'prestamos',     label: 'Préstamos',            icon: Landmark },
      { id: 'inventario',    label: 'Empresa',              icon: Building2 },
      { id: 'pagos',         label: 'Mis Egresos',          icon: Wallet },
    ],
  },
  {
    label: 'Agencia',
    items: [
      { id: 'editor',           label: 'Agencia de Marketing', icon: Video },
      { id: 'proyectos-edicion', label: 'Proyectos de Edición', icon: Briefcase },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { id: 'drive-sovereign',   label: 'Almacenamiento',     icon: Cloud },
      { id: 'calendar',          label: 'Calendario',         icon: Calendar },
      { id: 'recordatorios',     label: 'Recordatorios',      icon: Bell },
      { id: 'flujo-trabajo',     label: 'Flujo de Trabajo',   icon: Workflow },
      { id: 'conversor-imagenes',label: 'Conversor WebP',     icon: Image },
      { id: 'boveda',            label: 'Contraseñas',        icon: ShieldCheck },
      { id: 'papelera',          label: 'Papelera',           icon: Trash2 },
    ],
  },
];

// Badge counts by item id
const getCount = (id, counts) => {
  if (id === 'prestamos') return counts?.prestamos;
  if (id === 'recordatorios') return counts?.notificaciones;
  if (id === 'editor') return counts?.meetings;
  return null;
};

// ─── SIDEBAR COMPONENT ───────────────────────────────────────────────────────

const Sidebar = ({
  activeTab, setActiveTab, counts, settings, googleUser,
  isCollapsed, setIsCollapsed, isDark, setIsDark, sidebarBg,
}) => {
  const t = useTheme(isDark);
  const [tooltip, setTooltip] = useState(null);

  const handleOpenCatalog = () => {
    if (window.location.protocol === 'file:') setActiveTab('catalogo');
    else window.open(window.location.origin + '/catalogo', '_blank');
  };

  // ── MOBILE NAV ──────────────────────────────────────────────────────────
  if (settings.isMobileMode) {
    const mobileItems = MENU_GROUPS.flatMap(g => g.items).slice(0, 5);
    return (
      <div className="fixed bottom-4 inset-x-4 z-[1000] animate-slideInUp">
        <nav style={{
          height: 64, background: '#1a1a1a', border: '1px solid #2a2a2c',
          backdropFilter: 'blur(20px)', borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '0 8px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          {mobileItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: active ? t.accentSoft : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.18s', color: active ? t.accent : '#666' }}>
                <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {active && <div style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 9999, background: t.accent }} />}
              </button>
            );
          })}
          <div style={{ width: 1, height: 24, background: '#2a2a2c' }} />
          <button onClick={() => setActiveTab('configuracion')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: activeTab === 'configuracion' ? t.accentSoft : 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'configuracion' ? t.accent : '#666' }}>
            <Settings size={17} />
          </button>
        </nav>
      </div>
    );
  }

  // ── DESKTOP SIDEBAR ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: isCollapsed ? 60 : 220,
        display: 'flex', flexDirection: 'column', height: '100%',
        padding: isCollapsed ? '16px 8px' : '16px 10px',
        backgroundColor: sidebarBg || t.bg,
        borderRight: `1px solid ${t.border}`,
        transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), padding 0.3s ease',
        position: 'relative', overflow: 'visible', flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute', right: -11, top: 48,
          width: 22, height: 22, borderRadius: 8,
          background: t.panel, border: `1px solid ${t.border}`,
          color: t.textDim, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = t.textDim}
      >
        {isCollapsed ? <PanelLeftOpen size={11} /> : <PanelLeftClose size={11} />}
      </button>

      {/* App logo mark */}
      {!isCollapsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, marginBottom: 20, height: 28, visibility: 'hidden' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'linear-gradient(135deg, #404040, #252525)',
            border: '1px solid #333', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#e0e0e0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.04em' }}>I</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>Inefable</span>
        </div>
      )}
      {isCollapsed && <div style={{ height: 48 }} />}

      {/* Navigation groups */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'visible' }} className="mac-scrollbar">
        {MENU_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: isCollapsed ? 8 : 4 }}>
            {/* Group label */}
            {!isCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700, color: '#444',
                textTransform: 'uppercase', letterSpacing: '0.14em',
                padding: '10px 8px 4px',
                fontFamily: "'Inter', sans-serif",
              }}>{group.label}</div>
            )}
            {isCollapsed && gi > 0 && (
              <div style={{ height: 1, background: '#222', margin: '6px 4px' }} />
            )}

            {group.items.map(item => {
              const active = activeTab === item.id;
              const count = getCount(item.id, counts);
              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setTooltip(item.id)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      gap: 10,
                      padding: isCollapsed ? '8px' : '7px 8px',
                      borderRadius: 10,
                      border: 'none',
                      background: active ? t.accentSoft : 'transparent',
                      color: active ? t.accent : '#666',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      position: 'relative',
                    }}
                    onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#aaa'; }}}
                    onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <div style={{
                        position: 'absolute', left: -4, top: '20%', bottom: '20%',
                        width: 3, borderRadius: 9999,
                        background: t.accent,
                        animation: 'sidebarIndicator 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : 'transparent',
                        transition: 'background 0.15s',
                      }}>
                        <item.icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                      </div>
                      {!isCollapsed && (
                        <span style={{
                          fontSize: 11.5, fontWeight: active ? 600 : 450,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          letterSpacing: '-0.005em',
                          fontFamily: "'Inter', sans-serif",
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && count > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 9999, flexShrink: 0,
                        background: active ? t.accentSoft : '#252525',
                        color: active ? t.accent : '#555',
                        border: `1px solid ${active ? t.border : '#2a2a2a'}`,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {count}
                      </span>
                    )}

                    {isCollapsed && count > 0 && (
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 7, height: 7, borderRadius: 9999,
                        background: t.accent,
                        border: `1.5px solid ${t.bg}`,
                      }} />
                    )}
                  </button>

                  {/* Tooltip on collapsed */}
                  {isCollapsed && tooltip === item.id && (
                    <div style={{
                      position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)',
                      padding: '5px 12px', borderRadius: 8, zIndex: 300,
                      background: '#1e1e1e', border: '1px solid #2e2e30',
                      color: '#d4d4d4', fontSize: 11, fontWeight: 500,
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                      animation: 'fadeIn 0.15s ease forwards',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                      {item.label}
                      {count > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: t.accent }}>
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Theme toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDark(!isDark)}
            onMouseEnter={() => setTooltip('__theme')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 8px',
              borderRadius: 10, border: 'none', background: 'transparent',
              color: '#555', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#aaa'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555'; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </div>
            {!isCollapsed && <span style={{ fontSize: 11.5, fontWeight: 450, letterSpacing: '-0.005em' }}>{isDark ? 'Modo Día' : 'Modo Noche'}</span>}
          </button>
          {isCollapsed && tooltip === '__theme' && (
            <div style={{ position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)', padding: '5px 12px', borderRadius: 8, zIndex: 300, background: '#1e1e1e', border: '1px solid #2e2e30', color: '#d4d4d4', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeIn 0.15s ease forwards' }}>
              {isDark ? 'Modo Día' : 'Modo Noche'}
            </div>
          )}
        </div>

        {/* Catálogo */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleOpenCatalog}
            onMouseEnter={() => setTooltip('__catalog')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 8px',
              borderRadius: 10, border: `1px solid ${t.border}`,
              background: t.accentSoft, color: t.accent, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={14} />
            </div>
            {!isCollapsed && <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.005em' }}>Catálogo</span>}
          </button>
          {isCollapsed && tooltip === '__catalog' && (
            <div style={{ position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)', padding: '5px 12px', borderRadius: 8, zIndex: 300, background: t.accent, color: '#111', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeIn 0.15s ease forwards' }}>
              Ver Catálogo
            </div>
          )}
        </div>

        {/* Google user chip */}
        {googleUser && !isCollapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', borderRadius: 10, marginTop: 2,
            background: '#191919', border: `1px solid ${t.border}`,
          }}>
            <img src={googleUser.picture} alt="" style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid #2e2e30', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#c0c0c0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{googleUser.name}</p>
              <p style={{ fontSize: 9, color: '#4a4a4a', margin: 0, letterSpacing: '0.04em' }}>CONECTADO</p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveTab('configuracion')}
            onMouseEnter={() => setTooltip('__settings')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 8px',
              borderRadius: 10, border: 'none',
              background: activeTab === 'configuracion' ? t.accentSoft : 'transparent',
              color: activeTab === 'configuracion' ? t.accent : '#555',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (activeTab !== 'configuracion') { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#aaa'; }}}
            onMouseOut={e => { if (activeTab !== 'configuracion') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555'; }}}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={14} strokeWidth={activeTab === 'configuracion' ? 2.2 : 1.8} />
            </div>
            {!isCollapsed && <span style={{ fontSize: 11.5, fontWeight: 450, letterSpacing: '-0.005em' }}>Configuración</span>}
            {activeTab === 'configuracion' && (
              <div style={{ position: 'absolute', left: -4, top: '20%', bottom: '20%', width: 3, borderRadius: 9999, background: t.accent }} />
            )}
          </button>
          {isCollapsed && tooltip === '__settings' && (
            <div style={{ position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)', padding: '5px 12px', borderRadius: 8, zIndex: 300, background: '#1e1e1e', border: '1px solid #2e2e30', color: '#d4d4d4', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeIn 0.15s ease forwards' }}>
              Configuración
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
