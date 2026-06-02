import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Image, Upload, Save, Copy, Check } from 'lucide-react';

const QrPagoConfig = ({ isDark, config, onSave }) => {
  const t = isDark
    ? { bg: '#1a1a2e', card: '#16213e', text: '#eee', textDim: '#999', accent: '#0ea5e9', input: '#1e293b', border: '#334155', danger: '#ef4444' }
    : { bg: '#f8fafc', card: '#fff', text: '#1e293b', textDim: '#64748b', accent: '#0ea5e9', input: '#f1f5f9', border: '#e2e8f0', danger: '#ef4444' };

  const [titular, setTitular] = useState(config?.cuenta_titular || '');
  const [banco, setBanco] = useState(config?.cuenta_banco || 'BCP');
  const [numero, setNumero] = useState(config?.cuenta_numero || '');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(config?.qr_url || '');
  const [copied, setCopied] = useState(false);

  const datosQr = `BANCO: ${banco}\nCUENTA: ${numero}\nTITULAR: ${titular}`;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCopyDatos = async () => {
    try {
      await navigator.clipboard.writeText(datosQr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = () => {
    onSave?.({ cuenta_titular: titular, cuenta_banco: banco, cuenta_numero: numero, qr_url: qrPreview });
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{
        padding: '24px', borderRadius: '16px',
        backgroundColor: t.card, border: `1px solid ${t.border}`,
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image size={16} /> QR de Pago
        </h3>
        <p style={{ fontSize: '11px', color: t.textDim, margin: '0 0 20px' }}>
          Configura la imagen QR que se enviará a los clientes para depósitos
        </p>

        {/* Datos bancarios */}
        <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 600, color: t.textDim, display: 'block', marginBottom: '4px' }}>Titular de la cuenta</label>
            <input type="text" value={titular} onChange={e => setTitular(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Ej: Carlos Joel" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 600, color: t.textDim, display: 'block', marginBottom: '4px' }}>Banco</label>
              <input type="text" value={banco} onChange={e => setBanco(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="BCP" />
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 600, color: t.textDim, display: 'block', marginBottom: '4px' }}>N° de Cuenta</label>
              <input type="text" value={numero} onChange={e => setNumero(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: '12px', backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="123-456789-0-00" />
            </div>
          </div>
        </div>

        {/* Previsualización QR */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '16px', borderRadius: '12px',
          backgroundColor: t.bg, border: `1px solid ${t.border}`,
          marginBottom: '20px'
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'white', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {qrPreview ? (
              <img src={qrPreview} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <QRCodeSVG value={datosQr || 'Sin datos'} size={90} level="M" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: t.text, margin: '0 0 4px' }}>Vista previa del QR</p>
            <p style={{ fontSize: '9px', color: t.textDim, margin: 0 }}>
              {qrPreview ? 'QR personalizado subido' : 'QR generado automáticamente desde los datos bancarios'}
            </p>
          </div>
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            backgroundColor: t.accent, color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Upload size={14} /> Subir imagen QR
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={handleCopyDatos}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
              backgroundColor: t.input, color: t.text, border: `1px solid ${t.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar datos bancarios'}
          </button>
          <button onClick={handleSave}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
              backgroundColor: '#22c55e', color: 'white', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <Save size={14} /> Guardar configuración
          </button>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        backgroundColor: `${t.accent}08`, border: `1px solid ${t.accent}20`,
      }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: t.accent, margin: '0 0 6px' }}>📍 ¿Dónde se guarda la imagen QR?</p>
        <p style={{ fontSize: '10px', color: t.textDim, margin: 0, lineHeight: 1.5 }}>
          Puedes colocar tu imagen QR directamente en la carpeta <strong>public/assets/qr_pago.png</strong> del proyecto.<br />
          También puedes subirla aquí y se vinculará automáticamente.
        </p>
      </div>
    </div>
  );
};

export default QrPagoConfig;