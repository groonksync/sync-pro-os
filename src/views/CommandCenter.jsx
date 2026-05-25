import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, Package, BarChart3, CalendarDays, Box, ShieldCheck,
  RefreshCw, Bell, CheckSquare, Video, ChevronRight, UserPlus, Clock
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';
import { getTheme } from '../lib/theme';

const GoogleLogo = ({ size = 18 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 18 }) => <DeepSeek.Color size={size} />;

const CommandCenter = ({ meetingsList = [], data = { prestamos: [], productos: [], recordatorios: [] }, servicios = [], settings, isDark, onNavigateToPrestamo, onQuickPayment }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const isMobile = settings?.isMobileMode;
  
  const [aiBalance, setAiBalance] = useState('...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAiBalance = async () => {
    setIsRefreshing(true);
    const balance = await aiService.fetchBalance(settings);
    setAiBalance(balance);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAiBalance();
  }, [settings.aiProvider, settings.deepseekKey]);

  // LÓGICA DE DATOS: FINANZAS
  const listaPrestamos = Array.isArray(data?.prestamos) ? data.prestamos.filter(p => p && p.id) : [];
  const totalCapital = listaPrestamos.reduce((acc, p) => acc + (parseFloat(p?.capital) || 0), 0);
  const totalInteresMensual = listaPrestamos.reduce((acc, p) => {
    const cap = parseFloat(p?.capital) || 0;
    const int = parseFloat(p?.interes) || 0;
    return acc + (cap * (int / 100));
  }, 0);

  const listaServicios = Array.isArray(servicios) ? servicios.filter(s => s && s.id) : [];
  const totalEgresos = listaServicios.reduce((acc, s) => acc + (parseFloat(s?.monto) || 0), 0);

  // LÓGICA DE DATOS: INVENTARIO
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const valorInventario = listaProductos.reduce((acc, p) => acc + (parseFloat(p.precio) * (parseInt(p.stock) || 0)), 0);
  const stockBajo = listaProductos.filter(p => (parseInt(p.stock) || 0) <= 5);

  // LÓGICA DE DATOS: RECORDATORIOS
  const listaRecordatorios = Array.isArray(data?.recordatorios) ? data.recordatorios : [];
  const tareasPendientes = listaRecordatorios.filter(r => r.estado === 'Pendiente').sort((a, b) => {
    const pPriority = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
    return pPriority[a.prioridad] - pPriority[b.prioridad];
  });

  // LÓGICA DE DATOS: VIDEO
  const listaVideos = Array.isArray(meetingsList) ? meetingsList : [];

  // Cobros con timeline corregida: primer pago = 1 mes después del inicio
  const allCobros = listaPrestamos.map(p => {
    if (!p?.inicio) return null;
    const start = new Date(p.inicio);
    if (isNaN(start.getTime())) return null;
    
    const billingDay = start.getDate();
    let nextDate = new Date(hoy.getFullYear(), hoy.getMonth(), billingDay);
    
    if (nextDate < hoy && nextDate.toDateString() !== hoy.toDateString()) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    const diff = Math.ceil((nextDate - hoy) / (1000 * 60 * 60 * 24));
    const isPaidThisMonth = (Array.isArray(p.pagos) ? p.pagos : []).includes(mesActual);
    return { ...p, nextDate, diffDays: diff, isPaidThisMonth };
  }).filter(p => p !== null);

  const cobrosActivos = allCobros.filter(p => !p.isPaidThisMonth && p.diffDays <= 7).sort((a, b) => a.diffDays - b.diffDays);

  // NUEVOS PRESTAMISTAS RECIENTES (últimos 30 días)
  const nuevosPrestamistas = listaPrestamos.filter(p => {
    if (!p?.inicio) return false;
    const start = new Date(p.inicio);
    if (isNaN(start.getTime())) return false;
    const diffDays = Math.floor((hoy - start) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }).sort((a, b) => new Date(b.inicio) - new Date(a.inicio));

  const ActiveAILogo = settings.aiProvider === 'deepseek' ? DeepSeekLogo : GoogleLogo;

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    marginBottom: '20px',
    borderBottom: `1px solid ${t.border}`,
  };

  return (
    <div className="animate-in fade-in duration-500 w-full pb-24">
      {/* HEADER */}
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
            Centro de Control
          </h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
            Panel de monitoreo operativo
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ActiveAILogo />
              <div>
                <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Modelo de IA</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, marginTop: '2px', margin: 0 }}>
                  {aiBalance} <span style={{ fontSize: '8px', color: t.textDim }}>{settings.aiProvider === 'deepseek' ? 'USD' : 'INF'}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={fetchAiBalance} 
              className={isRefreshing ? 'animate-spin' : ''}
              style={{ padding: '4px', borderRadius: '12px', border: 'none', background: 'transparent', color: t.textDim, cursor: 'pointer' }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
          
          <div style={{ padding: '8px 14px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
            <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Sistema</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: t.success, marginTop: '2px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.success, display: 'inline-block' }}></span>
              Operativo
            </p>
          </div>
        </div>
      </div>

      {/* PRESTAMISTAS RECIENTES */}
      {nuevosPrestamistas.length > 0 && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <UserPlus size={16} color={t.accent} />
            <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.text, margin: 0 }}>
              Nuevos Prestamistas
            </h3>
            <span style={{ fontSize: '10px', color: t.textDim, marginLeft: 'auto' }}>
              {nuevosPrestamistas.length} {nuevosPrestamistas.length === 1 ? 'nuevo' : 'nuevos'} en los últimos 30 días
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {nuevosPrestamistas.slice(0, 5).map(p => (
              <div 
                key={p.id} 
                onClick={() => onNavigateToPrestamo && onNavigateToPrestamo(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.backgroundColor = t.hoverActive; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.backgroundColor = t.input; }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                  backgroundColor: t.accentSoft, color: t.accent,
                }}>
                  {p.nombre?.charAt(0) || '?'}
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: t.text, margin: 0 }}>{p.nombre || 'Sin nombre'}</p>
                  <p style={{ fontSize: '9px', color: t.textDim, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    {p.inicio ? new Date(p.inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Hoy'}
                  </p>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: t.accent, margin: '0 0 0 auto' }}>
                  {parseFloat(p.capital).toLocaleString()} <span style={{ fontSize: '8px' }}>{p.moneda}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILA 1: KPIs PRINCIPALES */}
      <section className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ marginBottom: '24px' }}>
        <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft }}>
              <Wallet size={18} color={t.accent} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '12px', backgroundColor: t.accentSoft, color: t.accent }}>
              Capital
            </span>
          </div>
          <p style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Activos en Calle</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '4px' }}>
            {totalCapital.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '16px', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.border}` }}>
            <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Rendimiento Mensual</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: t.success, margin: 0 }}>+{totalInteresMensual.toLocaleString()} BS</p>
          </div>
        </div>

        <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft }}>
              <Package size={18} color={t.accent} />
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '4px 10px', borderRadius: '12px',
              backgroundColor: stockBajo.length > 0 ? 'rgba(239, 68, 68, 0.10)' : t.accentSoft,
              color: stockBajo.length > 0 ? t.danger : t.accent,
            }}>
              {stockBajo.length > 0 ? 'Stock Bajo' : 'Inventario'}
            </span>
          </div>
          <p style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Valor de Almacén</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '4px' }}>
            {valorInventario.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '16px', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.border}` }}>
            <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Artículos Totales</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: t.text, margin: 0 }}>{listaProductos.length} Artículos</p>
          </div>
        </div>
      </section>

      {/* FILA 2: RENDIMIENTO + TAREAS */}
      <section className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`} style={{ marginBottom: '24px' }}>
         
         <div className={`${isMobile ? '' : 'col-span-7'}`} style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
               <div>
                  <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.text, margin: 0 }}>Rendimiento Operativo</h3>
                  <p style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginTop: '4px', margin: 0 }}>Gestión de capital en circulación</p>
               </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
               <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                        <th style={{ padding: '14px 20px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Activo</th>
                        <th style={{ padding: '14px 20px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Fecha Cobro</th>
                        <th style={{ padding: '14px 20px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Estado</th>
                        <th style={{ padding: '14px 20px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Monto</th>
                     </tr>
                  </thead>
                  <tbody>
                     {listaPrestamos.slice(0, 5).map(p => {
                        const pData = allCobros.find(c => t.id === p.id);
                        const isPaid = pData?.isPaidThisMonth;
                        return (
                           <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ padding: '14px 20px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, backgroundColor: t.accentSoft, color: t.accent }}>
                                       {p.nombre?.charAt(0) || '?'}
                                    </div>
                                    <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0 }}>{p.nombre}</p>
                                 </div>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                 <p style={{ fontSize: '10px', fontWeight: 500, color: t.textMuted, margin: 0 }}>
                                    {pData?.nextDate ? pData.nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'N/A'}
                                 </p>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                       type="checkbox" 
                                       checked={isPaid || false} 
                                       onChange={() => onQuickPayment && onQuickPayment(p.id)}
                                       style={{ width: '14px', height: '14px', borderRadius: '4px', accentColor: t.accent, cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: isPaid ? t.success : t.warning }}>
                                      {isPaid ? 'Pagado' : 'Pendiente'}
                                    </span>
                                 </div>
                              </td>
                              <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, fontSize: '11px', color: t.text }}>
                                 {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} BS
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         <div className={`${isMobile ? '' : 'col-span-5'} space-y-4`}>
            <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
               <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Bell size={14} color={t.warning} /> Pulso de Tareas
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tareasPendientes.slice(0, 3).map(task => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px', borderRadius: '12px',
                      backgroundColor: t.input, border: `1px solid ${t.border}`,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.textDim; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, backgroundColor: task.prioridad === 'Crítica' ? t.danger : task.prioridad === 'Alta' ? t.warning : t.accent }}></div>
                          <div>
                             <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0 }}>{task.titulo}</p>
                             <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>{task.categoria} • {task.prioridad}</p>
                          </div>
                       </div>
                       <button style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: t.textDim, cursor: 'pointer' }}>
                          <CheckSquare size={14} />
                       </button>
                    </div>
                  ))}
                  {tareasPendientes.length === 0 && (
                     <div style={{ padding: '24px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '12px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Sistema de Tareas Limpio</p>
                     </div>
                  )}
               </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
               <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Video size={14} color={t.accent} /> Cola de Producción
               </h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Proyectos Activos</p>
                     <p style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, marginTop: '4px' }}>{listaVideos.length}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                     <div style={{ height: '6px', borderRadius: '12px', overflow: 'hidden', backgroundColor: t.input, marginBottom: '8px' }}>
                        <div style={{ height: '100%', width: '66%', borderRadius: '12px', backgroundColor: t.accent }}></div>
                     </div>
                     <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Capacidad de Renderizado</p>
                  </div>
               </div>
            </div>
         </div>

      </section>

      {/* FILA 3: STATUS RÁPIDO */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Egresos Mes', val: totalEgresos.toLocaleString(), icon: BarChart3, color: t.danger },
           { label: 'Próximos Cobros', val: cobrosActivos.length, icon: CalendarDays, color: t.warning },
           { label: 'Artículos Stock Bajo', val: stockBajo.length, icon: Box, color: '#d4873a' },
           { label: 'Nuevos Prestamistas', val: nuevosPrestamistas.length, icon: UserPlus, color: t.accent }
         ].map(item => (
            <div key={item.label} style={{
              padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hoverActive; }}>
               <item.icon size={18} color={item.color} style={{ marginBottom: '10px' }} />
               <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>{item.label}</p>
               <p style={{ fontSize: '12px', fontWeight: 700, color: t.text, marginTop: '4px' }}>{item.val}</p>
            </div>
         ))}
      </section>

    </div>
  );
};

export default CommandCenter;
