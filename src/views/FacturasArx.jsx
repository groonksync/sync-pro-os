import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, FileText, Download, Trash2, Eye, X, ChevronDown, Check,
  RefreshCw, AlertCircle, CheckCircle2, Cloud, Sun, Moon,
  User, Building2, Calendar, DollarSign, Percent, Tag,
  ArrowLeft, Edit3, Copy, Send
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import {
  saveInvoiceToDrive, loadInvoicesFromDrive,
  deleteInvoiceFromDrive, updateInvoiceInDrive,
  uploadPdfToDrive
} from '../lib/googleApi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'BOB', symbol: 'Bs.', name: 'Boliviano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño' },
];

const ESTADOS = [
  { id: 'pagado', label: 'Pagado', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  { id: 'pendiente', label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  { id: 'cancelado', label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
];

const emptyItem = () => ({ id: crypto.randomUUID(), descripcion: '', cantidad: 1, precio: '' });

const emptyInvoice = () => ({
  numero: `ARX-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  cliente_nombre: '',
  cliente_empresa: '',
  cliente_email: '',
  fecha_emision: new Date().toISOString().split('T')[0],
  fecha_vencimiento: '',
  moneda: 'USD',
  items: [emptyItem()],
  descuento: 0,
  notas: '',
  estado: 'pendiente',
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtMoney = (amount, symbol) =>
  `${symbol} ${Number(amount || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const calcTotals = (items, descuento) => {
  const subtotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio) || 0), 0);
  const disc = subtotal * ((Number(descuento) || 0) / 100);
  const total = subtotal - disc;
  return { subtotal, disc, total };
};

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getEstado = (id) => ESTADOS.find(e => e.id === id) || ESTADOS[1];
const getCurrency = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

const generatePDF = (invoice, darkMode = false) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18;
  const cur = getCurrency(invoice.moneda);
  const { subtotal, disc, total } = calcTotals(invoice.items, invoice.descuento);
  const estado = getEstado(invoice.estado);

  // Colors
  const BG = darkMode ? '#0e0e0e' : '#ffffff';
  const TEXT_MAIN = darkMode ? '#f0f0f0' : '#111111';
  const TEXT_MID = darkMode ? '#a0a0a0' : '#555555';
  const TEXT_DIM = darkMode ? '#666666' : '#999999';
  const ACCENT = darkMode ? '#e0e0e0' : '#111111';
  const RULE = darkMode ? '#2a2a2a' : '#e5e5e5';
  const PANEL = darkMode ? '#1a1a1a' : '#f7f7f7';
  const TABLE_HEADER_BG = darkMode ? '#1e1e1e' : '#f0f0f0';

  // Background
  pdf.setFillColor(BG);
  pdf.rect(0, 0, 210, 297, 'F');

  let y = M;

  // ── HEADER ──
  // Agency name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(ACCENT);
  pdf.text('AGENCIA ARX', M, y);

  // Invoice number (top right)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('FACTURA', W - M, y, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(invoice.numero, W - M, y + 5, { align: 'right' });

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_MID);
  pdf.text('Agencia de Contenido Digital', M, y);

  // Estado badge (positioned below the invoice number)
  const eColor = invoice.estado === 'pagado' ? '#10b981' : invoice.estado === 'cancelado' ? '#ef4444' : '#f59e0b';
  pdf.setFillColor(eColor);
  const badgeW = 24, badgeH = 5;
  pdf.roundedRect(W - M - badgeW, y + 1, badgeW, badgeH, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor('#ffffff');
  pdf.text(invoice.estado.toUpperCase(), W - M - badgeW / 2, y + 4.5, { align: 'center' });

  y += 12;

  // Divider
  pdf.setDrawColor(RULE);
  pdf.setLineWidth(0.3);
  pdf.line(M, y, W - M, y);
  y += 8;

  // ── CLIENT + DATES (2 columns) ──
  const col2 = W / 2 + 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(TEXT_DIM);
  pdf.text('CLIENTE', M, y);
  pdf.text('EMISIÓN', col2, y);

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(invoice.cliente_nombre || '—', M, y);
  pdf.setFontSize(9);
  pdf.text(fmtDate(invoice.fecha_emision), col2, y);

  y += 5;
  if (invoice.cliente_empresa) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(TEXT_MID);
    pdf.text(invoice.cliente_empresa, M, y);
  }

  if (invoice.fecha_vencimiento) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(TEXT_DIM);
    pdf.text('VENCIMIENTO', col2, y - 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(TEXT_MID);
    pdf.text(fmtDate(invoice.fecha_vencimiento), col2, y);
  }

  if (invoice.cliente_email) {
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(TEXT_DIM);
    pdf.text(invoice.cliente_email, M, y);
  }

  y += 12;

  // ── SERVICES TABLE ──
  const tableData = invoice.items
    .filter(it => it.descripcion.trim())
    .map(it => {
      const sub = (Number(it.cantidad) || 0) * (Number(it.precio) || 0);
      return [
        it.descripcion,
        String(it.cantidad),
        fmtMoney(it.precio, cur.symbol),
        fmtMoney(sub, cur.symbol),
      ];
    });

  pdf.autoTable({
    startY: y,
    head: [['DESCRIPCIÓN', 'CANT.', 'PRECIO UNIT.', 'TOTAL']],
    body: tableData.length > 0 ? tableData : [['Sin servicios registrados', '', '', '']],
    margin: { left: M, right: M },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: TEXT_MAIN,
      fillColor: BG,
      lineColor: RULE,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: TEXT_DIM,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: PANEL },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.textColor = TEXT_MAIN;
        data.cell.styles.fillColor = data.row.index % 2 === 0 ? BG : PANEL;
      }
    },
  });

  y = pdf.lastAutoTable.finalY + 8;

  // ── TOTALS BLOCK ──
  const totalsX = W - M - 80;
  const totalsW = 80;

  pdf.setFillColor(PANEL);
  pdf.roundedRect(totalsX - 4, y - 4, totalsW + 4, 42, 3, 3, 'F');

  const rowY = (r) => y + r * 8;

  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(TEXT_MID);
  pdf.text('Subtotal', totalsX, rowY(0));
  pdf.setTextColor(TEXT_MAIN);
  pdf.text(fmtMoney(subtotal, cur.symbol), W - M, rowY(0), { align: 'right' });

  // Descuento
  if (Number(invoice.descuento) > 0) {
    pdf.setTextColor(TEXT_MID);
    pdf.text(`Descuento ${invoice.descuento}%`, totalsX, rowY(1));
    pdf.setTextColor('#f59e0b');
    pdf.text(`− ${fmtMoney(disc, cur.symbol)}`, W - M, rowY(1), { align: 'right' });
    y += 8;
  }

  // Rule
  pdf.setDrawColor(RULE);
  pdf.setLineWidth(0.3);
  pdf.line(totalsX, rowY(1) + 2, W - M, rowY(1) + 2);

  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(ACCENT);
  pdf.text('TOTAL', totalsX, rowY(2) + 2);
  pdf.text(fmtMoney(total, cur.symbol), W - M, rowY(2) + 2, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(TEXT_DIM);
  pdf.text(cur.name.toUpperCase(), totalsX, rowY(3) - 2);

  y = rowY(4) + 4;

  // ── NOTES ──
  if (invoice.notas) {
    y += 4;
    pdf.setFillColor(PANEL);
    pdf.roundedRect(M - 2, y - 3, W - M * 2 + 4, 14, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(TEXT_DIM);
    pdf.text('NOTAS', M, y + 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(TEXT_MID);
    const lines = pdf.splitTextToSize(invoice.notas, W - M * 2);
    pdf.text(lines, M, y + 7);
    y += 16;
  }

  // ── FOOTER ──
  const footerY = 282;
  pdf.setDrawColor(RULE);
  pdf.setLineWidth(0.3);
  pdf.line(M, footerY, W - M, footerY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(ACCENT);
  pdf.text('AGENCIA ARX', M, footerY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(TEXT_DIM);
  pdf.text('Agencia de Contenido Digital — Gracias por confiar en nosotros', M, footerY + 9);
  pdf.text(`© ${new Date().getFullYear()} Agencia Arx`, W - M, footerY + 9, { align: 'right' });

  return pdf;
};

// ─── INVOICE PREVIEW COMPONENT ────────────────────────────────────────────────

const InvoicePreview = ({ invoice, darkMode }) => {
  const cur = getCurrency(invoice.moneda);
  const { subtotal, disc, total } = calcTotals(invoice.items, invoice.descuento);
  const estado = getEstado(invoice.estado);

  const bg = darkMode ? '#0e0e0e' : '#ffffff';
  const textMain = darkMode ? '#f0f0f0' : '#111111';
  const textMid = darkMode ? '#888888' : '#666666';
  const textDim = darkMode ? '#555555' : '#aaaaaa';
  const border = darkMode ? '#2a2a2a' : '#e8e8e8';
  const panel = darkMode ? '#161616' : '#f8f8f8';
  const accent = darkMode ? '#e0e0e0' : '#111111';

  return (
    <div style={{
      backgroundColor: bg, borderRadius: 8, padding: '28px 28px 20px',
      fontFamily: 'Inter, sans-serif', border: `1px solid ${border}`,
      minHeight: 500, color: textMain, fontSize: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', color: accent }}>AGENCIA ARX</div>
          <div style={{ fontSize: 9, color: textDim, marginTop: 2 }}>Agencia de Contenido Digital</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: textDim, textTransform: 'uppercase', marginBottom: 3 }}>Factura</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMain }}>{invoice.numero}</div>
          <div style={{
            marginTop: 6, display: 'inline-block', padding: '3px 10px', borderRadius: 100,
            backgroundColor: estado.bg, border: `1px solid ${estado.border}`,
            fontSize: 8, fontWeight: 800, color: estado.color, textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {estado.label}
          </div>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: border, margin: '16px 0' }} />

      {/* Client + Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 8, color: textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Cliente</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMain }}>{invoice.cliente_nombre || '—'}</div>
          {invoice.cliente_empresa && <div style={{ fontSize: 10, color: textMid, marginTop: 2 }}>{invoice.cliente_empresa}</div>}
          {invoice.cliente_email && <div style={{ fontSize: 9, color: textDim, marginTop: 2 }}>{invoice.cliente_email}</div>}
        </div>
        <div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, color: textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Emisión</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: textMain }}>{fmtDate(invoice.fecha_emision)}</div>
          </div>
          {invoice.fecha_vencimiento && (
            <div>
              <div style={{ fontSize: 8, color: textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Vencimiento</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: textMain }}>{fmtDate(invoice.fecha_vencimiento)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${border}` }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 50px 80px 80px',
          padding: '8px 12px', backgroundColor: panel,
          fontSize: 8, fontWeight: 800, color: textDim, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span>Descripción</span>
          <span style={{ textAlign: 'center' }}>Cant.</span>
          <span style={{ textAlign: 'right' }}>Precio</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>
        {invoice.items.filter(it => it.descripcion.trim() || it.precio).map((it, i) => {
          const rowTotal = (Number(it.cantidad) || 0) * (Number(it.precio) || 0);
          return (
            <div key={it.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 50px 80px 80px',
              padding: '9px 12px', fontSize: 10,
              borderTop: i > 0 ? `1px solid ${border}` : 'none',
              backgroundColor: i % 2 === 0 ? bg : panel,
            }}>
              <span style={{ color: textMain, fontWeight: 500 }}>{it.descripcion || '—'}</span>
              <span style={{ textAlign: 'center', color: textMid }}>{it.cantidad}</span>
              <span style={{ textAlign: 'right', color: textMid }}>{fmtMoney(it.precio, cur.symbol)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: textMain }}>{fmtMoney(rowTotal, cur.symbol)}</span>
            </div>
          );
        })}
        {invoice.items.filter(it => it.descripcion.trim() || it.precio).length === 0 && (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: textDim, fontSize: 10 }}>
            Agrega servicios al formulario
          </div>
        )}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ minWidth: 200, padding: '14px 16px', backgroundColor: panel, borderRadius: 8, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 10 }}>
            <span style={{ color: textDim }}>Subtotal</span>
            <span style={{ color: textMain, fontWeight: 600 }}>{fmtMoney(subtotal, cur.symbol)}</span>
          </div>
          {Number(invoice.descuento) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 10 }}>
              <span style={{ color: textDim }}>Descuento {invoice.descuento}%</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>− {fmtMoney(disc, cur.symbol)}</span>
            </div>
          )}
          <div style={{ height: 1, backgroundColor: border, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: accent }}>{fmtMoney(total, cur.symbol)}</span>
          </div>
          <div style={{ fontSize: 8, color: textDim, marginTop: 4, textAlign: 'right' }}>{cur.name}</div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notas && (
        <div style={{ marginTop: 16, padding: '12px 14px', backgroundColor: panel, borderRadius: 8, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 8, color: textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Notas</div>
          <div style={{ fontSize: 10, color: textMid, lineHeight: 1.5 }}>{invoice.notas}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: accent }}>AGENCIA ARX</div>
          <div style={{ fontSize: 8, color: textDim }}>Agencia de Contenido Digital</div>
        </div>
        <div style={{ fontSize: 8, color: textDim }}>© {new Date().getFullYear()} Agencia Arx</div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function FacturasArx({ token, isDark = true, clients = [] }) {
  const t = useTheme(isDark);

  const [view, setView] = useState('list'); // 'list' | 'form' | 'preview'
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(emptyInvoice());
  const [editingId, setEditingId] = useState(null);
  const [previewDark, setPreviewDark] = useState(false);
  const [filterEstado, setFilterEstado] = useState('all');

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── LOAD ──
  const loadInvoices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await loadInvoicesFromDrive(token);
      setInvoices(data);
    } catch (e) {
      showToast('Error cargando facturas desde Drive', 'err');
    }
    setLoading(false);
  }, [token, showToast]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  // ── FORM HANDLERS ──
  const updateForm = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateItem = (id, key, val) =>
    setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [key]: val } : it) }));

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));

  const removeItem = (id) =>
    setForm(f => ({ ...f, items: f.items.filter(it => it.id !== id) }));

  // ── SAVE ──
  const handleSave = async () => {
    if (!form.cliente_nombre.trim()) { showToast('El nombre del cliente es obligatorio', 'err'); return; }
    if (!token) { showToast('Conecta tu cuenta de Google Drive primero', 'err'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const inv = invoices.find(i => i.numero === editingId);
        await updateInvoiceInDrive(token, inv._driveFileId, form);
        showToast('Factura actualizada en Drive ✓');
      } else {
        await saveInvoiceToDrive(token, form);
        showToast('Factura guardada en Drive ✓');
      }

      // NUEVO: Generar PDF y subirlo a Drive (control PDF/Marketing)
      try {
        const pdfDoc = generatePDF(form, false);
        const pdfBlob = pdfDoc.output('blob');
        const pdfName = `${form.numero}.pdf`;
        await uploadPdfToDrive(token, pdfBlob, pdfName, 'Marketing');
      } catch (pdfErr) {
        console.error("Error al subir el PDF de la factura a Drive:", pdfErr);
      }

      await loadInvoices();
      setView('list');
      setForm(emptyInvoice());
      setEditingId(null);
    } catch (e) {
      showToast('Error guardando en Drive: ' + e.message, 'err');
    }
    setSaving(false);
  };

  // ── DELETE ──
  const handleDelete = async (inv) => {
    if (!confirm(`¿Eliminar la factura ${inv.numero}?`)) return;
    try {
      await deleteInvoiceFromDrive(token, inv._driveFileId);
      showToast('Factura eliminada');
      await loadInvoices();
    } catch (e) {
      showToast('Error al eliminar: ' + e.message, 'err');
    }
  };

  // ── EXPORT PDF ──
  const handleExport = (inv, dark = false) => {
    const pdf = generatePDF(inv, dark);
    pdf.save(`${inv.numero}${dark ? '-dark' : ''}.pdf`);
    showToast(`PDF ${dark ? 'oscuro' : 'claro'} descargado ✓`);
  };

  // ── OPEN FORM ──
  const openNew = () => {
    setForm(emptyInvoice());
    setEditingId(null);
    setView('form');
  };

  const openEdit = (inv) => {
    setForm({ ...inv });
    setEditingId(inv.numero);
    setView('form');
  };

  // ── FILTERED ──
  const filtered = filterEstado === 'all' ? invoices : invoices.filter(i => i.estado === filterEstado);

  // ── TOTALS STATS ──
  const stats = {
    total: invoices.length,
    pagadas: invoices.filter(i => i.estado === 'pagado').length,
    pendientes: invoices.filter(i => i.estado === 'pendiente').length,
    totalMonto: invoices.filter(i => i.estado === 'pagado').reduce((s, i) => {
      const { total } = calcTotals(i.items, i.descuento);
      return s + total;
    }, 0),
  };

  if (!token) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
      <div style={{
        backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 20,
        padding: 48, textAlign: 'center', maxWidth: 420,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Cloud size={32} color={t.textMuted} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Conecta Google Drive</div>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
          Las facturas de Agencia Arx se guardan en tu Google Drive. Conecta tu cuenta desde la sección <strong>Almacenamiento</strong>.
        </p>
        <div style={{ fontSize: 9, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Configuración → Almacenamiento → Conectar Google
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300"
          style={toast.type === 'err'
            ? { backgroundColor: '#2a0f0f', border: '1px solid #5c1a1a', color: '#f0b0b0' }
            : { backgroundColor: '#0f2a1a', border: '1px solid #1a5c2a', color: '#b0f0c0' }}>
          {toast.type === 'err' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span style={{ fontSize: 12, fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 }}>
                Facturas
              </h2>
              <p style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>Agencia Arx — guardado en Google Drive</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={loadInvoices} style={{ padding: '8px 10px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textMuted, cursor: 'pointer' }}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', backgroundColor: 'transparent', border: `1px solid ${t.accent}`, borderRadius: 10, color: t.accent, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                <Plus size={14} /> Nueva Factura
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Facturas', val: stats.total, color: t.textMuted },
              { label: 'Pagadas', val: stats.pagadas, color: '#10b981' },
              { label: 'Pendientes', val: stats.pendientes, color: '#f59e0b' },
              { label: 'Ingresos Cobrados', val: `$${stats.totalMonto.toFixed(0)}`, color: t.accent },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 18px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 8, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 300, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[{ id: 'all', label: 'Todas' }, ...ESTADOS].map(e => (
              <button key={e.id} onClick={() => setFilterEstado(e.id)} style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                backgroundColor: filterEstado === e.id ? t.accent : 'transparent',
                color: filterEstado === e.id ? (isDark ? '#000' : '#fff') : t.textDim,
                border: `1px solid ${filterEstado === e.id ? t.accent : t.border}`,
                transition: 'all 0.15s',
              }}>{e.label}</button>
            ))}
          </div>

          {/* Invoices List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: t.textDim }}>
              <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando desde Google Drive...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: `1px dashed ${t.border}`, borderRadius: 16 }}>
              <FileText size={32} color={t.textDim} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>No hay facturas {filterEstado !== 'all' ? `con estado "${filterEstado}"` : 'registradas'}</div>
              <div style={{ fontSize: 9, color: t.textDim, marginTop: 6 }}>Crea tu primera factura con el botón "Nueva Factura"</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(inv => {
                const { total } = calcTotals(inv.items, inv.descuento);
                const cur = getCurrency(inv.moneda);
                const estado = getEstado(inv.estado);
                return (
                  <div key={inv.numero} style={{
                    display: 'grid', gridTemplateColumns: '180px 1fr 1fr 120px 110px auto',
                    alignItems: 'center', gap: 16, padding: '14px 18px',
                    backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    borderRadius: 12, transition: 'all 0.15s',
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{inv.numero}</div>
                      <div style={{ fontSize: 8, color: t.textDim, marginTop: 2 }}>{fmtDate(inv.fecha_emision)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{inv.cliente_nombre}</div>
                      <div style={{ fontSize: 9, color: t.textDim }}>{inv.cliente_empresa || '—'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {fmtMoney(total, cur.symbol)}
                      <span style={{ fontSize: 9, color: t.textDim, marginLeft: 4 }}>{inv.moneda}</span>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                        fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                        backgroundColor: estado.bg, border: `1px solid ${estado.border}`, color: estado.color,
                      }}>{estado.label}</span>
                    </div>
                    <div style={{ fontSize: 9, color: t.textDim }}>{inv.items.filter(i => i.descripcion).length} servicio(s)</div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setForm({ ...inv }); setView('preview'); }} title="Vista previa"
                        style={{ padding: 7, backgroundColor: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', color: t.textMuted }}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(inv)} title="Editar"
                        style={{ padding: 7, backgroundColor: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', color: t.textMuted }}>
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => handleExport(inv, false)} title="Descargar PDF claro"
                        style={{ padding: 7, backgroundColor: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', color: t.accent }}>
                        <Download size={13} />
                      </button>
                      <button onClick={() => handleDelete(inv)} title="Eliminar"
                        style={{ padding: 7, backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FORM VIEW ── */}
      {view === 'form' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Form */}
          <div style={{ width: '52%', overflow: 'auto', padding: '20px 24px', borderRight: `1px solid ${t.border}` }}>

            {/* Form Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setView('list')} style={{ padding: 8, backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, cursor: 'pointer', color: t.textMuted }}>
                <ArrowLeft size={14} />
              </button>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {editingId ? `Editar ${editingId}` : 'Nueva Factura'}
                </h2>
                <p style={{ fontSize: 9, color: t.textDim, margin: 0 }}>Agencia Arx</p>
              </div>
            </div>

            {/* Número */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Número de Factura</div>
              <input value={form.numero} onChange={e => updateForm('numero', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Cliente */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Datos del Cliente</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'cliente_nombre', label: 'Nombre *', placeholder: 'Nombre del cliente', icon: User },
                  { key: 'cliente_empresa', label: 'Empresa', placeholder: 'Nombre de empresa', icon: Building2 },
                  { key: 'cliente_email', label: 'Email', placeholder: 'email@cliente.com', icon: Tag, span: 2 },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.span ? `span ${f.span}` : 'auto' }}>
                    <div style={{ fontSize: 8, color: t.textDim, marginBottom: 4 }}>{f.label}</div>
                    <input value={form[f.key]} onChange={e => updateForm(f.key, e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Fechas + Moneda + Estado */}
            <div style={{ marginBottom: 20, marginTop: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Configuración</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                {[
                  { key: 'fecha_emision', label: 'Emisión', type: 'date' },
                  { key: 'fecha_vencimiento', label: 'Vencimiento', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 8, color: t.textDim, marginBottom: 4 }}>{f.label}</div>
                    <input type="date" value={form[f.key]} onChange={e => updateForm(f.key, e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 8, color: t.textDim, marginBottom: 4 }}>Moneda</div>
                  <select value={form.moneda} onChange={e => updateForm('moneda', e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: t.textDim, marginBottom: 4 }}>Estado</div>
                  <select value={form.estado} onChange={e => updateForm('estado', e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}>
                    {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Servicios</div>
                <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: 'transparent', border: `1px solid ${t.accent}`, borderRadius: 7, color: t.accent, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={11} /> Agregar
                </button>
              </div>

              {/* Items header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 30px', gap: 8, padding: '0 0 6px', borderBottom: `1px solid ${t.border}`, marginBottom: 8 }}>
                {['Descripción', 'Cant.', 'Precio', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: 8, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>

              {form.items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input value={item.descripcion} onChange={e => updateItem(item.id, 'descripcion', e.target.value)}
                    placeholder="Nombre del servicio..."
                    style={{ padding: '8px 10px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  <input type="number" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', e.target.value)}
                    min={1} style={{ padding: '8px 8px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'center' }} />
                  <input type="number" value={item.precio} onChange={e => updateItem(item.id, 'precio', e.target.value)}
                    placeholder="0.00" min={0} step={0.01}
                    style={{ padding: '8px 8px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right' }} />
                  <button onClick={() => removeItem(item.id)} style={{ padding: 6, backgroundColor: 'transparent', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Descuento + Notas */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 8, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Descuento %</div>
                <input type="number" value={form.descuento} onChange={e => updateForm('descuento', e.target.value)}
                  min={0} max={100} placeholder="0"
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
              <div>
                <div style={{ fontSize: 8, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Notas para el cliente</div>
                <textarea value={form.notas} onChange={e => updateForm('notas', e.target.value)}
                  placeholder="Gracias por tu confianza..."
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', border: `1px solid ${t.accent}`, borderRadius: 10, color: t.accent, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
              {saving ? 'Guardando en Drive...' : 'Guardar en Google Drive'}
            </button>
          </div>

          {/* Right: Preview */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 20px 16px', backgroundColor: isDark ? '#0a0a0a' : '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Vista Previa</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Light/Dark toggle */}
                <div style={{ display: 'flex', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 2 }}>
                  {[{ dark: false, icon: Sun }, { dark: true, icon: Moon }].map(({ dark, icon: Icon }) => (
                    <button key={String(dark)} onClick={() => setPreviewDark(dark)}
                      style={{ padding: '5px 8px', borderRadius: 6, cursor: 'pointer', border: 'none', backgroundColor: previewDark === dark ? t.accent : 'transparent', color: previewDark === dark ? (isDark ? '#000' : '#fff') : t.textDim, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}>
                      <Icon size={12} />
                    </button>
                  ))}
                </div>
                {/* Export */}
                <button onClick={() => handleExport(form, previewDark)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accent, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
            <InvoicePreview invoice={form} darkMode={previewDark} />
          </div>
        </div>
      )}

      {/* ── PREVIEW-ONLY VIEW ── */}
      {view === 'preview' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textMuted, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Volver
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 2 }}>
                {[{ dark: false, icon: Sun, label: 'Claro' }, { dark: true, icon: Moon, label: 'Oscuro' }].map(({ dark, icon: Icon, label }) => (
                  <button key={String(dark)} onClick={() => setPreviewDark(dark)}
                    style={{ padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: 'none', backgroundColor: previewDark === dark ? t.accent : 'transparent', color: previewDark === dark ? (isDark ? '#000' : '#fff') : t.textDim, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
              <button onClick={() => handleExport(form, previewDark)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', backgroundColor: 'transparent', border: `1px solid ${t.accent}`, borderRadius: 10, color: t.accent, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                <Download size={14} /> Descargar PDF
              </button>
            </div>
          </div>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <InvoicePreview invoice={form} darkMode={previewDark} />
          </div>
        </div>
      )}
    </div>
  );
}
