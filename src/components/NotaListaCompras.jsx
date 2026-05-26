import React, { useMemo } from 'react';
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react';
import { getTheme } from '../lib/theme';

/**
 * Editor especializado para Lista de Compras.
 * Renderiza items con checkbox, cantidad y precio.
 */
const NotaListaCompras = ({ items = [], onChange, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);

  const parsedItems = (() => {
    if (!items || items.length === 0) {
      // Si contenido es string vacío, inicializar con plantilla
      return [
        { id: '1', texto: 'Item 1', cantidad: 1, precio: 0, comprado: false },
      ];
    }
    if (typeof items === 'string') {
      try { return JSON.parse(items); } catch { return []; }
    }
    if (Array.isArray(items)) return items;
    return [];
  })();

  const handleToggle = (id) => {
    const updated = parsedItems.map(item =>
      item.id === id ? { ...item, comprado: !item.comprado } : item
    );
    onChange(updated);
  };

  const handleChange = (id, field, value) => {
    const updated = parsedItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const handleAdd = () => {
    const newId = String(Date.now());
    const updated = [...parsedItems, { id: newId, texto: '', cantidad: 1, precio: 0, comprado: false }];
    onChange(updated);
  };

  const handleRemove = (id) => {
    const updated = parsedItems.filter(item => item.id !== id);
    onChange(updated);
  };

  const total = parsedItems.reduce((sum, item) => sum + (item.precio || 0) * (item.cantidad || 1), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {parsedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-xl p-2 transition-all"
            style={{
              backgroundColor: item.comprado ? `${t.success}08` : 'transparent',
              border: `1px solid ${item.comprado ? `${t.success}20` : t.border}`,
              opacity: item.comprado ? 0.7 : 1,
            }}
          >
            <button
              onClick={() => handleToggle(item.id)}
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
              style={{
                backgroundColor: item.comprado ? t.success : 'transparent',
                border: `2px solid ${item.comprado ? t.success : t.textDim}`,
              }}
            >
              {item.comprado && <Check size={10} color="#fff" />}
            </button>
            <input
              type="text"
              value={item.texto}
              onChange={e => handleChange(item.id, 'texto', e.target.value)}
              placeholder="Nombre del producto..."
              className="flex-1 bg-transparent border-0 text-[11px] outline-none"
              style={{
                color: item.comprado ? t.textDim : t.text,
                textDecoration: item.comprado ? 'line-through' : 'none',
              }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={e => handleChange(item.id, 'cantidad', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 rounded-md px-1.5 py-1 text-[10px] font-semibold text-center outline-none"
                style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
              />
              <span className="text-[9px] font-medium" style={{ color: t.textDim }}>x</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={item.precio}
                onChange={e => handleChange(item.id, 'precio', parseFloat(e.target.value) || 0)}
                className="w-16 rounded-md px-1.5 py-1 text-[10px] font-semibold text-right outline-none"
                style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, color: t.text }}
              />
              <span className="text-[8px] font-medium" style={{ color: t.textDim }}>Bs</span>
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="p-1 rounded-md transition-all shrink-0"
              style={{ color: t.textDim }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.danger}15`; e.currentTarget.style.color = t.danger; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textDim; }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer: Add + Total */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t shrink-0" style={{ borderColor: t.border }}>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-semibold transition-all"
          style={{ backgroundColor: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}30` }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${t.accent}25`; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${t.accent}15`; }}
        >
          <Plus size={12} /> Agregar Item
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium" style={{ color: t.textDim }}>
            {parsedItems.filter(i => i.comprado).length}/{parsedItems.length} items
          </span>
          <span className="text-[12px] font-bold" style={{ color: t.accent }}>
            Total: {total.toLocaleString()} Bs
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotaListaCompras;
