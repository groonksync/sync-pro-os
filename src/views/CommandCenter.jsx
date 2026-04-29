import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, LayoutDashboard, Briefcase, Calendar, Clock, 
  Bell, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Zap, DollarSign, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ─── Reloj en Vivo ─────────────────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-neutral-400 tabular-nums text-xs tracking-widest">
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
    </span>
  );
};

// ─── Saludo dinámico ───────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días.';
  if (h >= 12 && h < 19) return 'Buenas tardes.';
  return 'Buenas noches.';
};

// ─── Mini barra de estado de préstamos ─────────────────────────────────────────
const LoanStatusBar = ({ prestamos }) => {
  const total = prestamos.length || 1;
  const activos   = prestamos.filter(p => p.estado !== 'Alerta' && p.estado !== 'Pagado').length;
  const alertas   = prestamos.filter(p => p.estado === 'Alerta').length;
  const pagados   = prestamos.filter(p => p.estado === 'Pagado').length;

  const pct = (n) => `${Math.round((n / total) * 100)}%`;

  return (
    <div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-2">
        <div className="bg-emerald-500/70 transition-all duration-700" style={{ width: pct(pagados) }} />
        <div className="bg-amber-500/70 transition-all duration-700"  style={{ width: pct(activos) }} />
        <div className="bg-rose-500/70 transition-all duration-700"   style={{ width: pct(alertas) }} />
      </div>
      <div className="flex gap-4 text-[9px] uppercase tracking-widest font-bold">
        <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>Pagados {pagados}</span>
        <span className="text-amber-500  flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500  inline-block"/>Activos {activos}</span>
        <span className="text-rose-500   flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500   inline-block"/>Alertas {alertas}</span>
      </div>
    </div>
  );
};

// ─── Tarjeta de Estadística ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'text-white', accent }) => (
  <div className={`bg-white/[0.02] border ${accent || 'border-white/[0.05]'} rounded-xl p-5 flex flex-col justify-between hover:bg-white/[0.03] transition-colors group`}>
    <p className={`text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5`}>
      <Icon size={12} className="opacity-70"/>{label}
    </p>
    <p className={`text-3xl font-light ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-neutral-600 mt-1">{sub}</p>}
  </div>
);

// ─── Componente Principal ──────────────────────────────────────────────────────
const CommandCenter = ({ meetingsList = [], data = { prestamos: [] }, proyectos = [], setData }) => {
  const [markingPaid, setMarkingPaid] = useState(null);

  // ── Cálculos financieros ──────────────────────────────────────────────────
  const totalCapital    = data.prestamos.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
  const totalInteres    = data.prestamos.reduce((acc, p) => acc + ((parseFloat(p.capital) || 0) * (parseFloat(p.interes) || 0) / 100), 0);
  const totalPorCobrar  = totalCapital + totalInteres;

  // ── Ingresos del mes (préstamos cobrados con fecha fin en el mes actual) ──
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const ingresosMes = data.prestamos
    .filter(p => p.estado === 'Pagado' && p.fin?.startsWith(mesActual))
    .reduce((acc, p) => acc + (parseFloat(p.capital) || 0) + ((parseFloat(p.capital) || 0) * (parseFloat(p.interes) || 0) / 100), 0);

  // ── Alertas de cobro urgente ──────────────────────────────────────────────
  const hoyStr = ahora.toISOString().split('T')[0];
  const proximosCobros = data.prestamos.filter(p => {
    if (!p.fin || p.estado === 'Pagado') return false;
    return p.estado === 'Alerta' || p.fin <= hoyStr;
  });

  // ── Reuniones pendientes ──────────────────────────────────────────────────
  const reunionesPendientes = meetingsList.filter(m => m.estado !== 'Finalizado');

  // ── Proyectos activos ─────────────────────────────────────────────────────
  const proyectosActivos = proyectos.filter(p => p.estado !== 'Entregado').length;

  // ── Marcar préstamo como pagado ───────────────────────────────────────────
  const marcarPagado = async (prestamo) => {
    setMarkingPaid(prestamo.id);
    try {
      const updated = { ...prestamo, estado: 'Pagado' };
      const { error } = await supabase.from('prestamos').upsert(updated);
      if (error) throw error;
      if (setData) {
        setData(prev => ({
          ...prev,
          prestamos: prev.prestamos.map(p => p.id === prestamo.id ? updated : p)
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingPaid(null);
    }
  };

  // ── Días al vencimiento ───────────────────────────────────────────────────
  const diasAlVencimiento = (fin) => {
    if (!fin) return null;
    const diff = Math.ceil((new Date(fin) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px]">
      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-1">{getGreeting()}</h2>
          <p className="text-xs text-neutral-500 font-medium flex items-center gap-2">
            Resumen operativo de hoy
            <span className="text-neutral-700">·</span>
            <LiveClock />
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono text-white font-light">
            {totalPorCobrar.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-sm text-neutral-500 ml-1">Bs.</span>
          </p>
          <p className="text-[10px] text-amber-500 tracking-widest uppercase mt-0.5 font-bold">Capital Total Proyectado</p>
        </div>
      </header>

      {/* ── Grid Principal ────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 mb-6">
        
        {/* Columna izquierda: stats + alertas */}
        <div className="col-span-8 flex flex-col gap-5">

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-3 gap-5">
            <StatCard
              icon={LayoutDashboard}
              label="Capital Prestado"
              value={`${totalCapital.toLocaleString('es-BO', { maximumFractionDigits: 0 })} Bs.`}
              color="text-white"
            />
            <StatCard
              icon={TrendingUp}
              label="Interés Mensual"
              value={`${totalInteres.toLocaleString('es-BO', { maximumFractionDigits: 0 })} Bs.`}
              color="text-amber-500"
              accent="border-amber-500/10"
            />
            <StatCard
              icon={DollarSign}
              label="Cobrado Este Mes"
              value={`${ingresosMes.toLocaleString('es-BO', { maximumFractionDigits: 0 })} Bs.`}
              color="text-emerald-400"
              accent="border-emerald-500/10"
            />
          </div>

          {/* Barra de estado de la cartera */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity size={12}/> Estado de la Cartera — {data.prestamos.length} préstamos
            </p>
            <LoanStatusBar prestamos={data.prestamos} />
          </div>

          {/* Alertas de cobro urgente */}
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-5">
            <h3 className="text-[11px] text-rose-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-1.5">
              <Bell size={12}/> Alertas de Cobro Urgente
              {proximosCobros.length > 0 && (
                <span className="ml-1 text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                  {proximosCobros.length}
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {proximosCobros.length > 0 ? proximosCobros.map(p => {
                const dias = diasAlVencimiento(p.fin);
                return (
                  <div key={p.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                        <AlertCircle size={16}/>
                      </div>
                      <div>
                        <p className="text-xs text-white font-bold">{p.nombre}</p>
                        <p className="text-[10px] text-neutral-500">
                          Vence: {p.fin} | Capital: {parseFloat(p.capital).toLocaleString()} Bs.
                          {dias !== null && (
                            <span className={`ml-2 font-bold ${dias < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                              {dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : dias === 0 ? 'Vence hoy' : `${dias}d restantes`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => marcarPagado(p)}
                      disabled={markingPaid === p.id}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={12}/>
                      {markingPaid === p.id ? 'Guardando...' : 'Marcar Pagado'}
                    </button>
                  </div>
                );
              }) : (
                <p className="text-[10px] text-neutral-600 italic">No hay cobros urgentes programados para hoy.</p>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: agenda + proyectos */}
        <div className="col-span-4 flex flex-col gap-5">

          {/* Indicadores rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-light text-white">{reunionesPendientes.length}</p>
              <p className="text-[9px] uppercase tracking-widest text-neutral-500 mt-1 flex items-center gap-1"><Calendar size={9}/> Reuniones</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-light text-amber-500">{proximosCobros.length}</p>
              <p className="text-[9px] uppercase tracking-widest text-neutral-500 mt-1 flex items-center gap-1"><Zap size={9}/> Alertas</p>
            </div>
          </div>

          {/* Agenda de reuniones */}
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5 flex flex-col flex-1">
            <h3 className="text-[11px] text-amber-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-1.5">
              <Calendar size={12}/> Agenda Pendiente
            </h3>
            <div className="space-y-0 flex-1 overflow-y-auto mac-scrollbar">
              {reunionesPendientes.length > 0 ? reunionesPendientes.map(m => (
                <div key={m.id} className="flex gap-3 group cursor-pointer py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                  <div className="flex flex-col items-center justify-center w-8 h-8 rounded bg-white/[0.02] border border-white/5 shrink-0">
                    <span className="text-[10px] font-bold text-white leading-none">{m.fecha?.split('-')[2] || '??'}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-xs text-white font-medium group-hover:text-amber-500 transition-colors truncate">{m.cliente}</p>
                    <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Clock size={9}/> {m.estado}
                      {m.presupuesto > 0 && <span className="ml-auto text-emerald-500 font-mono font-bold">${m.presupuesto}</span>}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-neutral-600 italic">No hay reuniones pendientes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
