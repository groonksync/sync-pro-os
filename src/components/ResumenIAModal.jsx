import React, { useMemo, useRef } from 'react';
import { X, Download, FileText, Brain, TrendingUp, DollarSign, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

/**
 * Modal profesional para mostrar el Resumen Ejecutivo IA.
 * Recibe el contenido JSON estructurado y lo renderiza como tablas comparativas.
 */
const ResumenIAModal = ({ isOpen, onClose, contenido, cargando, isDark, titulo, onExportPDF }) => {
  const t = useTheme(isDark);
  const contentRef = useRef(null);

  // Parsear el contenido JSON de la IA
  const parsed = useMemo(() => {
    if (!contenido || typeof contenido !== 'string') return null;
    try {
      // Intentar parsear como JSON directo
      return JSON.parse(contenido);
    } catch {
      // Si falla, buscar bloque JSON dentro del texto
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }, [contenido]);

  // Si no se pudo parsear, mostrar como texto plano
  const mostrarTextoPlano = !parsed;

  if (!isOpen) return null;

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderTable = (data, columns, accentColor = t.accent) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    const colKeys = columns.map(c => c.key);
    return (
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '11px', marginTop: '8px',
      }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '8px 10px', fontSize: '9px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: t.textDim, textAlign: col.align || 'left',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{
              borderBottom: `1px solid ${t.border}`,
              backgroundColor: i % 2 === 0 ? 'transparent' : `${accentColor}04`,
            }}>
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: '8px 10px', fontSize: '10px',
                  fontWeight: col.bold ? 700 : 500,
                  color: col.color ? col.color : t.text,
                  textAlign: col.align || 'left',
                }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderSection = (title, icon, data, columns, accentColor) => (
    <div style={{
      marginBottom: '16px', padding: '14px',
      backgroundColor: `${accentColor || t.accent}06`,
      border: `1px solid ${accentColor || t.accent}20`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        {icon && icon}
        <h4 style={{ fontSize: '11px', fontWeight: 700, color: accentColor || t.accent, margin: 0 }}>
          {title}
        </h4>
      </div>
      {data ? (
        Array.isArray(data) ? renderTable(data, columns, accentColor) : (
          <p style={{ fontSize: '11px', color: t.text, margin: '8px 0 0 0', lineHeight: 1.6 }}>
            {data}
          </p>
        )
      ) : (
        <p style={{ fontSize: '10px', color: t.textDim, margin: '8px 0 0 0' }}>Sin datos disponibles</p>
      )}
    </div>
  );

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '92%',
          maxWidth: '800px',
          maxHeight: '85vh',
          backgroundColor: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ─── HEADER ─────────────────────────────────── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
              flexShrink: 0,
            }}>
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.3 }}>
                {cargando ? 'Generando resumen...' : titulo || 'Resumen Ejecutivo IA'}
              </h3>
              {!cargando && contenido && (
                <p style={{ fontSize: '9px', color: t.textDim, margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                  {fechaActual}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {!cargando && contenido && (
              <button
                onClick={() => onExportPDF && onExportPDF(parsed || contenido)}
                style={{
                  padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`,
                  backgroundColor: 'transparent', color: t.text,
                  fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Download size={14} /> Exportar PDF
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px', borderRadius: '10px', border: 'none',
                background: 'transparent', color: t.textDim,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── CONTENIDO ─────────────────────────────────── */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
        }} ref={contentRef}>
          {cargando ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="animate-spin" style={{
                width: '32px', height: '32px',
                border: '3px solid', borderColor: `${t.accent}20`,
                borderTopColor: t.accent, borderRadius: '50%',
                margin: '0 auto 16px',
              }}></div>
              <p style={{ fontSize: '13px', color: t.textDim, margin: 0 }}>
                Analizando datos financieros y operativos...
              </p>
              <p style={{ fontSize: '10px', color: t.textMuted, margin: '8px 0 0 0' }}>
                Generando tabla comparativa profesional
              </p>
            </div>
          ) : mostrarTextoPlano ? (
            /* Fallback: mostrar como texto plano con formato */
            <div style={{
              padding: '16px', borderRadius: '12px',
              backgroundColor: t.input,
              fontSize: '12px', color: t.text, lineHeight: 1.8,
              whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            }}>
              {contenido || 'No se pudo generar el resumen.'}
            </div>
          ) : (
            /* Renderizado profesional con tablas */
            <div>
              {/* Resumen General */}
              {parsed.resumenGeneral && renderSection(
                '📊 Resumen General',
                <TrendingUp size={14} color={t.accent} />,
                parsed.resumenGeneral,
                [
                  { key: 'indicador', label: 'Indicador', bold: true },
                  { key: 'valor', label: 'Valor', align: 'right', bold: true, color: t.accent },
                  { key: 'variacion', label: 'vs. Mes Anterior', align: 'right' },
                ],
                t.accent
              )}

              {/* Tabla de Cartera */}
              {parsed.tablaCartera && renderSection(
                '💼 Cartera de Préstamos',
                <DollarSign size={14} color="#22c55e" />,
                parsed.tablaCartera,
                [
                  { key: 'concepto', label: 'Concepto', bold: true },
                  { key: 'cantidad', label: 'Cantidad', align: 'right' },
                  { key: 'monto', label: 'Monto (Bs)', align: 'right', bold: true },
                  { key: 'porcentaje', label: '%', align: 'right', color: t.accent },
                ],
                '#22c55e'
              )}

              {/* Tabla de Inventario */}
              {parsed.tablaInventario && renderSection(
                '📦 Inventario',
                <Package size={14} color="#3b82f6" />,
                parsed.tablaInventario,
                [
                  { key: 'concepto', label: 'Concepto', bold: true },
                  { key: 'cantidad', label: 'Cantidad', align: 'right' },
                  { key: 'valor', label: 'Valor (Bs)', align: 'right', bold: true },
                ],
                '#3b82f6'
              )}

              {/* Tabla de Balance */}
              {parsed.tablaBalance && renderSection(
                '💰 Balance Financiero',
                <FileText size={14} color="#a855f7" />,
                parsed.tablaBalance,
                [
                  { key: 'concepto', label: 'Concepto', bold: true },
                  { key: 'ingresos', label: 'Ingresos', align: 'right', color: '#22c55e' },
                  { key: 'egresos', label: 'Egresos', align: 'right', color: '#ef4444' },
                  { key: 'neto', label: 'Neto', align: 'right', bold: true },
                ],
                '#a855f7'
              )}

              {/* Alertas / Riesgos */}
              {parsed.alertas && renderSection(
                '⚠️ Alertas y Riesgos',
                <AlertTriangle size={14} color="#f59e0b" />,
                parsed.alertas,
                [
                  { key: 'tipo', label: 'Tipo', bold: true },
                  { key: 'descripcion', label: 'Descripción' },
                  { key: 'nivel', label: 'Nivel', align: 'center' },
                  { key: 'accion', label: 'Acción Sugerida' },
                ],
                '#f59e0b'
              )}

              {/* Recomendaciones */}
              {parsed.recomendaciones && (
                <div style={{
                  marginTop: '16px', padding: '16px',
                  background: `linear-gradient(135deg, ${t.accent}10, ${t.accent}05)`,
                  border: `1px solid ${t.accent}30`,
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle size={14} color={t.accent} />
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: t.accent, margin: 0 }}>
                      Recomendaciones Estratégicas
                    </h4>
                  </div>
                  {Array.isArray(parsed.recomendaciones) ? (
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {parsed.recomendaciones.map((rec, i) => (
                        <li key={i} style={{
                          fontSize: '10px', color: t.text, lineHeight: 1.7,
                          marginBottom: '4px',
                        }}>
                          {typeof rec === 'string' ? rec : rec.text || rec.recomendacion || JSON.stringify(rec)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '10px', color: t.text, margin: 0, lineHeight: 1.7 }}>
                      {typeof parsed.recomendaciones === 'string' ? parsed.recomendaciones : JSON.stringify(parsed.recomendaciones)}
                    </p>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div style={{
                marginTop: '16px', padding: '10px 14px',
                backgroundColor: t.input, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '9px', color: t.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} /> Generado el {fechaActual}
                </span>
                <span style={{ fontSize: '9px', color: t.textMuted }}>
                  Inefable · Resumen Ejecutivo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER ─────────────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          borderTop: `1px solid ${t.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: '12px',
              border: `1px solid ${t.border}`,
              backgroundColor: 'transparent', color: t.textDim,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumenIAModal;
