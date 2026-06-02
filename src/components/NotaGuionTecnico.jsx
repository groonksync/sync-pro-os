import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Table, MoreHorizontal } from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

/**
 * Editor especializado para Guion Técnico con tablas editables.
 * Cada bloque puede ser texto o tabla.
 */
const NotaGuionTecnico = ({ bloques = [], onChange, isDark }) => {
  const t = useTheme(isDark);
  const [activeColMenu, setActiveColMenu] = useState(null); // { bloqueId, colIndex }

  const parsed = (() => {
    if (!bloques || bloques.length === 0) {
      return [{ id: 'b1', tipo: 'texto', contenido: '## Escena 1\n\nDescripción de la escena...' }];
    }
    if (typeof bloques === 'string') {
      try { return JSON.parse(bloques); } catch { return [{ id: 'b1', tipo: 'texto', contenido: bloques }]; }
    }
    if (Array.isArray(bloques)) return bloques;
    return [];
  })();

  const updateBloques = (updated) => onChange(updated);

  const addBloque = (tipo) => {
    const newId = 'b' + Date.now();
    if (tipo === 'tabla') {
      updateBloques([...parsed, {
        id: newId, tipo: 'tabla',
        columnas: ['Tiempo', 'Video', 'Audio', 'Notas'],
        filas: [
          { id: 'r1', celdas: ['00:00 - 00:15', 'Toma principal', 'Música fondo', ''] }
        ]
      }]);
    } else {
      updateBloques([...parsed, { id: newId, tipo: 'texto', contenido: '## Nueva sección\n\nEscribe aquí...' }]);
    }
  };

  const removeBloque = (id) => {
    updateBloques(parsed.filter(b => b.id !== id));
  };

  const updateBloque = (id, field, value) => {
    updateBloques(parsed.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addFila = (bloqueId) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      const colCount = b.columnas?.length || 4;
      const newRowId = 'r' + Date.now();
      return {
        ...b,
        filas: [...(b.filas || []), { id: newRowId, celdas: Array(colCount).fill('') }]
      };
    }));
  };

  const updateCelda = (bloqueId, filaId, colIndex, value) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      return {
        ...b,
        filas: (b.filas || []).map(f =>
          f.id === filaId
            ? { ...f, celdas: f.celdas.map((c, i) => i === colIndex ? value : c) }
            : f
        )
      };
    }));
  };

  const removeFila = (bloqueId, filaId) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      return { ...b, filas: (b.filas || []).filter(f => f.id !== filaId) };
    }));
  };

  const addColumna = (bloqueId) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      return {
        ...b,
        columnas: [...(b.columnas || []), 'Nueva'],
        filas: (b.filas || []).map(f => ({ ...f, celdas: [...f.celdas, ''] }))
      };
    }));
  };

  const addColumnaAt = (bloqueId, index) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      const updatedCols = [...(b.columnas || [])];
      updatedCols.splice(index, 0, 'Nueva');
      return {
        ...b,
        columnas: updatedCols,
        filas: (b.filas || []).map(f => {
          const updatedCeldas = [...f.celdas];
          updatedCeldas.splice(index, 0, '');
          return { ...f, celdas: updatedCeldas };
        })
      };
    }));
  };

  const removeColumnaAt = (bloqueId, index) => {
    updateBloques(parsed.map(b => {
      if (b.id !== bloqueId) return b;
      return {
        ...b,
        columnas: (b.columnas || []).filter((_, i) => i !== index),
        filas: (b.filas || []).map(f => ({
          ...f,
          celdas: f.celdas.filter((_, i) => i !== index)
        }))
      };
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {parsed.map((bloque) => (
          <div
            key={bloque.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{ border: `1px solid ${t.border}` }}
          >
            {/* Bloque header */}
            <div className="flex items-center justify-between px-3 py-2"
              style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}>
              <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>
                {bloque.tipo === 'tabla' ? '📊 Tabla Técnica' : '📝 Texto'}
              </span>
              <button
                onClick={() => removeBloque(bloque.id)}
                className="p-1 rounded-md transition-all"
                style={{ color: t.textDim }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.danger}15`; e.currentTarget.style.color = t.danger; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
              >
                <Trash2 size={10} />
              </button>
            </div>

            {/* Bloque content */}
            {bloque.tipo === 'tabla' ? (
              <div className="p-2 overflow-x-auto">
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: '10px',
                }}>
                  <thead>
                    <tr>
                      {(bloque.columnas || []).map((col, ci) => (
                        <th key={ci} className="relative group" style={{
                          padding: '6px 8px', fontWeight: 600, textAlign: 'left',
                          backgroundColor: `${t.accent}10`, border: `1px solid ${t.border}`,
                          color: t.text, fontSize: '9px',
                        }}>
                          <div className="flex items-center justify-between gap-1">
                            <input
                              type="text"
                              value={col}
                              onChange={e => {
                                const updated = [...bloque.columnas];
                                updated[ci] = e.target.value;
                                updateBloque(bloque.id, 'columnas', updated);
                              }}
                              className="bg-transparent border-0 outline-none text-[9px] font-semibold flex-1 min-w-0"
                              style={{ color: t.text, padding: 0 }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveColMenu(activeColMenu?.bloqueId === bloque.id && activeColMenu?.colIndex === ci ? null : { bloqueId: bloque.id, colIndex: ci });
                              }}
                              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer shrink-0"
                              style={{ color: t.textDim }}
                            >
                              <MoreHorizontal size={10} />
                            </button>
                            {activeColMenu?.bloqueId === bloque.id && activeColMenu?.colIndex === ci && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveColMenu(null)} />
                                <div className="absolute top-full left-0 mt-1 z-50 w-44 rounded-lg overflow-hidden shadow-xl"
                                  style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
                                  <button
                                    onClick={() => { addColumnaAt(bloque.id, ci); setActiveColMenu(null); }}
                                    className="w-full px-3 py-2 text-[10px] font-medium text-left transition-all"
                                    style={{ color: t.text, borderBottom: `1px solid ${t.border}`, background: 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    Agregar columna a la izquierda
                                  </button>
                                  <button
                                    onClick={() => { addColumnaAt(bloque.id, ci + 1); setActiveColMenu(null); }}
                                    className="w-full px-3 py-2 text-[10px] font-medium text-left transition-all"
                                    style={{ color: t.text, borderBottom: `1px solid ${t.border}`, background: 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    Agregar columna a la derecha
                                  </button>
                                  <button
                                    onClick={() => { removeColumnaAt(bloque.id, ci); setActiveColMenu(null); }}
                                    className="w-full px-3 py-2 text-[10px] font-medium text-left transition-all"
                                    style={{ color: t.danger, background: 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${t.danger}15`}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    Eliminar columna
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(bloque.filas || []).map((fila) => (
                      <tr key={fila.id}>
                        {fila.celdas.map((celda, ci) => (
                          <td key={ci} style={{
                            padding: '4px 6px', border: `1px solid ${t.border}`,
                          }}>
                            <input
                              type="text"
                              value={celda}
                              onChange={e => updateCelda(bloque.id, fila.id, ci, e.target.value)}
                              className="w-full bg-transparent border-0 outline-none text-[10px]"
                              style={{ color: t.textMuted }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '2px', border: `1px solid ${t.border}`, width: '24px' }}>
                          <button
                            onClick={() => removeFila(bloque.id, fila.id)}
                            className="p-1 rounded-md transition-all"
                            style={{ color: t.textDim }}
                            onMouseEnter={e => { e.currentTarget.style.color = t.danger; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textDim; }}
                          >
                            <Trash2 size={8} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => addFila(bloque.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-semibold transition-all"
                    style={{ backgroundColor: `${t.accent}10`, color: t.accent }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.accent}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${t.accent}10`; }}
                  >
                    <Plus size={10} /> Fila
                  </button>
                  <button
                    onClick={() => addColumna(bloque.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-semibold transition-all"
                    style={{ backgroundColor: `${t.accent}10`, color: t.accent }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.accent}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${t.accent}10`; }}
                  >
                    <Plus size={10} /> Columna
                  </button>
                </div>
              </div>
            ) : (
              <textarea
                value={bloque.contenido}
                onChange={e => updateBloque(bloque.id, 'contenido', e.target.value)}
                className="w-full p-3 bg-transparent border-0 outline-none resize-none text-[11px] leading-relaxed"
                style={{ color: t.textMuted, minHeight: '80px', fontFamily: 'inherit' }}
                placeholder="Escribe el contenido del guión..."
              />
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 pt-3 mt-2 border-t shrink-0" style={{ borderColor: t.border }}>
        <button
          onClick={() => addBloque('texto')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-semibold transition-all"
          style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
        >
          <Plus size={12} /> Bloque Texto
        </button>
        <button
          onClick={() => addBloque('tabla')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-semibold transition-all"
          style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
        >
          <Table size={12} /> Tabla Técnica
        </button>
      </div>
    </div>
  );
};

export default NotaGuionTecnico;
