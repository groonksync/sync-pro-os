import React from 'react';
import { X, FileText, Download, Send } from 'lucide-react';
import { generarComprobantePDF } from '../utils/generarComprobantePDF';

const ModalComprobante = ({ isDark, prestamo, cuotaInfo, tipo, onClose, onEnviarWhatsApp }) => {
  const t = isDark
    ? { bg: '#1a1a2e', card: '#16213e', text: '#eee', textDim: '#999', accent: '#0ea5e9', input: '#1e293b', border: '#334155', overlay: 'rgba(0,0,0,0.6)' }
    : { bg: '#f8fafc', card: '#fff', text: '#1e293b', textDim: '#64748b', accent: '#0ea5e9', input: '#f1f5f9', border: '#e2e8f0', overlay: 'rgba(0,0,0,0.4)' };

  const handleDescargarPDF = () => {
    generarComprobantePDF({ prestamo, cuotaInfo, tipo });
  };

  const handleEnviarWhatsApp = () => {
    onEnviarWhatsApp?.();
    onClose();
  };

  if (!prestamo) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: t.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: t.card, borderRadius: '20px',
        width: '100%', maxWidth: '420px',
        padding: '28px', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            border: `1px solid ${t.border}`, backgroundColor: t.input,
            color: t.textDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            backgroundColor: '#22c55e20', color: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: '0 0 4px' }}>
            Comprobante de Pago
          </h3>
          <p style={{ fontSize: '11px', color: t.textDim, margin: 0 }}>
            {prestamo.nombre} — {tipo === 'diario' ? 'Pago diario' : cuotaInfo?.label}
          </p>
        </div>

        {/* Resumen rápido */}
        <div style={{
          padding: '16px', borderRadius: '12px',
          backgroundColor: t.bg, border: `1px solid ${t.border}`,
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: t.textDim }}>Monto pagado</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>
              {(cuotaInfo?.total || 0).toFixed(2)} {prestamo.moneda || 'BOB'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: t.textDim }}>Capital restante</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>
              {(cuotaInfo?.capitalRestante ?? parseFloat(prestamo.capital) ?? 0).toFixed(2)} {prestamo.moneda || 'BOB'}
            </span>
          </div>
          {cuotaInfo?.progreso && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: t.textDim }}>Progreso</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: t.accent }}>
                {cuotaInfo.progreso}
              </span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDescargarPDF}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${t.border}`,
              backgroundColor: t.input, color: t.text, fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            <Download size={14} /> PDF
          </button>
          <button onClick={handleEnviarWhatsApp}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              backgroundColor: '#25D366', color: 'white', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            <Send size={14} /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalComprobante;