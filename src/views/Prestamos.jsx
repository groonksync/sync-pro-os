import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, ChevronRight, ArrowLeft, Save, FileSignature, Smartphone, DollarSign,
  ExternalLink, User, CreditCard, ArrowRight, ShieldCheck, CalendarDays, CheckCircle2,
  Check, X, AlertCircle, Trash2, AlertTriangle, Edit3, Search, Eye, EyeOff, Clock,
  MoreHorizontal, Filter, Download, Printer, RefreshCw, TrendingUp, Percent,
  Heart, BarChart3, PieChart, Wallet, Bookmark
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';
import FormularioPrestamo from '../components/FormularioPrestamo';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAmortizacion, useAmortizacionGlobal, generarCronograma, generarCronogramaDiario, calcularResumen, proyectarSiguientes } from '../hooks/useAmortizacion';
import { usePrestamoCategorias } from '../hooks/usePrestamoCategorias';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { uploadPdfToDrive, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarList } from '../lib/googleApi';

// ─── AUXILIARES DE PARSEO Y SERIALIZACIÓN DE EVENTOS CALENDAR ────────────────
const parseCalendarEvents = (notasText) => {
  if (!notasText) return {};
  const match = notasText.match(/\[google_calendar_events:\s*({.*?})\]/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return {};
    }
  }
  return {};
};

const serializeCalendarEvents = (notasText, eventMap) => {
  const cleanNotas = notasText ? notasText.replace(/\[google_calendar_events:\s*({.*?})\]/, '').trim() : '';
  return `${cleanNotas}\n\n[google_calendar_events: ${JSON.stringify(eventMap)}]`.trim();
};

const syncLoanToGoogleCalendar = async (prestamo, token) => {
  if (!token || !prestamo?.id) return null;
  
  try {
    const existingEvents = parseCalendarEvents(prestamo.notas);
    const updatedEvents = { ...existingEvents };
    const isDiario = prestamo.tipo_pago === 'diario';
    
    if (isDiario) {
      const capitalNum = parseFloat(prestamo.capital) || 0;
      const tasaInteres = parseFloat(prestamo.interes) || 0;
      const meses = parseInt(prestamo.plazo_meses) || 1;
      const totalDias = meses * 30;
      const interesTotal = capitalNum * (tasaInteres / 100) * meses;
      const capitalDiario = capitalNum / totalDias;
      const interesDiario = interesTotal / totalDias;
      const cuotaDiaria = capitalDiario + interesDiario;
      
      const eventKey = 'daily_recurrence';
      const eventId = existingEvents[eventKey];
      
      const eventData = {
        summary: `💸 Cobro Diario: ${Math.round(cuotaDiaria)} ${prestamo.moneda} — ${prestamo.nombre}`,
        description: `--- DETALLE DE COBRO DIARIO ---\nCliente: ${prestamo.nombre}\nCI: ${prestamo.ci || '---'}\nTeléfono: ${prestamo.telefono || '---'}\nCapital Invertido: ${prestamo.capital} ${prestamo.moneda}\nInterés mensual: ${prestamo.interes}%\nCuota diaria: ${cuotaDiaria.toFixed(2)} ${prestamo.moneda} (Capital: ${capitalDiario.toFixed(2)} + Interés: ${interesDiario.toFixed(2)})\nDuración: ${totalDias} días\nInicio: ${prestamo.inicio}\nFin: ${prestamo.fin}\n---`,
        start: { date: prestamo.inicio },
        end: { date: new Date(new Date(prestamo.inicio).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        recurrence: [`RRULE:FREQ=DAILY;COUNT=${totalDias}`]
      };
      
      if (eventId) {
        try {
          await updateCalendarEvent(token, eventId, eventData);
        } catch (err) {
          const res = await createCalendarEvent(token, eventData);
          updatedEvents[eventKey] = res.id;
        }
      } else {
        const res = await createCalendarEvent(token, eventData);
        updatedEvents[eventKey] = res.id;
      }
    } else {
      // Para préstamos mensuales, generamos el cronograma
      // Importamos generarCronograma localmente
      const cuotas = generarCronograma(prestamo);
      
      for (const cuota of cuotas) {
        const eventId = existingEvents[cuota.key];
        const startDateStr = cuota.fechaVencimiento;
        const nextDay = new Date(new Date(startDateStr).getTime() + 24 * 60 * 60 * 1000);
        const endDateStr = nextDay.toISOString().split('T')[0];
        
        const isPaid = (prestamo.pagos || []).includes(cuota.key);
        const statusLabel = isPaid ? 'PAGADO' : cuota.estado === 'vencido' ? 'VENCIDO' : 'PTE';
        const iconPrefix = isPaid ? '✅' : '💸';
        
        const eventData = {
          summary: `${iconPrefix} [${statusLabel}] Interés: ${cuota.interes} ${prestamo.moneda} — ${prestamo.nombre}`,
          description: `--- DETALLE DE COBRO DE CUOTA ---\nCliente: ${prestamo.nombre}\nCI: ${prestamo.ci || '---'}\nTeléfono: ${prestamo.telefono || '---'}\nCapital original: ${prestamo.capital} ${prestamo.moneda}\nTasa de interés: ${prestamo.interes}%\nCuota correspondiente: ${cuota.label}\nMonto a cobrar: ${cuota.interes} ${prestamo.moneda}\nMora acumulada: ${cuota.mora || 0} ${prestamo.moneda}\nTotal a cobrar: ${cuota.total + (cuota.mora || 0)} ${prestamo.moneda}\nEstado del pago: ${statusLabel}\n---`,
          start: { date: startDateStr },
          end: { date: endDateStr }
        };
        
        if (eventId) {
          try {
            await updateCalendarEvent(token, eventId, eventData);
          } catch (err) {
            const res = await createCalendarEvent(token, eventData);
            updatedEvents[cuota.key] = res.id;
          }
        } else {
          const res = await createCalendarEvent(token, eventData);
          updatedEvents[cuota.key] = res.id;
        }
      }
    }
    
    const newNotas = serializeCalendarEvents(prestamo.notas, updatedEvents);
    const { error } = await supabase.from('prestamos').update({ notas: newNotas }).eq('id', prestamo.id);
    if (error) console.error('Error saving calendar metadata to loan:', error);
    
    return newNotas;
  } catch (err) {
    console.error('Error in syncLoanToGoogleCalendar:', err);
    return null;
  }
};

const generateReciboPDF = (recibo, prestamo, isDark = false) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 20;
  
  // Colores
  const BG = isDark ? '#0d0d0f' : '#ffffff';
  const TEXT_MAIN = isDark ? '#f8fafc' : '#0f172a';
  const TEXT_MID = isDark ? '#94a3b8' : '#475569';
  const TEXT_DIM = isDark ? '#64748b' : '#94a3b8';
  const ACCENT = '#10b981'; // Green accent for success / paid
  const BORDER = isDark ? '#1e293b' : '#e2e8f0';
  const PANEL = isDark ? '#151518' : '#f8fafc';
  const TABLE_HEADER_BG = isDark ? '#1e293b' : '#f1f5f9';

  // Background
  pdf.setFillColor(BG);
  pdf.rect(0, 0, 210, 297, 'F');

  let y = M;

  // ── HEADER ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(ACCENT);
  pdf.text('RECIBO DE PAGO', M, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('COMPROBANTE OFICIAL', W - M, y, { align: 'right' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(recibo.numero || 'REC-XXXXXX', W - M, y + 6, { align: 'right' });

  y += 20;

  // Divider
  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, W - M, y);
  y += 10;

  // ── DATOS GENERALES (2 Columns) ──
  const col2 = W / 2 + 5;

  // Column 1: CLIENTE
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('PAGADOR / DEUDOR', M, y);

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(recibo.prestamistaName || prestamo?.nombre || '---', M, y);

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(TEXT_MID);
  if (prestamo?.ci) pdf.text(`CI: ${prestamo.ci}`, M, y);
  y += 4.5;
  if (prestamo?.telefono) pdf.text(`Tel: ${prestamo.telefono}`, M, y);

  // Column 2: EMISIÓN & DETALLES
  let yCol2 = y - 14.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('FECHA DE PAGO', col2, yCol2);

  yCol2 += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(safeFormatDate(recibo.fechaEmision, { year: 'numeric', month: 'long', day: 'numeric' }), col2, yCol2);

  yCol2 += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('MÉTODO DE PAGO', col2, yCol2);

  yCol2 += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(ACCENT);
  pdf.text(recibo.metodo?.toUpperCase() || 'EFECTIVO', col2, yCol2);

  y = Math.max(y, yCol2) + 12;

  // ── CONTRATO REFERENCIA PANEL ──
  pdf.setFillColor(PANEL);
  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(M, y, W - 2*M, 20, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('REFERENCIA DEL CONTRATO', M + 5, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(TEXT_MAIN);
  const capitalStr = prestamo ? `${parseFloat(prestamo.capital).toLocaleString()} ${prestamo.moneda}` : '---';
  const interesStr = prestamo ? `${prestamo.interes}% mensual` : '---';
  pdf.text(`Préstamo de ${capitalStr} al ${interesStr}`, M + 5, y + 13);
  pdf.text(`Fecha Inicio: ${safeFormatDate(prestamo?.inicio)} | Fin: ${safeFormatDate(prestamo?.fin)}`, W - M - 5, y + 13, { align: 'right' });

  y += 28;

  // ── CONCEPTO DE PAGO ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('CONCEPTO', M, y);
  
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(recibo.concepto || 'Pago de Cuota', M, y);

  y += 10;

  // ── DESGLOSE TABLE ──
  const moneda = prestamo?.moneda || 'BOB';
  const rows = [];
  if (parseFloat(recibo.montoInteres) > 0) {
    rows.push(['Pago de Intereses', `${parseFloat(recibo.montoInteres).toLocaleString()} ${moneda}`]);
  }
  if (parseFloat(recibo.montoMora) > 0) {
    rows.push(['Cargos por Mora', `${parseFloat(recibo.montoMora).toLocaleString()} ${moneda}`]);
  }
  if (parseFloat(recibo.montoCapital) > 0) {
    rows.push(['Amortización de Capital', `${parseFloat(recibo.montoCapital).toLocaleString()} ${moneda}`]);
  }
  if (parseFloat(recibo.montoAjustes) > 0) {
    rows.push(['Ajustes / Descuentos', `-${parseFloat(recibo.montoAjustes).toLocaleString()} ${moneda}`]);
  }

  const totalCalculado = (parseFloat(recibo.montoInteres) || 0) + 
                         (parseFloat(recibo.montoMora) || 0) + 
                         (parseFloat(recibo.montoCapital) || 0) - 
                         (parseFloat(recibo.montoAjustes) || 0);

  pdf.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [['Descripción de Conceptos', 'Monto']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: TEXT_MAIN,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      textColor: TEXT_MID,
      fontSize: 9.5,
      halign: 'left',
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold', textColor: TEXT_MAIN }
    },
    styles: {
      lineColor: BORDER,
      lineWidth: 0.1,
    }
  });

  y = (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? pdf.lastAutoTable.finalY + 12 : y + 30;

  // Total Box
  pdf.setFillColor(PANEL);
  pdf.roundedRect(W - M - 70, y, 70, 16, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(TEXT_MID);
  pdf.text('TOTAL RECIBIDO', W - M - 65, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(ACCENT);
  pdf.text(`${totalCalculado.toLocaleString()} ${moneda}`, W - M - 5, y + 11.5, { align: 'right' });

  y += 32;

  // Watermark "PAGADO"
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(40);
  pdf.setTextColor(isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)');
  pdf.text('PAGADO', W / 2, y - 8, { align: 'center', angle: 12 });

  // Signature lines
  const sigW = 50;
  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.3);
  
  pdf.line(M, y, M + sigW, y);
  pdf.line(W - M - sigW, y, W - M, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('FIRMA CLIENTE', M + sigW / 2, y + 5, { align: 'center' });
  pdf.text('FIRMA ACREEDOR', W - M - sigW / 2, y + 5, { align: 'center' });

  // Small note
  y += 15;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('Este recibo constituye una constancia legal de pago del monto y conceptos indicados.', W / 2, y, { align: 'center' });

  return pdf;
};

// ─── SAFE DATE FORMATTING HELPERS ────────────────────────────
const safeFormatDate = (dateVal, options = { day: '2-digit', month: 'short', year: 'numeric' }, fallback = '---') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('es-ES', options);
  } catch (e) {
    return fallback;
  }
};

const getNextMonthDateFormatted = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    d.setMonth(d.getMonth() + 1);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) {
    return 'N/A';
  }
};

// ─── ESTILOS TOAST ───────────────────────────────────────────
const toastStyles = {
  success: { bg: 'rgba(78, 201, 176, 0.10)', border: 'rgba(78, 201, 176, 0.30)', icon: CheckCircle2, color: '#4ec9b0' },
  error: { bg: 'rgba(241, 76, 76, 0.10)', border: 'rgba(241, 76, 76, 0.30)', icon: AlertCircle, color: '#f14c4c' },
  warning: { bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)', icon: AlertTriangle, color: '#f59e0b' }
};

// ─── TOAST NOTIFICATION ──────────────────────────────────────
const ToastNotification = ({ message, type = 'success', onClose, isDark }) => {
  const t = useTheme(isDark);
  const { bg, border, icon: Icon, color } = toastStyles[type] || toastStyles.success;
  
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-4 fade-in duration-300">
      <div style={{ backgroundColor: bg, borderColor: border }} className="border rounded-xl px-5 py-4 shadow-2xl flex items-center gap-4 backdrop-blur-xl min-w-[300px]">
        <div style={{ backgroundColor: `${color}15`, color }} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
        <p style={{ color: t.text }} className="text-xs font-medium flex-1">{message}</p>
        <button onClick={onClose} style={{ color: t.textDim }} className="hover:text-white transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── MODAL ELIMINACIÓN SEGURA ────────────────────────────────
const DeleteConfirmModal = ({ target, isDark, onConfirm, onCancel }) => {
  const t = useTheme(isDark);
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (step === 1) { setStep(2); return; }
    if (typed !== 'ELIMINAR') return;
    setLoading(true);
    try {
      await onConfirm(target);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 1024;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        backgroundColor: t.panel, border: `1px solid ${t.border}`,
        borderRadius: '20px', padding: isMobile ? '24px' : '32px',
        maxWidth: '440px', width: '100%', position: 'relative',
        animation: 'scaleIn 0.2s ease-out',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: `${t.danger || '#ef4444'}15`,
          color: t.danger || '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {step === 1 ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: t.text, textAlign: 'center', margin: '0 0 8px' }}>
          {step === 1 ? '¿Eliminar este préstamo?' : 'Confirmación final'}
        </h3>

        <p style={{ fontSize: '12px', color: t.textDim, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
          {step === 1
            ? `Esta acción eliminará el registro de "${target?.nombre || 'Sin nombre'}". Se guardará en la papelera por si necesitas restaurarlo.`
            : 'Escribe "ELIMINAR" para confirmar que deseas eliminar permanentemente este registro.'
          }
        </p>

        {step === 2 && (
          <div style={{
            padding: '12px', borderRadius: '12px',
            backgroundColor: `${t.danger || '#ef4444'}08`,
            border: `1px solid ${t.danger || '#ef4444'}20`,
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>
              Registro a eliminar:
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
              {target?.nombre || 'Sin nombre'}
            </p>
            <p style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>
              {parseFloat(target?.capital || 0).toLocaleString()} {target?.moneda || 'BOB'} — {target?.estado || 'Activo'}
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
              Escribe <span style={{ color: t.danger || '#ef4444' }}>ELIMINAR</span> para confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="ELIMINAR"
              autoFocus
              style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
                textAlign: 'center', letterSpacing: '0.15em',
                backgroundColor: t.input, border: `1px solid ${typed === 'ELIMINAR' ? (t.danger || '#ef4444') : t.border}`,
                color: typed === 'ELIMINAR' ? (t.danger || '#ef4444') : t.text,
                borderRadius: '12px', outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: `1px solid ${t.border}`, backgroundColor: t.input,
              color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (step === 2 && typed !== 'ELIMINAR')}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: 'none',
              backgroundColor: step === 2 ? (t.danger || '#dc2626') : (t.danger || '#ef4444'),
              color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', opacity: (loading || (step === 2 && typed !== 'ELIMINAR')) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {loading ? 'Eliminando...' : step === 1 ? 'Sí, eliminar' : 'Confirmar y eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL PRESTAMO (WIZARD) ─────────────────────────────────
const PrestamoFormModal = ({ isDark, prestamo, onClose, onSave }) => {
  const t = useTheme(isDark);
  return (
    <div className="fixed inset-0 z-[9997] overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="min-h-full py-8 px-4 flex items-start justify-center">
        <div style={{
          backgroundColor: t.bg, border: `1px solid ${t.border}`,
          borderRadius: '24px', padding: '32px',
          maxWidth: '820px', width: '100%',
          animation: 'scaleIn 0.2s ease-out',
        }}>
          <ErrorBoundary>
            <FormularioPrestamo
              isDark={isDark}
              onClose={onClose}
              onSave={onSave}
              initialData={prestamo}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────
const Prestamos = ({ data, setData, settings, isDark, token, preSelectedId, onClearSelection }) => {
  const t = useTheme(isDark);
  const [prestamoView, setPrestamoView] = useState('list'); 
  const [filtroTipo, setFiltroTipo] = useState('otorgado'); // 'otorgado' | 'recibido' 
  const [activePrestamo, setActivePrestamo] = useState(null);
  const [selectedPrestamistaName, setSelectedPrestamistaName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editPrestamo, setEditPrestamo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isMobile = settings?.isMobileMode;
  
  // Estados para Emisión de Recibos
  const [reciboForm, setReciboForm] = useState({
    prestamistaKey: '',
    contratoId: '',
    cuotaKey: '',
    numero: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    concepto: '',
    montoInteres: 0,
    montoCapital: 0,
    montoMora: 0,
    montoAjustes: 0,
    estado: 'Pagado',
    metodo: 'Efectivo',
    notas: '',
  });
  const [reciboDarkMode, setReciboDarkMode] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [registrarPagoDb, setRegistrarPagoDb] = useState(true);

  const { cuotas: ledgerCuotas, resumen: ledgerResumen, proyeccion: ledgerProyeccion } = useAmortizacion(activePrestamo);

  const uniqueDebtores = useMemo(() => {
    if (!data?.prestamos) return [];
    const names = new Set();
    const list = [];
    data.prestamos.forEach(p => {
      if (p.nombre && !names.has(p.nombre.trim())) {
        names.add(p.nombre.trim());
        list.push(p);
      }
    });
    return list;
  }, [data?.prestamos]);

  const debtorContracts = useMemo(() => {
    if (!reciboForm.prestamistaKey || !data?.prestamos) return [];
    return data.prestamos.filter(p => p.nombre?.trim().toLowerCase() === reciboForm.prestamistaKey.trim().toLowerCase());
  }, [reciboForm.prestamistaKey, data?.prestamos]);

  const selectedContract = useMemo(() => {
    if (!reciboForm.contratoId || !data?.prestamos) return null;
    return data.prestamos.find(p => p.id === reciboForm.contratoId);
  }, [reciboForm.contratoId, data?.prestamos]);

  const contractCuotas = useMemo(() => {
    if (!selectedContract) return [];
    return selectedContract.tipo_pago === 'diario' ? generarCronogramaDiario(selectedContract) : generarCronograma(selectedContract);
  }, [selectedContract]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  };

  useEffect(() => {
    if (preSelectedId && data?.prestamos) {
      const prestamo = data.prestamos.find(p => p.id === preSelectedId);
      if (prestamo) { openPrestamo(prestamo); if (onClearSelection) onClearSelection(); }
    }
  }, [preSelectedId, data?.prestamos]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openPrestamo = (p) => {
    if (!p) return;
    setActivePrestamo({ ...p, pagos: Array.isArray(p.pagos) ? p.pagos : [], moneda: p.moneda || 'BOB', estado: p.estado || 'Activo' });
    setPrestamoView('detail');
  };

  const closePrestamo = async () => {
    try { if (activePrestamo) await handleSave(); }
    finally {
      if (selectedPrestamistaName) {
        setPrestamoView('contratos');
      } else {
        setPrestamoView('list');
      }
      setActivePrestamo(null);
    }
  };

  const handleNewPrestamo = () => {
    setEditPrestamo(null);
    setShowForm(true);
  };

  const handleEditPrestamo = (p, e) => {
    if (e) e.stopPropagation();
    setEditPrestamo(p);
    setShowForm(true);
  };

  const handleFormSave = async (savedRecord) => {
    setShowForm(false);
    setEditPrestamo(null);
    if (setData) {
      const { data: refreshed } = await supabase.from('prestamos').select('*');
      if (refreshed) setData(prev => ({ ...prev, prestamos: refreshed }));
    }
    showToast('✅ Préstamo guardado correctamente');

    if (token && savedRecord) {
      try {
        const newNotas = await syncLoanToGoogleCalendar(savedRecord, token);
        if (newNotas && setData) {
          const { data: refreshed } = await supabase.from('prestamos').select('*');
          if (refreshed) setData(prev => ({ ...prev, prestamos: refreshed }));
        }
        showToast('📅 Sincronizado con Google Calendar ✓');
      } catch (err) {
        console.error('Error auto-syncing calendar:', err);
      }
    }
  };

  const handleDeleteRequest = (p, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(p);
  };

  const handleDeleteConfirm = async (target) => {
    try {
      // Eliminar eventos de Google Calendar asociados
      if (token && target?.notas) {
        const events = parseCalendarEvents(target.notas);
        for (const eventId of Object.values(events)) {
          if (eventId) {
            try {
              await deleteCalendarEvent(token, eventId);
            } catch (err) {
              console.error('Error deleting calendar event:', err);
            }
          }
        }
      }

      const trashEntry = {
        tipo: 'prestamo',
        datos_originales: target,
        titulo: target.nombre || 'Préstamo',
        descripcion: `Capital: ${target.capital} ${target.moneda} — Estado: ${target.estado}`,
        eliminado_en: new Date().toISOString(),
        expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const { error: trashError } = await supabase.from('papelera').insert([trashEntry]);
      if (trashError) throw trashError;

      const { error: auditError } = await supabase.from('prestamos_historial').insert([{
        prestamo_id: target.id,
        accion: 'ELIMINADO',
        detalle: `Préstamo eliminado: ${target.nombre} - ${target.capital} ${target.moneda}`,
        datos_previos: target,
      }]);
      if (auditError) throw auditError;

      const { error: deleteError } = await supabase.from('prestamos').delete().eq('id', target.id);
      if (deleteError) throw deleteError;

      const updated = (data?.prestamos || []).filter(p => p.id !== target.id);
      setData({ ...data, prestamos: updated });
      setDeleteTarget(null);
      
      const remainingContracts = updated.filter(p => p.nombre?.trim().toLowerCase() === target.nombre?.trim().toLowerCase());
      if (remainingContracts.length > 0) {
        setPrestamoView('contratos');
      } else {
        setPrestamoView('list');
        setSelectedPrestamistaName(null);
      }
      setActivePrestamo(null);
      showToast('🗑️ Préstamo eliminado correctamente');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const handleSave = async () => {
    if (!activePrestamo) return; setLoading(true);
    const isNew = !data?.prestamos?.some(p => p.id === activePrestamo.id);
    try {
      const payload = { ...activePrestamo, capital: parseFloat(activePrestamo.capital) || 0, interes: parseFloat(activePrestamo.interes) || 0 };
      const { error } = await supabase.from('prestamos').upsert(payload);
      if (error) throw error;
      const current = Array.isArray(data?.prestamos) ? data.prestamos : [];
      const updated = current.some(p => p.id === activePrestamo.id) 
        ? current.map(p => p.id === activePrestamo.id ? activePrestamo : p) 
        : [...current, activePrestamo];
      setData({...data, prestamos: updated});
      
      if (isNew) {
        showToast(`Nuevo prestamista "${activePrestamo.nombre || 'Sin nombre'}" registrado con éxito`, 'success');
      } else {
        showToast(`Cambios guardados correctamente`, 'success');
      }
    } catch (e) { 
      showToast('Error: ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const togglePago = (mes) => {
    if (!activePrestamo) return;
    const current = Array.isArray(activePrestamo.pagos) ? activePrestamo.pagos : [];
    const esRecibido = getTipoPrestamo(activePrestamo) === 'recibido';

    if (esRecibido) {
      const mesReservado = `${mes}_reservado`;
      let newPagos;
      if (current.includes(mes)) {
        newPagos = current.filter(m => m !== mes && m !== mesReservado);
      } else if (current.includes(mesReservado)) {
        newPagos = [...current.filter(m => m !== mesReservado), mes];
      } else {
        newPagos = [...current, mesReservado];
      }
      setActivePrestamo({ ...activePrestamo, pagos: newPagos });
    } else {
      const newPagos = current.includes(mes) ? current.filter(m => m !== mes) : [...current, mes];
      setActivePrestamo({ ...activePrestamo, pagos: newPagos });
    }
  };

  const generateTimeline = () => {
    if (!activePrestamo?.inicio || !activePrestamo?.fin) return [];
    const start = new Date(activePrestamo.inicio);
    const end = new Date(activePrestamo.fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    
    while (current <= new Date(end.getFullYear(), end.getMonth(), 1)) {
      months.push({ 
        key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`, 
        label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) 
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const prestamosListAll = Array.isArray(data?.prestamos) ? data.prestamos : [];
  const getTipoPrestamo = useCallback((p) => {
    if (p.tipo_prestamo) return p.tipo_prestamo;
    if (p.notas && p.notas.includes('[TIPO:recibido]')) return 'recibido';
    return 'otorgado';
  }, []);
  const prestamosList = useMemo(() => {
    return prestamosListAll.filter(p => getTipoPrestamo(p) === filtroTipo);
  }, [prestamosListAll, filtroTipo, getTipoPrestamo]);

  const prestamistasGrouped = useMemo(() => {
    const groups = {};
    prestamosList.forEach(p => {
      const key = p.nombre ? p.nombre.trim().toLowerCase() : 'sin nombre';
      if (!groups[key]) {
        groups[key] = {
          key,
          nombre: p.nombre || 'Sin Nombre',
          ci: p.ci || '',
          telefono: p.telefono || '',
          foto: p.foto || '',
          contratos: [],
          totalAdeudado: 0,
          totalCapital: 0,
          estado: 'Finalizado'
        };
      }
      groups[key].contratos.push(p);
      
      if (!groups[key].ci && p.ci) groups[key].ci = p.ci;
      if (!groups[key].telefono && p.telefono) groups[key].telefono = p.telefono;
      if (!groups[key].foto && p.foto) groups[key].foto = p.foto;
      
      const cap = parseFloat(p.capital) || 0;
      groups[key].totalCapital += cap;
      if (p.estado !== 'Finalizado') {
        groups[key].totalAdeudado += cap;
      }
    });

    Object.values(groups).forEach(g => {
      const estados = g.contratos.map(c => c.estado || 'Activo');
      if (estados.includes('En Mora')) {
        g.estado = 'En Mora';
      } else if (estados.includes('Activo')) {
        g.estado = 'Activo';
      } else {
        g.estado = 'Finalizado';
      }
    });

    return Object.values(groups);
  }, [prestamosList]);

  // ─── HOOKS DEL DASHBOARD ─────────────────────────────────
  const { stats } = useAmortizacionGlobal(prestamosList);
  const { totales } = usePrestamoCategorias(prestamosList);

  // Proyección agregada de todos los préstamos activos
  const proyeccionAgregada = useMemo(() => {
    const activos = prestamosList.filter(p => p.estado !== 'Finalizado');
    if (activos.length === 0) return [];
    const acum = {};
    activos.forEach(p => {
      const prox = proyectarSiguientes(p, 6);
      prox.forEach(item => {
        if (!acum[item.key]) acum[item.key] = { label: item.label, valor: 0 };
        acum[item.key].valor += item.total;
      });
    });
    const maxVal = Math.max(...Object.values(acum).map(v => v.valor), 1);
    return Object.values(acum).map(v => ({ ...v, pct: (v.valor / maxVal) * 100 }));
  }, [prestamosList]);

  // Data para donut chart de riesgo
  const riesgoData = useMemo(() => {
    const items = [
      { label: 'Al día', value: totales.alDia, color: '#10b981' },
      { label: 'Pendientes', value: totales.pendientes, color: '#f59e0b' },
      { label: '1 mes mora', value: totales.deudor1Mes, color: '#f97316' },
      { label: 'Crítico', value: totales.deudorCritico, color: '#ef4444' },
    ];
    const totalVal = items.reduce((s, i) => s + i.value, 0) || 1;
    let offset = 0;
    const circumference = 2 * Math.PI * 38;
    const segments = items.map(i => {
      const pct = i.value / totalVal;
      const segLen = pct * circumference;
      const seg = { ...i, pct: pct * 100, dashArray: `${segLen} ${circumference - segLen}`, dashOffset: -offset };
      offset += segLen;
      return seg;
    });
    return { segments, totalVal, items };
  }, [totales]);

  // Mapa de mora por préstamo para mostrar en lista
  const moraMap = useMemo(() => {
    const map = {};
    prestamosList.forEach(p => {
      const cuotas = generarCronograma(p);
      const resumen = calcularResumen(cuotas);
      if (resumen.totalMora > 0) map[p.id] = resumen.totalMora;
    });
    return map;
  }, [prestamosList]);

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <>
      {toast && (
        <ToastNotification
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isDark={isDark}
        />
      )}

      {/* Modal Formulario Wizard */}
      {showForm && (
        <PrestamoFormModal
          isDark={isDark}
          prestamo={editPrestamo}
          onClose={() => { setShowForm(false); setEditPrestamo(null); }}
          onSave={handleFormSave}
        />
      )}

      {/* Modal Eliminación */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          isDark={isDark}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
        {prestamoView === 'list' ? (
          <div className="animate-in fade-in duration-300">
            <header style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end',
              gap: '16px', marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
                    {filtroTipo === 'recibido' ? 'Mis Deudas & Créditos' : 'Cartera de Préstamos'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
                    {filtroTipo === 'recibido' ? 'Control de préstamos bancarios y deudas con terceros' : 'Dashboard Analítico — Gestión de Capital'}
                  </p>
                </div>
                {/* Switcher de Tipo de Préstamo */}
                <div style={{ display: 'flex', padding: '2px', borderRadius: '10px', backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                  <button
                    onClick={() => setFiltroTipo('otorgado')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      backgroundColor: filtroTipo === 'otorgado' ? t.accent : 'transparent',
                      color: filtroTipo === 'otorgado' ? '#000000' : t.textDim
                    }}
                  >
                    Otorgados (A Clientes)
                  </button>
                  <button
                    onClick={() => setFiltroTipo('recibido')}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      backgroundColor: filtroTipo === 'recibido' ? t.accent : 'transparent',
                      color: filtroTipo === 'recibido' ? '#000000' : t.textDim
                    }}
                  >
                    Recibidos (Banco / Deudas)
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setReciboForm({
                      prestamistaKey: '',
                      contratoId: '',
                      cuotaKey: '',
                      numero: `REC-${Date.now().toString().slice(-6)}`,
                      fechaEmision: new Date().toISOString().split('T')[0],
                      concepto: '',
                      montoInteres: 0,
                      montoCapital: 0,
                      montoMora: 0,
                      montoAjustes: 0,
                      estado: 'Pagado',
                      metodo: 'Efectivo',
                      notas: '',
                    });
                    setPrestamoView('recibos');
                  }}
                  style={{
                    backgroundColor: 'transparent', color: t.text, border: `1px solid ${t.border}`,
                    borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto',
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = t.hover}
                  onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                >
                  <Printer size={16} /> Emitir Recibo
                </button>
                <button 
                  onClick={() => {
                    setEditPrestamo({
                      nombre: '',
                      ci: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      referencias: '',
                      ocupacion: '',
                      foto: '',
                      capital: '',
                      interes: settings?.loanDefaultInterest || 5,
                      moneda: settings?.loanDefaultCurrency || 'BOB',
                      inicio: new Date().toISOString().split('T')[0],
                      fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      estado: 'Activo',
                      tipoGarantia: '',
                      garantia: '',
                      drive_contrato: '',
                      drive_fotos: '',
                      notes: '',
                      pagos: [],
                      tipo_prestamo: filtroTipo
                    });
                    setShowForm(true);
                  }} 
                  style={{
                    backgroundColor: t.accent, color: 'white', border: 'none',
                    borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto',
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = t.accentHover}
                  onMouseLeave={e => e.target.style.backgroundColor = t.accent}
                >
                  <Plus size={16} strokeWidth={3} /> Nuevo Registro
                </button>
              </div>
            </header>

            {/* ─── DASHBOBOARD ANALÍTICO ──────────────────────────────── */}
            {/* KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
              gap: '12px', marginBottom: '24px',
            }}>
              <KPICard t={t} icon={DollarSign} label={filtroTipo === 'recibido' ? "Deuda Recibida" : "Capital Activo"} value={stats.capitalActivo.toLocaleString()} moneda="BOB" color={t.accent} />
              <KPICard t={t} icon={TrendingUp} label={filtroTipo === 'recibido' ? "Interés Mensual a Pagar" : "Rendimiento Mensual"} value={stats.rendimientoMensual.toLocaleString()} moneda="BOB" color="#10b981" />
              <KPICard t={t} icon={Percent} label="Tasa Promedio" value={stats.tasaPromedio.toFixed(1)} moneda="%" color="#f59e0b" />
              <KPICard t={t} icon={AlertTriangle} label="Mora Acumulada" value={stats.totalMora.toLocaleString()} moneda="BOB" color="#ef4444" />
              <KPICard t={t} icon={Heart} label={filtroTipo === 'recibido' ? "Índice de Cumplimiento" : "Índice de Salud"} value={stats.indiceSalud.toFixed(0)} moneda="/100" color={stats.indiceSalud >= 70 ? '#10b981' : stats.indiceSalud >= 40 ? '#f59e0b' : '#ef4444'} />
            </div>

            {/* Gráficos: Bar Chart + Donut Chart */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: '16px', marginBottom: '24px',
            }}>
              {/* Bar Chart — Proyección 6 meses */}
              <div style={{
                padding: '20px', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChart3 size={16} color={t.accent} />
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
                    Proyección Próximos 6 Meses
                  </span>
                </div>
                {proyeccionAgregada.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', position: 'relative', paddingBottom: '20px' }}>
                    {/* Línea de base */}
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: '24px', height: '1px', backgroundColor: t.border, opacity: 0.3 }} />
                    {proyeccionAgregada.map((item, idx) => {
                      const esMayor = item.valor === Math.max(...proyeccionAgregada.map(i => i.valor));
                      return (
                        <div key={idx} style={{
                          flex: 1, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', height: '100%',
                          justifyContent: 'flex-end', position: 'relative',
                        }}>
                          {/* Valor sobre la barra (solo en hover) */}
                          <div style={{
                            fontSize: '8px', fontWeight: 700, color: t.accent,
                            marginBottom: '4px', opacity: 0.85,
                            lineHeight: 1,
                          }}>
                            {item.valor.toLocaleString()}
                          </div>
                          {/* Barra */}
                          <div
                            title={`${item.label}: ${item.valor.toLocaleString()}`}
                            style={{
                              width: '100%', maxWidth: '40px',
                              height: `${Math.max(item.pct, 4)}%`,
                              borderRadius: '4px 4px 0 0',
                              background: esMayor
                                ? `linear-gradient(180deg, ${t.accent}, ${t.success}80)`
                                : `linear-gradient(180deg, ${t.accent}, ${t.accent}40)`,
                              transition: 'height 0.4s ease, background 0.3s ease',
                              minHeight: '6px',
                              cursor: 'pointer',
                              boxShadow: esMayor ? `0 0 8px ${t.accent}40` : 'none',
                            }}
                          />
                          {/* Etiqueta horizontal debajo - SIN rotación */}
                          <div style={{
                            fontSize: '8px', fontWeight: 600, color: t.textDim,
                            textAlign: 'center', lineHeight: 1.2,
                            marginTop: '6px', whiteSpace: 'nowrap',
                            letterSpacing: '0.02em',
                          }}>
                            {item.label.substring(0, 3)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: t.textDim, fontSize: '11px' }}>
                    Sin préstamos activos para proyectar
                  </div>
                )}
              </div>

              {/* Donut Chart — Distribución de Riesgo */}
              <div style={{
                padding: '20px', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: '16px',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <PieChart size={16} color={t.accent} />
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
                    Distribución de Riesgo
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                    <svg width="96" height="96" viewBox="0 0 100 100">
                      {riesgoData.segments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      ))}
                      <circle cx="50" cy="50" r="28" fill={t.panel} />
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                        fill={t.text} fontSize="14" fontWeight="700">
                        {riesgoData.totalVal}
                      </text>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {riesgoData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', fontWeight: 500, color: t.textDim, flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: t.text }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla/Cards con botón eliminar */}
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              {!isMobile ? (
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Prestamista</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Contratos</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Total Adeudado</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamistasGrouped.map(g => (
                      <tr key={g.key} onClick={() => { setSelectedPrestamistaName(g.nombre); setPrestamoView('contratos'); }}
                        style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        className="group"
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, color: t.accent, flexShrink: 0 }}>
                              {g.foto ? (
                                <img src={g.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <User size={16} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>{g.nombre}</p>
                              <p style={{ fontSize: '10px', color: t.textDim, marginTop: '2px', margin: 0 }}>
                                {g.ci ? `CI: ${g.ci}` : ''} {g.telefono ? `· WhatsApp: ${g.telefono}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: t.text }}>
                            {g.contratos.length} {g.contratos.length === 1 ? 'contrato' : 'contratos'}
                          </span>
                          <div style={{ fontSize: '9px', color: t.textDim, marginTop: '2px' }}>
                            ({g.contratos.filter(c => c.estado !== 'Finalizado').length} activos)
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                            {g.totalAdeudado.toLocaleString()} <span style={{ fontSize: '9px', color: t.textDim }}>BOB</span>
                          </p>
                          <p style={{ fontSize: '9px', color: t.textDim, marginTop: '2px', margin: 0 }}>
                            Total acumulado: {g.totalCapital.toLocaleString()} BOB
                          </p>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => { setSelectedPrestamistaName(g.nombre); setPrestamoView('contratos'); }}
                              style={{
                                padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`,
                                backgroundColor: t.input, color: t.text, cursor: 'pointer',
                                fontSize: '10px', fontWeight: 600, transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text; }}
                            >
                              Ver contratos <ChevronRight size={12} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditPrestamo({
                                  nombre: g.nombre,
                                  ci: g.ci,
                                  telefono: g.telefono,
                                  foto: g.foto,
                                  capital: '',
                                  interes: settings?.loanDefaultInterest || 5,
                                  moneda: settings?.loanDefaultCurrency || 'BOB',
                                  inicio: new Date().toISOString().split('T')[0],
                                  fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                  estado: 'Activo',
                                  tipoGarantia: '',
                                  garantia: '',
                                  drive_contrato: '',
                                  drive_fotos: '',
                                  notes: '',
                                  pagos: []
                                });
                                setShowForm(true);
                              }}
                              style={{
                                padding: '8px 12px', borderRadius: '10px', border: 'none',
                                backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                                fontSize: '10px', fontWeight: 600, transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accent; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accentSoft; e.currentTarget.style.color = t.accent; }}
                            >
                              <Plus size={12} /> Nuevo contrato
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>
                  {prestamistasGrouped.map(g => (
                    <div key={g.key} onClick={() => { setSelectedPrestamistaName(g.nombre); setPrestamoView('contratos'); }}
                      style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, color: t.accent, flexShrink: 0 }}>
                            {g.foto ? (
                              <img src={g.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>{g.nombre}</p>
                            <p style={{ fontSize: '10px', color: t.textDim, marginTop: '2px', margin: 0 }}>
                              {g.contratos.length} {g.contratos.length === 1 ? 'contrato' : 'contratos'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} color={t.textDim} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px dashed ${t.border}` }}>
                        <div>
                          <p style={{ fontSize: '8px', color: t.textMuted, margin: 0, textTransform: 'uppercase' }}>Deuda Activa</p>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0 }}>{g.totalAdeudado.toLocaleString()} BOB</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditPrestamo({
                                nombre: g.nombre,
                                ci: g.ci,
                                telefono: g.telefono,
                                foto: g.foto,
                                capital: '',
                                interes: settings?.loanDefaultInterest || 5,
                                moneda: settings?.loanDefaultCurrency || 'BOB',
                                inicio: new Date().toISOString().split('T')[0],
                                fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                estado: 'Activo',
                                tipoGarantia: '',
                                garantia: '',
                                drive_contrato: '',
                                drive_fotos: '',
                                notes: '',
                                pagos: []
                              });
                              setShowForm(true);
                            }}
                            style={{
                              padding: '6px 10px', borderRadius: '8px', border: 'none',
                              backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                              fontSize: '9px', fontWeight: 600,
                            }}
                          >
                            + Contrato
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : prestamoView === 'contratos' ? (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }}
              onClick={() => { setPrestamoView('list'); setSelectedPrestamistaName(null); }}>
              <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Volver a Prestamistas
              </span>
            </div>
            
            <header style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
              gap: '24px', marginBottom: '40px',
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
                  Contratos de {selectedPrestamistaName}
                </h2>
                <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
                  Lista de préstamos y refinanciamientos otorgados
                </p>
              </div>
              <button 
                onClick={() => {
                  const prestamista = prestamistasGrouped.find(g => g.nombre.toLowerCase().trim() === selectedPrestamistaName.toLowerCase().trim());
                  setEditPrestamo({
                    nombre: prestamista?.nombre || selectedPrestamistaName,
                    ci: prestamista?.ci || '',
                    telefono: prestamista?.telefono || '',
                    foto: prestamista?.foto || '',
                    capital: '',
                    interes: settings?.loanDefaultInterest || 5,
                    moneda: settings?.loanDefaultCurrency || 'BOB',
                    inicio: new Date().toISOString().split('T')[0],
                    fin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    estado: 'Activo',
                    tipoGarantia: '',
                    garantia: '',
                    drive_contrato: '',
                    drive_fotos: '',
                    notes: '',
                    pagos: []
                  });
                  setShowForm(true);
                }} 
                style={{
                  backgroundColor: t.accent, color: 'white', border: 'none',
                  borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto',
                }}
                onMouseEnter={e => e.target.style.backgroundColor = t.accentHover}
                onMouseLeave={e => e.target.style.backgroundColor = t.accent}
              >
                <Plus size={16} strokeWidth={3} /> Nuevo Contrato
              </button>
            </header>

            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              {!isMobile ? (
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Contrato</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Periodo</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Capital</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Interés</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(prestamosList.filter(p => p.nombre?.trim().toLowerCase() === selectedPrestamistaName?.trim().toLowerCase())).map((p, idx) => {
                      const moraAmount = moraMap[p.id];
                      return (
                        <tr key={p.id} onClick={() => openPrestamo(p)}
                          style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          className="group"
                        >
                          <td style={{ padding: '16px 24px' }}>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                                Contrato #${idx + 1}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{
                                  fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
                                  padding: '2px 8px', borderRadius: '12px',
                                  backgroundColor: p.estado === 'Finalizado' ? 'rgba(16, 185, 129, 0.10)' : p.estado === 'En Mora' ? 'rgba(239, 68, 68, 0.10)' : t.accentSoft,
                                  color: p.estado === 'Finalizado' ? t.success : p.estado === 'En Mora' ? t.danger : t.accent,
                                }}>
                                  {p.estado || 'Activo'}
                                </span>
                                {moraAmount > 0 && (
                                  <span style={{
                                    fontSize: '9px', fontWeight: 700, color: '#ef4444',
                                    padding: '2px 8px', borderRadius: '12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.10)',
                                  }}>
                                    +${moraAmount.toLocaleString()} mora
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: t.textMuted }}>
                              {safeFormatDate(p.inicio)}
                              {' → '}
                              {safeFormatDate(p.fin)}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                              {parseFloat(p.capital).toLocaleString()} <span style={{ fontSize: '9px', color: t.textDim }}>{p.moneda}</span>
                            </p>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: t.accent, margin: 0 }}>
                              {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} <span style={{ fontSize: '9px', color: t.accent }}>{p.moneda}</span>
                              <span style={{ fontSize: '10px', color: t.textDim }}> ({p.interes}%)</span>
                            </p>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditPrestamo(p); }}
                                style={{
                                  padding: '8px', borderRadius: '12px', border: 'none',
                                  backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                title="Editar"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteRequest(p, e)}
                                style={{
                                  padding: '8px', borderRadius: '12px', border: 'none',
                                  backgroundColor: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div>
                  {(prestamosList.filter(p => p.nombre?.trim().toLowerCase() === selectedPrestamistaName?.trim().toLowerCase())).map((p, idx) => {
                    const moraAmount = moraMap[p.id];
                    return (
                      <div key={p.id} onClick={() => openPrestamo(p)}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>Contrato #${idx + 1}</p>
                          <p style={{ fontSize: '10px', fontWeight: 600, color: t.accent, marginTop: '2px' }}>
                            {parseFloat(p.capital).toLocaleString()} {p.moneda} ({p.interes}%)
                          </p>
                          {moraAmount > 0 && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', marginTop: '2px', display: 'inline-block' }}>
                              +${moraAmount.toLocaleString()} mora
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPrestamo(p); }}
                            style={{
                              padding: '8px', borderRadius: '10px', border: 'none',
                              backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                              fontSize: '10px', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            <Edit3 size={12} /> Editar
                          </button>
                          <button
                            onClick={(e) => handleDeleteRequest(p, e)}
                            style={{
                              padding: '8px', borderRadius: '10px', border: 'none',
                              backgroundColor: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronRight size={18} color={t.textDim} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : prestamoView === 'detail' ? (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }}
              onClick={closePrestamo}>
              <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Volver
              </span>
            </div>
            
            <header style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
              gap: '24px', marginBottom: '40px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, border: `2px solid ${t.border}`, flexShrink: 0 }}>
                  {activePrestamo?.foto ? (
                    <img src={activePrestamo.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} color={t.accent} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <input
                      type="text"
                      value={activePrestamo.nombre}
                      onChange={e => setActivePrestamo({...activePrestamo, nombre: e.target.value})}
                      style={{
                        fontSize: '1.25rem', fontWeight: 700, color: t.text,
                        background: 'transparent', border: 'none', outline: 'none',
                        flex: 1, minWidth: 0, letterSpacing: '-0.02em',
                      }}
                      placeholder="Nombre del Cliente"
                    />
                    <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Contrato: {safeFormatDate(activePrestamo?.inicio || activePrestamo?.created_at || Date.now(), { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {/* CI — misma altura y estilo que el select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '36px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <FileSignature size={14} color={t.textDim} />
                      <input type="text" value={activePrestamo?.ci || ''}
                        onChange={e => setActivePrestamo({...activePrestamo, ci: e.target.value})}
                        className="unstyled-input"
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', minWidth: 0, color: t.text, fontSize: '11px', lineHeight: 1.2, padding: 0, height: 'auto' }} placeholder="Cédula de Identidad" />
                    </div>
                    {/* WhatsApp — misma altura y estilo que el select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '36px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <Smartphone size={14} color={t.textDim} />
                      <input type="text" value={activePrestamo.telefono}
                        onChange={e => setActivePrestamo({...activePrestamo, telefono: e.target.value})}
                        className="unstyled-input"
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', minWidth: 0, color: t.text, fontSize: '11px', lineHeight: 1.2, padding: 0, height: 'auto' }} placeholder="WhatsApp" />
                    </div>
                    <select value={activePrestamo.estado}
                      onChange={e => setActivePrestamo({...activePrestamo, estado: e.target.value})}
                      style={{
                        height: '36px', padding: '0 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                        textTransform: 'uppercase', border: `1px solid ${t.border}`,
                        backgroundColor: t.input, color: t.accent, outline: 'none', boxSizing: 'border-box',
                      }}>
                      <option value="Activo">Activo</option>
                      <option value="En Mora">En Mora</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                    {/* Editar — misma altura que el resto */}
                    <button
                      onClick={() => handleEditPrestamo(activePrestamo)}
                      title="Editar préstamo"
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: `1px solid ${t.border}`, backgroundColor: t.input,
                        color: t.accent, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = t.accent; e.target.style.backgroundColor = t.accentSoft; }}
                      onMouseLeave={e => { e.target.style.borderColor = t.border; e.target.style.backgroundColor = t.input; }}
                    >
                      <Edit3 size={15} />
                    </button>
                    {/* Eliminar — misma altura que el resto */}
                    <button
                      onClick={(e) => handleDeleteRequest(activePrestamo, e)}
                      title="Eliminar préstamo"
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.07)',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
                      onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.07)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.25)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSave} 
                disabled={loading}
                style={{
                  backgroundColor: t.accent, color: 'white', border: 'none',
                  borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                  fontSize: '11px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
                  width: isMobile ? '100%' : 'auto',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = t.accentHover; }}
                onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = t.accent; }}
              >
                <Save size={16} /> {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </header>

            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
              {/* LEFT COLUMN - Timeline & Contract */}
              <div className={`${isMobile ? '' : 'col-span-8'} space-y-6`}>
                {/* LEDGER / CUENTA CORRIENTE */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDays size={14} color={t.accent} /> Cuenta Corriente
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: t.textMuted }}>
                        Capital: <strong style={{ color: t.text, fontSize: '13px' }}>{(parseFloat(activePrestamo?.capital) || 0).toLocaleString()} Bs</strong>
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: t.textMuted }}>
                        Interés/mes: <strong style={{ color: t.accent, fontSize: '13px' }}>{Math.round((parseFloat(activePrestamo?.capital) || 0) * ((parseFloat(activePrestamo?.interes) || 0) / 100)).toLocaleString()} Bs</strong>
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '10px', fontWeight: 500, color: t.textDim, marginBottom: '16px' }}>
                    <span style={{ color: t.accent }}>⏱️</span> Click en fila para marcar como pagado
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Mes</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Vencimiento</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Interés</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Cuota Mensual</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Estado</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerCuotas.map((c) => {
                          const isPaid = (activePrestamo.pagos || []).includes(c.key);
                          const isReserved = (activePrestamo.pagos || []).includes(`${c.key}_reservado`);
                          return (
                            <tr key={c.key} onClick={() => togglePago(c.key)}
                              style={{
                                cursor: 'pointer', transition: 'background 0.15s',
                                borderBottom: `1px solid ${t.border}`,
                                backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.04)' : isReserved ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = isPaid ? 'rgba(16, 185, 129, 0.08)' : isReserved ? 'rgba(245, 158, 11, 0.08)' : t.hover}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = isPaid ? 'rgba(16, 185, 129, 0.04)' : isReserved ? 'rgba(245, 158, 11, 0.04)' : 'transparent'}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : isReserved ? '#f59e0b' : t.text }}>
                                  {c.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 500 }}>
                                  {c.fechaVencimiento || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : isReserved ? '#f59e0b' : t.accent }}>
                                  {c.interes.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : isReserved ? '#f59e0b' : t.text }}>
                                    {c.total.toLocaleString()}
                                  </span>
                                  {c.mora > 0 && (
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444' }}>
                                      +{c.mora.toLocaleString()} mora
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {isPaid ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.success }}>
                                    <CheckCircle2 size={12} /> Pagado
                                  </span>
                                ) : isReserved ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: '#f59e0b' }}>
                                    <Bookmark size={12} /> Reservado
                                  </span>
                                ) : c.estado === 'vencido' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: '#ef4444' }}>
                                    <AlertCircle size={12} /> Vencido
                                  </span>
                                ) : c.estado === 'futuro' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
                                    <Clock size={12} /> Futuro
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.textMuted }}>
                                    <Clock size={12} /> Pendiente
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReciboForm({
                                      prestamistaKey: activePrestamo.nombre,
                                      contratoId: activePrestamo.id,
                                      cuotaKey: c.key,
                                      numero: `REC-${Date.now().toString().slice(-6)}`,
                                      fechaEmision: new Date().toISOString().split('T')[0],
                                      concepto: `Pago de Cuota ${c.label} — ${activePrestamo.nombre}`,
                                      montoInteres: c.interes || 0,
                                      montoCapital: activePrestamo.tipo_pago === 'diario' ? (c.capital || 0) : 0,
                                      montoMora: c.mora || 0,
                                      montoAjustes: 0,
                                      estado: 'Pagado',
                                      metodo: 'Efectivo',
                                      notas: '',
                                    });
                                    setPrestamoView('recibos');
                                  }}
                                  style={{
                                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                                    backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    fontSize: '10px', fontWeight: 600
                                  }}
                                  title="Emitir Recibo"
                                >
                                  <Printer size={12} /> Recibo
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {ledgerResumen && (
                        <tfoot>
                          <tr style={{ borderTop: `2px solid ${t.accent}` }}>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: t.text }}>Totales</span>
                            </td>
                            <td style={{ padding: '12px 14px' }}></td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: t.accent }}>
                                {(ledgerResumen.interesPromedio || 0).toLocaleString()}/mes
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: t.text }}>
                                {(ledgerResumen.totalPagado || 0).toLocaleString()} pagado
                              </span>
                              <br />
                              <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim }}>
                                {(ledgerResumen.totalPendiente || 0).toLocaleString()} pend.
                              </span>
                              {(ledgerResumen.totalMora || 0) > 0 && (
                                <>
                                  <br />
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                                    {(ledgerResumen.totalMora || 0).toLocaleString()} en mora
                                  </span>
                                </>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '9px', fontWeight: 600, color: t.textMuted }}>
                                {ledgerResumen.cuotasPagadas || 0}/{ledgerResumen.totalCuotas || 0} pagadas
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* PROYECCIÓN PRÓXIMOS 6 MESES */}
                {ledgerProyeccion && ledgerProyeccion.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={14} color="#a855f7" /> Proyección Próximos 6 Meses
                      </h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '550px' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                            <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Mes</th>
                            <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Vencimiento</th>
                            <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Interés Proy.</th>
                            <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Cuota Proy.</th>
                            <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerProyeccion.map((p) => (
                            <tr key={p.key}
                              style={{
                                borderBottom: `1px solid ${t.border}`,
                                backgroundColor: 'transparent',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#a855f7' }}>
                                  {p.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 500 }}>
                                  {p.fechaVencimiento || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#a855f7' }}>
                                  {p.interes.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: t.text }}>
                                    {p.total.toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
                                  <Clock size={12} /> Proyectado
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CONTRACT & GUARANTEE */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <ShieldCheck size={14} color={t.accent} /> Contrato y Garantía
                  </h3>
                  <textarea value={activePrestamo.garantia} 
                    onChange={e => setActivePrestamo({...activePrestamo, garantia: e.target.value})} 
                    style={{
                      width: '100%', height: '120px', padding: '14px', fontSize: '12px',
                      backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                      borderRadius: '12px', outline: 'none', resize: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = t.accent; }}
                    onBlur={e => { e.target.style.borderColor = t.border; }}
                    placeholder="Detalles de la garantía (Ej: Auto, Título de propiedad, etc.)" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Link Contrato Drive</label>
                      <input type="text" value={activePrestamo.drive_contrato} 
                        onChange={e => setActivePrestamo({...activePrestamo, drive_contrato: e.target.value})} 
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: '10px',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = t.accent; }}
                        onBlur={e => { e.target.style.borderColor = t.border; }}
                        placeholder="https://drive.google.com/..." />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Link Fotos Respaldo</label>
                      <input type="text" value={activePrestamo.drive_fotos} 
                        onChange={e => setActivePrestamo({...activePrestamo, drive_fotos: e.target.value})} 
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: '10px',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = t.accent; }}
                        onBlur={e => { e.target.style.borderColor = t.border; }}
                        placeholder="https://photos.app.goo.gl/..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Capital & Period */}
              <div className={`${isMobile ? '' : 'col-span-4'} space-y-6`}>
                {/* CAPITAL & INTEREST */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '12px' }}>Capital Invertido</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                    <DollarSign size={18} color={t.textDim} />
                    <input type="number" value={activePrestamo.capital} 
                      onChange={e => setActivePrestamo({...activePrestamo, capital: e.target.value})} 
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        fontSize: '1.5rem', fontWeight: 700, color: t.text, width: '100%',
                        fontFamily: 'monospace',
                      }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Interés (%)</label>
                      <input type="number" value={activePrestamo.interes} 
                        onChange={e => setActivePrestamo({...activePrestamo, interes: e.target.value})} 
                        style={{
                          width: '100%', padding: '12px', fontSize: '1rem', fontFamily: 'monospace',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.accent,
                          borderRadius: '12px', outline: 'none', fontWeight: 600,
                        }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Moneda</label>
                      <select value={activePrestamo.moneda} 
                        onChange={e => setActivePrestamo({...activePrestamo, moneda: e.target.value})} 
                        style={{
                          width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600,
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none',
                        }}>
                        <option value="BOB">BOB</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, marginBottom: '6px' }}>Interés Mensual Calculado</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: t.accent, margin: 0 }}>
                      {(parseFloat(activePrestamo.capital) * (parseFloat(activePrestamo.interes) / 100) || 0).toLocaleString()} {activePrestamo.moneda}
                    </p>
                  </div>
                </div>

                {/* PERIOD */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '16px' }}>Periodo del Préstamo</label>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginBottom: '6px' }}>Fecha Inicio</p>
                    <input type="date" value={activePrestamo.inicio} 
                      onChange={e => setActivePrestamo({...activePrestamo, inicio: e.target.value})} 
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '12px',
                        backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                        borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = t.accent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginBottom: '6px' }}>Fecha Vencimiento</p>
                    <input type="date" value={activePrestamo.fin} 
                      onChange={e => setActivePrestamo({...activePrestamo, fin: e.target.value})} 
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '12px',
                        backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                        borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = t.accent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }} />
                  </div>
                  <div style={{ paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, marginBottom: '4px' }}>Primer Cobro</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: t.accent, margin: 0 }}>
                      {getNextMonthDateFormatted(activePrestamo.inicio)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : prestamoView === 'recibos' ? (
          <div className="animate-in slide-in-from-right-8 duration-500 max-w-6xl mx-auto">
            {/* Header / Volver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}
              onClick={() => {
                if (activePrestamo) {
                  setPrestamoView('detail');
                } else if (selectedPrestamistaName) {
                  setPrestamoView('contratos');
                } else {
                  setPrestamoView('list');
                }
              }}>
              <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Volver
              </span>
            </div>

            <header style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
                Emisión de Recibo de Pago
              </h2>
              <p style={{ fontSize: '0.8rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
                Genera comprobantes de pago en PDF, regístralos en la cuenta corriente y súbelos a Drive
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* COLUMNA IZQUIERDA: FORMULARIO (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '16px' }} className="space-y-6">
                  {/* SELECTORES EN FILA */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Selector de Deudor */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        1. Cliente / Deudor
                      </label>
                      <select
                        value={reciboForm.prestamistaKey}
                        onChange={e => {
                          const val = e.target.value;
                          setReciboForm(prev => ({
                            ...prev,
                            prestamistaKey: val,
                            contratoId: '',
                            cuotaKey: '',
                            montoInteres: 0,
                            montoMora: 0,
                            montoCapital: 0,
                            concepto: ''
                          }));
                        }}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {uniqueDebtores.map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Contrato */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        2. Contrato
                      </label>
                      <select
                        value={reciboForm.contratoId}
                        disabled={!reciboForm.prestamistaKey}
                        onChange={e => {
                          const val = e.target.value;
                          setReciboForm(prev => ({
                            ...prev,
                            contratoId: val,
                            cuotaKey: '',
                            montoInteres: 0,
                            montoMora: 0,
                            montoCapital: 0,
                            concepto: ''
                          }));
                        }}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none', opacity: reciboForm.prestamistaKey ? 1 : 0.5 }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {debtorContracts.map((c, idx) => (
                          <option key={c.id} value={c.id}>Contrato #{idx + 1} ({c.capital} {c.moneda})</option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Cuota */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        3. Cuota
                      </label>
                      <select
                        value={reciboForm.cuotaKey}
                        disabled={!reciboForm.contratoId}
                        onChange={e => {
                          const val = e.target.value;
                          const selectedCuota = contractCuotas.find(c => c.key === val);
                          if (selectedCuota) {
                            setReciboForm(prev => ({
                              ...prev,
                              cuotaKey: val,
                              montoInteres: selectedCuota.interes || 0,
                              montoMora: selectedCuota.mora || 0,
                              montoCapital: selectedContract?.tipo_pago === 'diario' ? (selectedCuota.capital || 0) : 0,
                              concepto: `Pago de Cuota ${selectedCuota.label} — ${reciboForm.prestamistaKey}`
                            }));
                          } else {
                            setReciboForm(prev => ({
                              ...prev,
                              cuotaKey: '',
                              montoInteres: 0,
                              montoMora: 0,
                              montoCapital: 0,
                              concepto: ''
                            }));
                          }
                        }}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none', opacity: reciboForm.contratoId ? 1 : 0.5 }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {contractCuotas.map(c => {
                          const isPaid = selectedContract?.pagos?.includes(c.key);
                          return (
                            <option key={c.key} value={c.key}>
                              {c.label} ({c.fechaVencimiento}) {isPaid ? ' [PAGADO]' : ' [PENDIENTE]'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número de Recibo */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Nro. Recibo (Editable)
                      </label>
                      <input
                        type="text"
                        value={reciboForm.numero}
                        onChange={e => setReciboForm(prev => ({ ...prev, numero: e.target.value }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                      />
                    </div>

                    {/* Fecha de Emisión */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Fecha de Recibo
                      </label>
                      <input
                        type="date"
                        value={reciboForm.fechaEmision}
                        onChange={e => setReciboForm(prev => ({ ...prev, fechaEmision: e.target.value }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Concepto */}
                  <div>
                    <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                      Concepto
                    </label>
                    <input
                      type="text"
                      value={reciboForm.concepto}
                      onChange={e => setReciboForm(prev => ({ ...prev, concepto: e.target.value }))}
                      placeholder="Ej: Pago de Cuota 1 de interés"
                      style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                    />
                  </div>

                  {/* DESGLOSE EN REJILLA */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Interés */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Monto Interés ({selectedContract?.moneda || 'BOB'})
                      </label>
                      <input
                        type="number"
                        value={reciboForm.montoInteres}
                        onChange={e => setReciboForm(prev => ({ ...prev, montoInteres: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.accent, borderRadius: '12px', outline: 'none', fontWeight: 600 }}
                      />
                    </div>

                    {/* Mora */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Cargos Mora
                      </label>
                      <input
                        type="number"
                        value={reciboForm.montoMora}
                        onChange={e => setReciboForm(prev => ({ ...prev, montoMora: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: '#ef4444', borderRadius: '12px', outline: 'none', fontWeight: 600 }}
                      />
                    </div>

                    {/* Capital */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Amort. Capital
                      </label>
                      <input
                        type="number"
                        value={reciboForm.montoCapital}
                        onChange={e => setReciboForm(prev => ({ ...prev, montoCapital: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none', fontWeight: 600 }}
                      />
                    </div>

                    {/* Ajustes */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Descuentos
                      </label>
                      <input
                        type="number"
                        value={reciboForm.montoAjustes}
                        onChange={e => setReciboForm(prev => ({ ...prev, montoAjustes: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.textDim, borderRadius: '12px', outline: 'none', fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Método de pago */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Método de Pago
                      </label>
                      <select
                        value={reciboForm.metodo}
                        onChange={e => setReciboForm(prev => ({ ...prev, metodo: e.target.value }))}
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Depósito">Depósito</option>
                        <option value="Qr">QR Simple</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    {/* Notas */}
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
                        Notas / Observaciones
                      </label>
                      <input
                        type="text"
                        value={reciboForm.notes}
                        onChange={e => setReciboForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ej: Pago realizado por transferencia del Banco Unión"
                        style={{ width: '100%', padding: '12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* CHECKBOXES DE GUARDADO */}
                  <div style={{ paddingTop: '16px', borderTop: `1px solid ${t.border}` }} className="space-y-3">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: t.text }}>
                      <input
                        type="checkbox"
                        checked={registrarPagoDb}
                        onChange={e => setRegistrarPagoDb(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: t.accent }}
                      />
                      <span>Registrar pago en la cuenta corriente del contrato (Supabase)</span>
                    </label>
                    
                    {registrarPagoDb && token && (
                      <div style={{ paddingLeft: '26px' }} className="flex items-center gap-2 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 size={12} />
                        <span>Se actualizará automáticamente el evento en Google Calendar a ✅ [PAGADO]</span>
                      </div>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
                    <button
                      onClick={() => {
                        if (activePrestamo) {
                          setPrestamoView('detail');
                        } else {
                          setPrestamoView('list');
                        }
                      }}
                      style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: 'transparent', border: `1px solid ${t.border}`, color: t.text, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    
                    <button
                      disabled={!reciboForm.prestamistaKey || !reciboForm.contratoId || loading || syncingCalendar || uploadingDrive}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const doc = generateReciboPDF(reciboForm, selectedContract, reciboDarkMode);
                          const pdfBlob = doc.output('blob');
                          const fileName = `${reciboForm.numero}_${selectedContract?.nombre || 'Cliente'}.pdf`;

                          // Subir a Drive
                          setUploadingDrive(true);
                          try {
                            await uploadPdfToDrive(token, pdfBlob, fileName, 'Préstamos');
                            showToast('📄 Recibo PDF subido a Drive ✓');
                          } catch (err) {
                            console.error('Error uploading receipt to Drive:', err);
                            showToast('Error al subir PDF a Drive', 'error');
                          } finally {
                            setUploadingDrive(false);
                          }

                          // Descargar localmente
                          doc.save(fileName);

                          // Registrar Pago en la DB
                          if (registrarPagoDb && reciboForm.cuotaKey && selectedContract) {
                            const currentPagos = Array.isArray(selectedContract.pagos) ? selectedContract.pagos : [];
                            if (!currentPagos.includes(reciboForm.cuotaKey)) {
                              const newPagos = [...currentPagos, reciboForm.cuotaKey];
                              const updatedContract = { ...selectedContract, pagos: newPagos };

                              const { error } = await supabase.from('prestamos').update({ pagos: newPagos }).eq('id', selectedContract.id);
                              if (error) throw error;

                              if (setData && data?.prestamos) {
                                const updatedList = data.prestamos.map(p => p.id === selectedContract.id ? updatedContract : p);
                                setData(prev => ({ ...prev, prestamos: updatedList }));
                              }

                              // Sincronizar Calendario
                              if (token) {
                                setSyncingCalendar(true);
                                try {
                                  await syncLoanToGoogleCalendar(updatedContract, token);
                                } finally {
                                  setSyncingCalendar(false);
                                }
                              }
                            }
                          }

                          showToast('✅ Recibo emitido y registrado con éxito');
                          if (activePrestamo) {
                            const refreshed = data.prestamos.find(p => p.id === selectedContract.id);
                            if (refreshed) {
                              setActivePrestamo({
                                ...refreshed,
                                pagos: registrarPagoDb ? [...(refreshed.pagos || []), reciboForm.cuotaKey] : (refreshed.pagos || [])
                              });
                            }
                            setPrestamoView('detail');
                          } else {
                            setPrestamoView('list');
                          }
                        } catch (err) {
                          alert('Error al emitir recibo: ' + err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        flex: 2, padding: '14px', borderRadius: '12px',
                        backgroundColor: (!reciboForm.prestamistaKey || !reciboForm.contratoId) ? t.border : t.accent,
                        color: (!reciboForm.prestamistaKey || !reciboForm.contratoId) ? t.textDim : '#000000',
                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {(loading || syncingCalendar || uploadingDrive) ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Procesando...
                        </>
                      ) : (
                        <>
                          <Printer size={14} /> Emitir y Descargar Recibo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: LIVE PREVIEW (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>
                    Previsualización en Vivo
                  </span>
                  
                  {/* Claro / Oscuro toggle */}
                  <button
                    onClick={() => setReciboDarkMode(!reciboDarkMode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      borderRadius: '8px', border: `1px solid ${t.border}`, backgroundColor: t.panel,
                      color: t.text, fontSize: '10px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {reciboDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                    {reciboDarkMode ? 'Modo Claro' : 'Modo Oscuro'} (PDF)
                  </button>
                </div>

                {/* VISTA PREVIA DEL RECIBO */}
                <div
                  style={{
                    backgroundColor: reciboDarkMode ? '#0d0d0f' : '#ffffff',
                    color: reciboDarkMode ? '#f8fafc' : '#0f172a',
                    border: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
                    fontFamily: 'sans-serif',
                    minHeight: '480px',
                    position: 'relative'
                  }}
                >
                  {/* WATERMARK */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-15deg)',
                      fontSize: '64px',
                      fontWeight: 900,
                      color: reciboDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    PAGADO
                  </div>

                  {/* LOGO & NRO */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#10b981' }}>RECIBO DE PAGO</h4>
                      <span style={{ display: 'block', height: '12px' }}></span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '7px', color: reciboDarkMode ? '#64748b' : '#94a3b8', display: 'block' }}>COMPROBANTE OFICIAL</span>
                      <strong style={{ fontSize: '11px', fontFamily: 'monospace' }}>{reciboForm.numero || 'REC-XXXXXX'}</strong>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}`, margin: '14px 0' }} />

                  {/* DOS COLUMNAS DE DATOS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '7.5px', color: reciboDarkMode ? '#64748b' : '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>PAGADOR / DEUDOR</span>
                      <strong style={{ fontSize: '11px' }}>{reciboForm.prestamistaKey || '---'}</strong>
                      {selectedContract?.ci && <span style={{ display: 'block', marginTop: '2px', color: reciboDarkMode ? '#94a3b8' : '#475569' }}>CI: {selectedContract.ci}</span>}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '7.5px', color: reciboDarkMode ? '#64748b' : '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>FECHA Y MÉTODO</span>
                      <strong>{safeFormatDate(reciboForm.fechaEmision, { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      <span style={{ display: 'block', marginTop: '2px', color: '#10b981', fontWeight: 700 }}>{reciboForm.metodo?.toUpperCase() || ''}</span>
                    </div>
                  </div>

                  {/* CONCEPTO */}
                  <div style={{ padding: '10px 12px', backgroundColor: reciboDarkMode ? '#151518' : '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}` }}>
                    <span style={{ display: 'block', fontSize: '7px', color: reciboDarkMode ? '#64748b' : '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>CONCEPTO GENERAL</span>
                    <span style={{ fontSize: '10px', fontWeight: 700 }}>{reciboForm.concepto || 'Pago de Cuota'}</span>
                  </div>

                  {/* DESGLOSE TABLE */}
                  <div style={{ fontSize: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', paddingBottom: '6px', borderBottom: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}`, fontWeight: 700, color: reciboDarkMode ? '#94a3b8' : '#475569' }}>
                      <span>Descripción</span>
                      <span style={{ textAlign: 'right' }}>Monto</span>
                    </div>
                    
                    <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
                      {parseFloat(reciboForm.montoInteres) > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
                          <span>Pago de Intereses</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>{parseFloat(reciboForm.montoInteres).toLocaleString()} {selectedContract?.moneda || 'BOB'}</span>
                        </div>
                      )}
                      {parseFloat(reciboForm.montoMora) > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', color: '#ef4444' }}>
                          <span>Cargos por Mora</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>+{parseFloat(reciboForm.montoMora).toLocaleString()} {selectedContract?.moneda || 'BOB'}</span>
                        </div>
                      )}
                      {parseFloat(reciboForm.montoCapital) > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
                          <span>Amortización de Capital</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>{parseFloat(reciboForm.montoCapital).toLocaleString()} {selectedContract?.moneda || 'BOB'}</span>
                        </div>
                      )}
                      {parseFloat(reciboForm.montoAjustes) > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', color: reciboDarkMode ? '#94a3b8' : '#64748b' }}>
                          <span>Descuentos / Ajustes</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>-{parseFloat(reciboForm.montoAjustes).toLocaleString()} {selectedContract?.moneda || 'BOB'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}` }}>
                      <div style={{ textAlign: 'right', padding: '8px 14px', backgroundColor: reciboDarkMode ? '#151518' : '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '7.5px', color: reciboDarkMode ? '#64748b' : '#94a3b8', display: 'block', fontWeight: 600 }}>TOTAL RECIBIDO</span>
                        <strong style={{ fontSize: '14px', color: '#10b981', fontFamily: 'monospace' }}>
                          {((parseFloat(reciboForm.montoInteres) || 0) + (parseFloat(reciboForm.montoMora) || 0) + (parseFloat(reciboForm.montoCapital) || 0) - (parseFloat(reciboForm.montoAjustes) || 0)).toLocaleString()} {selectedContract?.moneda || 'BOB'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* FIRMAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '48px', textAlign: 'center', fontSize: '8px', color: reciboDarkMode ? '#64748b' : '#94a3b8' }}>
                    <div>
                      <div style={{ borderBottom: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}`, height: '24px' }}></div>
                      <span style={{ display: 'block', marginTop: '4px' }}>FIRMA CLIENTE</span>
                    </div>
                    <div>
                      <div style={{ borderBottom: `1px solid ${reciboDarkMode ? '#1e293b' : '#e2e8f0'}`, height: '24px' }}></div>
                      <span style={{ display: 'block', marginTop: '4px' }}>FIRMA ACREEDOR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

// ─── COMPONENTE KPI CARD ────────────────────────────────────
const KPICard = ({ t, icon: Icon, label, value, moneda, color }) => (
  <div style={{
    padding: '16px', backgroundColor: t.panel,
    border: `1px solid ${t.border}`, borderRadius: '12px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        backgroundColor: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} />
      </div>
      <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
        {label}
      </span>
    </div>
    <span style={{ fontSize: '1rem', fontWeight: 700, color: t.text, lineHeight: 1 }}>
      {value} {moneda && <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim }}>{moneda}</span>}
    </span>
  </div>
);

export default Prestamos;
