import React, { useState } from 'react';
import { 
  LayoutDashboard, Wallet, Bell, Settings, CreditCard,
  Package, TrendingUp, Activity, Video, Briefcase,
  Landmark, Trash2, ShoppingBag, PanelLeftClose, PanelLeftOpen,
  Sun, Moon, Building2, Image, Menu, X, Dumbbell
} from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

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
    label: 'Sistemas',
    items: [
      { id: 'gimnasio',       label: 'Sistema Gimnasio',    icon: Dumbbell },
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
      { id: 'recordatorios',     label: 'Recordatorios',      icon: Bell },
      { id: 'conversor-imagenes',label: 'Conversor WebP',     icon: Image },
      { id: 'papelera',          label: 'Papelera',           icon: Trash2 },
    ],
  },
];

const getCount = (id, counts) => {
  if (id === 'prestamos') return counts?.prestamos;
  if (id === 'recordatorios') return counts?.notificaciones;
  if (id === 'editor') return counts?.meetings;
  return null;
};

const Sidebar = ({
  activeTab, setActiveTab, counts, settings, googleUser,
  isCollapsed, setIsCollapsed, isDark, setIsDark, sidebarBg,
}) => {
  const t = useTheme(isDark);
  const [tooltip, setTooltip] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOpenCatalog = () => {
    if (window.location.protocol === 'file:') setActiveTab('catalogo');
    else window.open(window.location.origin + '/catalogo', '_blank');
  };

  if (settings.isMobileMode) {
    const mainMobileItems = MENU_GROUPS[0].items;
    const allItems = [
      ...MENU_GROUPS.flatMap(g => g.items),
      { id: 'configuracion', label: 'Configuración', icon: Settings }
    ];

    return (
      <>
        {/* Fullscreen Overlay Menu ("Más") */}
        {isMenuOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: isDark ? 'rgba(10, 10, 12, 0.96)' : 'rgba(244, 244, 246, 0.96)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            animation: 'fadeIn 0.2s ease-out forwards',
            fontFamily: "'Geist', 'Inter', sans-serif",
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: `1px solid ${t.border}`,
            }}>
              <div>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: 0,
                  color: t.text,
                }}>
                  Herramientas
                </h3>
                <p style={{
                  fontSize: 10,
                  color: t.textMuted,
                  margin: '4px 0 0 0',
                }}>
                  Selecciona una sección
                </p>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: t.hover,
                  border: 'none',
                  color: t.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid list of all items */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              overflowY: 'auto',
              paddingBottom: 40,
            }} className="mac-scrollbar">
              {allItems.map(item => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '16px 8px',
                      borderRadius: 16,
                      background: active ? t.accentSoft : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      border: `1px solid ${active ? t.accent : t.border}`,
                      color: active ? t.accent : t.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: active 
                        ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: active ? t.accent : t.textMuted,
                    }}>
                      <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                    </div>
                    <span style={{
                      fontSize: 9,
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      maxHeight: 24,
                      overflow: 'hidden',
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Mobile Bottom Navigation Dock */}
        <div className="fixed bottom-4 inset-x-4 z-[998] animate-slideInUp">
          <nav style={{
            height: 64, background: t.panel, border: `1px solid ${t.border}`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '0 8px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}>
            {/* First 4 principal items */}
            {mainMobileItems.map(item => {
              const active = activeTab === item.id && !isMenuOpen;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                  style={{
                    position: 'relative', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', width: 44, height: 44,
                    borderRadius: 14, background: active ? t.accentSoft : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                    color: active ? t.accent : t.textMuted,
                  }}>
                  <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {active && (
                    <div style={{
                      position: 'absolute', bottom: 4, width: 4, height: 4,
                      borderRadius: 9999, background: t.accent, boxShadow: `0 0 6px ${t.accent}`,
                    }} />
                  )}
                </button>
              );
            })}

            {/* "Más" Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', width: 44, height: 44,
                borderRadius: 14, background: isMenuOpen ? t.accentSoft : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                color: isMenuOpen ? t.accent : t.textMuted,
              }}>
              {isMenuOpen ? <X size={17} strokeWidth={2.2} /> : <Menu size={17} strokeWidth={1.8} />}
              {isMenuOpen && (
                <div style={{
                  position: 'absolute', bottom: 4, width: 4, height: 4,
                  borderRadius: 9999, background: t.accent, boxShadow: `0 0 6px ${t.accent}`,
                }} />
              )}
            </button>

            <div style={{ width: 1, height: 24, background: t.border }} />

            {/* Settings Button */}
            <button onClick={() => { setActiveTab('configuracion'); setIsMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 14,
                background: (activeTab === 'configuracion' && !isMenuOpen) ? t.accentSoft : 'transparent',
                border: 'none', cursor: 'pointer',
                color: (activeTab === 'configuracion' && !isMenuOpen) ? t.accent : t.textMuted,
              }}>
              <Settings size={17} />
            </button>
          </nav>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        width: isCollapsed ? 60 : 220,
        display: 'flex', flexDirection: 'column', height: '100%',
        padding: isCollapsed ? '12px 6px' : '14px 8px',
        backgroundColor: sidebarBg || t.bg,
        borderRight: 'none',
        transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), padding 0.35s ease',
        position: 'relative', overflow: 'visible', flexShrink: 0,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute', right: -11, top: 48,
          width: 22, height: 22, borderRadius: 7,
          background: t.panel, border: `1px solid ${t.border}`,
          color: t.textMuted, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.borderColor = t.borderLight; }}
        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.border; }}
      >
        {isCollapsed ? <PanelLeftOpen size={11} /> : <PanelLeftClose size={11} />}
      </button>

      <div style={{ height: 8 }} />

      <nav style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: 1,
        overflowY: 'auto', overflowX: 'visible',
      }} className="mac-scrollbar">
        {MENU_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: isCollapsed ? 6 : 2 }}>
            {!isCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 600, color: t.textDim,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '10px 10px 4px',
                fontFamily: "'Geist', 'Inter', sans-serif",
              }}>{group.label}</div>
            )}
            {isCollapsed && gi > 0 && (
              <div style={{ height: 1, background: t.border, margin: '6px 4px', opacity: 0.6 }} />
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
                      padding: isCollapsed ? '8px' : '7px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: active ? t.accentSoft : 'transparent',
                      color: active ? t.accent : t.textMuted,
                      cursor: 'pointer',
                      transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
                      position: 'relative',
                    }}
                    onMouseOver={e => {
                      if (!active) {
                        e.currentTarget.style.background = t.hover;
                        e.currentTarget.style.color = t.textSecondary;
                      }
                    }}
                    onMouseOut={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = t.textMuted;
                      }
                    }}
                  >
                    {active && (
                      <div style={{
                        position: 'absolute', left: -4, top: '20%', bottom: '20%',
                        width: 3, borderRadius: 9999,
                        background: t.accent,
                        boxShadow: `0 0 6px ${t.accent}40`,
                        animation: 'sidebarIndicator 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active
                          ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                          : 'transparent',
                        transition: 'background 0.18s ease',
                      }}>
                        <item.icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                      </div>
                      {!isCollapsed && (
                        <span style={{
                          fontSize: 12, fontWeight: active ? 600 : 450,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          letterSpacing: '-0.005em',
                          fontFamily: "'Geist', 'Inter', sans-serif",
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && count != null && count > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 9999, flexShrink: 0,
                        background: active ? t.accentSoft : t.surface,
                        color: active ? t.accent : t.textDim,
                        border: `1px solid ${active ? t.borderLight : t.border}`,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {count}
                      </span>
                    )}

                    {isCollapsed && count != null && count > 0 && (
                      <div style={{
                        position: 'absolute', top: 3, right: 3,
                        width: 7, height: 7, borderRadius: 9999,
                        background: t.accent,
                        border: `1.5px solid ${t.bg}`,
                        boxShadow: `0 0 4px ${t.accent}60`,
                      }} />
                    )}
                  </button>

                  {isCollapsed && tooltip === item.id && (
                    <div style={{
                      position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)',
                      padding: '6px 14px', borderRadius: 8, zIndex: 300,
                      background: t.panel, border: `1px solid ${t.borderLight}`,
                      color: t.text, fontSize: 12, fontWeight: 500,
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                      animation: 'fadeInScale 0.18s ease forwards',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                      letterSpacing: '-0.005em',
                      fontFamily: "'Geist', sans-serif",
                    }}>
                      {item.label}
                      {count != null && count > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: t.accent }}>
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

      <div style={{
        borderTop: `1px solid ${t.border}`, paddingTop: 10,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDark(!isDark)}
            onMouseEnter={() => setTooltip('__theme')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 10px',
              borderRadius: 10, border: 'none', background: 'transparent',
              color: t.textMuted, cursor: 'pointer', transition: 'all 0.18s ease',
            }}
            onMouseOver={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.textSecondary; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </div>
            {!isCollapsed && (
              <span style={{ fontSize: 12, fontWeight: 450, letterSpacing: '-0.005em', fontFamily: "'Geist', sans-serif" }}>
                {isDark ? 'Modo Día' : 'Modo Noche'}
              </span>
            )}
          </button>
          {isCollapsed && tooltip === '__theme' && (
            <div style={{
              position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)',
              padding: '6px 14px', borderRadius: 8, zIndex: 300,
              background: t.panel, border: `1px solid ${t.borderLight}`,
              color: t.text, fontSize: 12, fontWeight: 500,
              whiteSpace: 'nowrap', pointerEvents: 'none',
              animation: 'fadeInScale 0.18s ease forwards',
              fontFamily: "'Geist', sans-serif",
            }}>
              {isDark ? 'Modo Día' : 'Modo Noche'}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={handleOpenCatalog}
            onMouseEnter={() => setTooltip('__catalog')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 10px',
              borderRadius: 10, border: `1px solid ${t.borderLight}`,
              background: t.accentSoft, color: t.accent, cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = t.accentSoftHover;
              e.currentTarget.style.borderColor = t.accent;
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = t.accentSoft;
              e.currentTarget.style.borderColor = t.borderLight;
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={14} />
            </div>
            {!isCollapsed && (
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em', fontFamily: "'Geist', sans-serif" }}>
                Catálogo
              </span>
            )}
          </button>
          {isCollapsed && tooltip === '__catalog' && (
            <div style={{
              position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)',
              padding: '6px 14px', borderRadius: 8, zIndex: 300,
              background: t.accent, color: '#0A0A0C', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap', pointerEvents: 'none',
              animation: 'fadeInScale 0.18s ease forwards',
              fontFamily: "'Geist', sans-serif",
            }}>
              Ver Catálogo
            </div>
          )}
        </div>

        {googleUser && !isCollapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 10, marginTop: 2,
            background: t.surface, border: `1px solid ${t.border}`,
          }}>
            <img src={googleUser.picture} alt="" style={{
              width: 24, height: 24, borderRadius: 7,
              border: `1px solid ${t.borderLight}`, flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {googleUser.name}
              </p>
              <p style={{ fontSize: 9, color: t.textDim, margin: 0, letterSpacing: '0.04em' }}>
                CONECTADO
              </p>
            </div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveTab('configuracion')}
            onMouseEnter={() => setTooltip('__settings')}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 10, padding: isCollapsed ? 8 : '7px 10px',
              borderRadius: 10, border: 'none',
              background: activeTab === 'configuracion' ? t.accentSoft : 'transparent',
              color: activeTab === 'configuracion' ? t.accent : t.textMuted,
              cursor: 'pointer', transition: 'all 0.18s ease',
            }}
            onMouseOver={e => {
              if (activeTab !== 'configuracion') {
                e.currentTarget.style.background = t.hover;
                e.currentTarget.style.color = t.textSecondary;
              }
            }}
            onMouseOut={e => {
              if (activeTab !== 'configuracion') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = t.textMuted;
              }
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={14} strokeWidth={activeTab === 'configuracion' ? 2.2 : 1.8} />
            </div>
            {!isCollapsed && (
              <span style={{ fontSize: 12, fontWeight: 450, letterSpacing: '-0.005em', fontFamily: "'Geist', sans-serif" }}>
                Configuración
              </span>
            )}
            {activeTab === 'configuracion' && (
              <div style={{
                position: 'absolute', left: -4, top: '20%', bottom: '20%',
                width: 3, borderRadius: 9999, background: t.accent,
              }} />
            )}
          </button>
          {isCollapsed && tooltip === '__settings' && (
            <div style={{
              position: 'absolute', left: 66, top: '50%', transform: 'translateY(-50%)',
              padding: '6px 14px', borderRadius: 8, zIndex: 300,
              background: t.panel, border: `1px solid ${t.borderLight}`,
              color: t.text, fontSize: 12, fontWeight: 500,
              whiteSpace: 'nowrap', pointerEvents: 'none',
              animation: 'fadeInScale 0.18s ease forwards',
              fontFamily: "'Geist', sans-serif",
            }}>
              Configuración
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
