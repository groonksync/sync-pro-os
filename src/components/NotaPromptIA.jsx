import React, { useMemo } from 'react';
import { Copy, Sparkles, Zap } from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

/**
 * Editor especializado para Prompt IA.
 * Muestra el prompt con sintaxis resaltada y un botón para copiar.
 */
const NotaPromptIA = ({ contenido = '', onChange, isDark }) => {
  const t = useTheme(isDark);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(contenido);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor de Prompt */}
      <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden"
        style={{ border: `1px solid ${t.border}`, backgroundColor: t.surface }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2"
          style={{ backgroundColor: `${t.accent}08`, borderBottom: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} style={{ color: t.accent }} />
            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: t.accent }}>
              Prompt de IA
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-semibold transition-all"
            style={{
              backgroundColor: copied ? `${t.success}15` : `${t.accent}10`,
              color: copied ? t.success : t.accent,
            }}
          >
            <Copy size={10} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Editor */}
        <textarea
          value={contenido}
          onChange={e => onChange(e.target.value)}
          placeholder="Escribe tu prompt aquí...&#10;&#10;Ejemplo:&#10;Actúa como un experto en marketing digital. Necesito una estrategia para..."
          className="flex-1 w-full p-4 bg-transparent border-0 outline-none resize-none text-[11px] leading-relaxed font-mono"
          style={{ color: t.text }}
        />

        {/* Footer: stats */}
        <div className="flex items-center gap-3 px-3 py-2 text-[8px] font-medium"
          style={{ borderTop: `1px solid ${t.border}`, color: t.textDim }}>
          <span>{contenido.length} caracteres</span>
          <span>{contenido.split(/\s+/).filter(Boolean).length} palabras</span>
          {contenido.length > 0 && (
            <span style={{ color: t.accent }}>
              <Zap size={8} style={{ display: 'inline' }} /> Listo para usar
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotaPromptIA;
