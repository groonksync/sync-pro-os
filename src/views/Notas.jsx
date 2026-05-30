import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTheme } from '../lib/theme';
import { aiService } from '../services/aiService';

// === ICONOS SVG INLINE AUTO-CONTENIDOS ===
const Icons = {
  Plus: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Folder: () => (
    <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  FileText: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"></path>
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  Pause: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
  ),
  Refresh: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
    </svg>
  ),
  Copy: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Check: () => (
    <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Layout: () => (
    <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
  Table: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4h6V3zM3 11h6v4H3v-4zM3 17v2a2 2 0 0 0 2 2h4v-6H3zM15 21h4a2 2 0 0 0 2-2v-2h-6v6zM21 15h-6v-4h6v4zM21 9V5a2 2 0 0 0-2-2h-4v6h6zM9 11h6v4H9v-4z"></path>
    </svg>
  ),
  ListTodo: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <path d="m9 11 2 2 4-4"></path>
    </svg>
  ),
  Image: () => (
    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  Text: () => (
    <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"></polyline>
      <line x1="9" y1="20" x2="15" y2="20"></line>
      <line x1="12" y1="4" x2="12" y2="20"></line>
    </svg>
  ),
  Header1: () => (
    <span className="text-[10px] font-bold font-mono text-zinc-400">H1</span>
  ),
  Header2: () => (
    <span className="text-[10px] font-bold font-mono text-zinc-400">H2</span>
  ),
  Info: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  Eye: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
    </svg>
  ),
  Star: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  X: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  StarFilled: () => (
    <svg className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  Search: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Sidebar: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="3" x2="9" y2="21"></line>
    </svg>
  )
};

const Notas = ({ settings, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);

  // --- Estados de Datos ---
  const [notas, setNotas] = useState([]);
  const [folders, setFolders] = useState([]);
  
  // --- Estados de Navegación y Control ---
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState('preview'); // write, preview (default preview!)
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // --- Modales y Formularios Inline ---
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  
  // --- Sincronización e Indicador de Guardado ---
  const [syncStatus, setSyncStatus] = useState('Guardado');
  const saveTimeoutRef = useRef(null);

  // --- Estados de la Tabla y Ref del Editor ---
  const [showTableModal, setShowTableModal] = useState(false);
  const [gridHover, setGridHover] = useState({ r: 2, c: 2 });
  const textareaRef = useRef(null);

  // --- Estados Extra-Premium (Documento y Copilot) ---
  const [docTheme, setDocTheme] = useState('modern'); // modern, elegant, technical
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotModel, setCopilotModel] = useState('gemini'); // gemini, deepseek, openrouter
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotHistory, setCopilotHistory] = useState([]);

  // --- Helpers de Fecha ---
  const formatFullDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // --- Referencia a la Nota Activa ---
  const activeNote = useMemo(() => {
    return notas.find(n => n.id === activeNoteId) || null;
  }, [notas, activeNoteId]);

  // --- Módulos de Cálculo de Documento (Tipo Word) ---
  const wordCount = useMemo(() => {
    if (!activeNote?.contenido) return 0;
    return activeNote.contenido.trim().split(/\s+/).filter(Boolean).length;
  }, [activeNote?.contenido]);

  const charCount = useMemo(() => {
    if (!activeNote?.contenido) return 0;
    return activeNote.contenido.length;
  }, [activeNote?.contenido]);

  const readingTime = useMemo(() => {
    const words = wordCount;
    const min = Math.ceil(words / 200); // 200 palabras por minuto promedio
    return min || 1;
  }, [wordCount]);

  // --- Plantillas de Documentos Estándar ---
  const TEMPLATES = {
    minuta: `# Minuta de Reunión\n\n**Fecha:** ${new Date().toLocaleDateString()}\n**Asistentes:** \n- \n\n## Objetivos\n1. \n\n## Notas Generales\n- \n\n## Acuerdos y Tareas\n- [ ] Asignar responsable para... \n- [ ] Programar llamada de seguimiento`,
    lean_canvas: `# Lean Canvas Modelo de Negocio\n\n### 1. Problema (Dolor del Cliente)\n- \n\n### 2. Segmentos de Clientes\n- \n\n### 3. Propuesta de Valor Única\n- \n\n### 4. Solución\n- \n\n### 5. Canales\n- \n\n### 6. Flujos de Ingresos\n- \n\n### 7. Estructura de Costos\n- \n\n### 8. Métricas Clave\n- \n\n### 9. Ventaja Especial\n- `,
    ficha: `# Ficha Técnica Corporativa\n\n**Producto:** [Nombre del Producto]\n**Categoría:** [Categoría]\n\n## Especificaciones Técnicas\n- **Dimensiones:** \n- **Peso:** \n- **Materiales:** \n\n## Detalles de Entrega y Garantía\n- **Envío:** \n- **Garantía:** `
  };

  // --- Carga Inicial desde LocalStorage ---
  useEffect(() => {
    const savedNotas = localStorage.getItem('syncpro_notas');
    const savedFolders = localStorage.getItem('syncpro_folders');

    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      const defaultFolders = [
        { id: 'folder-personal', nombre: 'Personal' },
        { id: 'folder-guiones', nombre: 'Guiones de Video' },
        { id: 'folder-prompts', nombre: 'Biblioteca de Prompts' },
        { id: 'folder-canvas', nombre: 'Modelos Canvas' }
      ];
      setFolders(defaultFolders);
      localStorage.setItem('syncpro_folders', JSON.stringify(defaultFolders));
    }

    if (savedNotas) {
      const parsedNotas = JSON.parse(savedNotas);
      setNotas(parsedNotas);
      if (parsedNotas.length > 0) {
        setActiveNoteId(parsedNotas[0].id);
      }
    } else {
      const defaultNotas = [
        {
          id: 'note-1',
          titulo: 'Bienvenida a Inefable Notes',
          contenido: '# Bienvenido a tu Workspace Premium\nEsta es tu herramienta avanzada.\n## Estilos de encabezado\nEscribe directamente usando el editor de bloques Notion-style.',
          folderId: 'folder-personal',
          tipo: 'normal',
          updated_at: new Date().toISOString()
        }
      ];
      setNotas(defaultNotas);
      if (defaultNotas.length > 0) {
        setActiveNoteId(defaultNotas[0].id);
      }
      localStorage.setItem('syncpro_notas', JSON.stringify(defaultNotas));
    }
  }, []);

  // --- Sincronización con Debounce (800ms) ---
  const saveToStorage = (updatedNotas, updatedFolders) => {
    setSyncStatus('Guardando...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (updatedNotas) localStorage.setItem('syncpro_notas', JSON.stringify(updatedNotas));
      if (updatedFolders) localStorage.setItem('syncpro_folders', JSON.stringify(updatedFolders));
      setSyncStatus('Guardado');
    }, 800);
  };

  // --- Acciones de Nota ---
  const handleCreateNote = (tipo = 'normal') => {
    const newNote = {
      id: 'note-' + Date.now(),
      titulo: tipo === 'normal' ? 'Nueva Nota' : tipo === 'guion' ? 'Nuevo Teleprompter' : tipo === 'prompt' ? 'Nuevo Prompt' : 'Nuevo Lean Canvas',
      contenido: tipo === 'normal' ? '# Título de la nota\nEscribe tu contenido aquí...' : '',
      folderId: activeFolderId === 'all' ? (folders[0]?.id || 'all') : activeFolderId,
      tipo: tipo,
      variables: {},
      leanCanvas: { dolorCliente: '', solucion: '', metricasClave: '' },
      updated_at: new Date().toISOString()
    };
    const updated = [newNote, ...notas];
    setNotas(updated);
    setActiveNoteId(newNote.id);
    setEditMode('write');
    saveToStorage(updated, null);
  };

  const handleUpdateNote = (fields) => {
    if (!activeNoteId) return;
    const updated = notas.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, ...fields, updated_at: new Date().toISOString() };
      }
      return n;
    });
    setNotas(updated);
    saveToStorage(updated, null);
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    const targetNote = notas.find(n => n.id === activeNoteId);
    const updated = notas.filter(n => n.id !== activeNoteId);
    setNotas(updated);
    if (targetNote) {
      try {
        const localTrash = JSON.parse(localStorage.getItem('inefable_local_trash') || '[]');
        localTrash.push({
          id: `trash-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          tipo_dato: 'nota',
          nombre_item: targetNote.titulo || targetNote.title || 'Nota',
          datos_originales: targetNote,
          borrado_el: new Date().toISOString(),
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        localStorage.setItem('inefable_local_trash', JSON.stringify(localTrash));
      } catch (e) {}
    }
    if (updated.length > 0) {
      setActiveNoteId(updated[0].id);
    } else {
      setActiveNoteId(null);
    }
    saveToStorage(updated, null);
  };

  // --- Acciones de Carpeta ---
  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: 'folder-' + Date.now(),
      nombre: newFolderName.trim()
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    setNewFolderName('');
    setShowFolderForm(false);
    setActiveFolderId(newFolder.id);
    saveToStorage(null, updated);
  };

  // --- Filtrado de Notas ---
  const filteredNotas = useMemo(() => {
    return notas.filter(note => {
      const matchFolder = activeFolderId === 'all' ? true : note.folderId === activeFolderId;
      const matchQuery = searchQuery.trim() === '' ? true : 
        note.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.contenido.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchQuery;
    });
  }, [notas, activeFolderId, searchQuery]);

  // --- Conteo por Carpeta ---
  const getNoteCount = (folderId) => {
    if (folderId === 'all') return notas.length;
    return notas.filter(n => n.folderId === folderId).length;
  };

  // --- PARSER E HÍBRIDO INTERACTIVO DE BLOQUES (Notion Style) ---
  const parseMarkdownToBlocks = (markdownText) => {
    if (!markdownText) return [{ id: 'b-init', tipo: 'texto', contenido: '' }];
    const lines = markdownText.split('\n');
    const parsedBlocks = [];
    let currentTextBlock = [];
    let currentTableLines = [];
    let currentChecklistItems = [];

    const flushTextBlock = () => {
      if (currentTextBlock.length > 0) {
        currentTextBlock.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            parsedBlocks.push({
              id: 'blk-h1-' + Math.random().toString(36).substr(2, 9),
              tipo: 'h1',
              contenido: trimmed.replace('# ', '')
            });
          } else if (trimmed.startsWith('## ')) {
            parsedBlocks.push({
              id: 'blk-h2-' + Math.random().toString(36).substr(2, 9),
              tipo: 'h2',
              contenido: trimmed.replace('## ', '')
            });
          } else if (trimmed.startsWith('![') && trimmed.includes('](') && trimmed.endsWith(')')) {
            const altMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
            parsedBlocks.push({
              id: 'blk-img-' + Math.random().toString(36).substr(2, 9),
              tipo: 'imagen',
              url: altMatch ? altMatch[2] : '',
              caption: altMatch ? altMatch[1] : 'Imagen'
            });
          } else {
            const lastBlock = parsedBlocks[parsedBlocks.length - 1];
            if (lastBlock && lastBlock.tipo === 'texto') {
              lastBlock.contenido += '\n' + line;
            } else {
              parsedBlocks.push({
                id: 'blk-text-' + Math.random().toString(36).substr(2, 9),
                tipo: 'texto',
                contenido: line
              });
            }
          }
        });
        currentTextBlock = [];
      }
    };

    const flushTableBlock = () => {
      if (currentTableLines.length > 0) {
        const headerLine = currentTableLines[0];
        const dataLines = currentTableLines.slice(2);

        const parseRow = (line) => {
          return line.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        };

        const columnas = parseRow(headerLine);
        const filas = dataLines.map((line, rIdx) => ({
          id: 'row-' + rIdx + '-' + Math.random().toString(36).substr(2, 5),
          celdas: parseRow(line)
        }));

        parsedBlocks.push({
          id: 'blk-table-' + Math.random().toString(36).substr(2, 9),
          tipo: 'tabla',
          columnas: columnas.length > 0 ? columnas : ['Columna 1', 'Columna 2'],
          filas: filas.length > 0 ? filas : [{ id: 'r1', celdas: ['', ''] }]
        });
        currentTableLines = [];
      }
    };

    const flushChecklistBlock = () => {
      if (currentChecklistItems.length > 0) {
        parsedBlocks.push({
          id: 'blk-check-' + Math.random().toString(36).substr(2, 9),
          tipo: 'checklist',
          items: [...currentChecklistItems]
        });
        currentChecklistItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = line.trim().startsWith('|');
      const isChecklistLine = line.match(/^\s*[-*]\s+\[([ xX/])\]\s*(.*)$/);

      if (isTableLine) {
        flushTextBlock();
        flushChecklistBlock();
        currentTableLines.push(line);
      } else if (isChecklistLine) {
        flushTextBlock();
        flushTableBlock();
        const statusChar = isChecklistLine[1];
        const text = isChecklistLine[2];
        let status = 'pendiente';
        if (statusChar === '/') status = 'proceso';
        else if (statusChar.toLowerCase() === 'x') status = 'completado';
        currentChecklistItems.push({
          id: 'item-' + i + '-' + Math.random().toString(36).substr(2, 5),
          text,
          status
        });
      } else {
        if (currentTableLines.length > 0) flushTableBlock();
        if (currentChecklistItems.length > 0) flushChecklistBlock();
        currentTextBlock.push(line);
      }
    }

    flushTextBlock();
    flushTableBlock();
    flushChecklistBlock();

    return parsedBlocks;
  };

  const serializeBlocksToMarkdown = (blocksList) => {
    return blocksList.map(block => {
      if (block.tipo === 'h1') return `# ${block.contenido}`;
      if (block.tipo === 'h2') return `## ${block.contenido}`;
      if (block.tipo === 'texto') return block.contenido;
      if (block.tipo === 'imagen') return `![${block.caption || 'Imagen'}](${block.url})`;
      if (block.tipo === 'checklist') {
        return block.items.map(item => {
          let char = ' ';
          if (item.status === 'proceso') char = '/';
          else if (item.status === 'completado') char = 'x';
          return `- [${char}] ${item.text}`;
        }).join('\n');
      }
      if (block.tipo === 'tabla') {
        const header = '| ' + block.columnas.join(' | ') + ' |';
        const separator = '| ' + block.columnas.map(() => '---------').join(' | ') + ' |';
        const rows = block.filas.map(row => '| ' + row.celdas.join(' | ') + ' |').join('\n');
        return [header, separator, rows].filter(Boolean).join('\n');
      }
      return '';
    }).join('\n');
  };

  const handleUpdateBlock = (blockIdOrIndex, updatedFields) => {
    if (!activeNote) return;
    const currentBlocks = parseMarkdownToBlocks(activeNote.contenido);
    const updatedBlocks = currentBlocks.map((b, idx) => {
      if (b.id === blockIdOrIndex || idx === blockIdOrIndex) {
        return { ...b, ...updatedFields };
      }
      return b;
    });
    const newMarkdown = serializeBlocksToMarkdown(updatedBlocks);
    handleUpdateNoteField(activeNote.id, 'contenido', newMarkdown);
  };

  const handleUpdateNoteField = (noteId, field, value) => {
    const updated = notas.map(n => {
      if (n.id === noteId) {
        return { ...n, [field]: value, updated_at: new Date().toISOString() };
      }
      return n;
    });
    setNotas(updated);
    saveToStorage(updated, null);
  };

  const handleAddBlock = (tipo) => {
    if (!activeNote) return;
    const currentBlocks = parseMarkdownToBlocks(activeNote.contenido);
    let newBlock = null;

    if (tipo === 'h1') newBlock = { id: 'blk-h1-' + Date.now(), tipo: 'h1', contenido: 'Nuevo Título' };
    else if (tipo === 'h2') newBlock = { id: 'blk-h2-' + Date.now(), tipo: 'h2', contenido: 'Nuevo Subtítulo' };
    else if (tipo === 'texto') newBlock = { id: 'blk-text-' + Date.now(), tipo: 'texto', contenido: 'Texto descriptivo...' };
    else if (tipo === 'checklist') newBlock = { id: 'blk-check-' + Date.now(), tipo: 'checklist', items: [{ id: 'item-' + Date.now(), text: 'Nueva tarea', status: 'pendiente' }] };
    else if (tipo === 'tabla') newBlock = { id: 'blk-table-' + Date.now(), tipo: 'tabla', columnas: ['Columna 1', 'Columna 2'], filas: [{ id: 'row-1', celdas: ['Celda 1', 'Celda 2'] }] };
    else if (tipo === 'imagen') newBlock = { id: 'blk-img-' + Date.now(), tipo: 'imagen', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500', caption: 'Nueva Imagen' };

    if (newBlock) {
      const newMarkdown = serializeBlocksToMarkdown([...currentBlocks, newBlock]);
      handleUpdateNoteField(activeNote.id, 'contenido', newMarkdown);
    }
  };

  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const replacement = syntaxBefore + selectedText + syntaxAfter;
    const newContent = before + replacement + after;

    handleUpdateNoteField(activeNote.id, 'contenido', newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + selectedText.length);
    }, 0);
  };

  const applyHeader = (headerPrefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    
    const beforeCursor = text.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStartIdx = lastNewline === -1 ? 0 : lastNewline + 1;
    
    const afterCursor = text.substring(start);
    const nextNewline = afterCursor.indexOf('\n');
    const lineEndIdx = nextNewline === -1 ? text.length : start + nextNewline;
    
    const currentLine = text.substring(lineStartIdx, lineEndIdx);
    
    const cleanLine = currentLine.replace(/^(\s*#+\s+|\s*-\s+\[[ xX/]\]\s*|\s*-\s+|\s*\*\s+)/, '');
    const newLine = headerPrefix + cleanLine;
    
    const beforeLine = text.substring(0, lineStartIdx);
    const afterLine = text.substring(lineEndIdx);
    
    const newContent = beforeLine + newLine + afterLine;
    handleUpdateNoteField(activeNote.id, 'contenido', newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = lineStartIdx + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertTable = (rows, cols) => {
    const headers = [];
    const separators = [];
    for (let c = 1; c <= cols; c++) {
      headers.push(`Columna ${c}`);
      separators.push('---------');
    }
    const headerLine = '| ' + headers.join(' | ') + ' |';
    const sepLine = '| ' + separators.join(' | ') + ' |';
    
    const dataLines = [];
    for (let r = 1; r <= rows; r++) {
      const rowCells = Array(cols).fill(' ');
      dataLines.push('| ' + rowCells.join(' | ') + ' |');
    }
    
    const tableMarkdown = '\n' + [headerLine, sepLine, ...dataLines].join('\n') + '\n';
    
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newContent = before + tableMarkdown + after;
      handleUpdateNoteField(activeNote.id, 'contenido', newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tableMarkdown.length, start + tableMarkdown.length);
      }, 0);
    } else {
      handleUpdateNoteField(activeNote.id, 'contenido', (activeNote.contenido || '') + tableMarkdown);
    }
    setShowTableModal(false);
  };

  const executeCopilotAction = async (instruction, isCustom = false) => {
    if (!activeNote) return;
    setCopilotLoading(true);
    
    // Build standard prompt with note content
    const systemPrompt = `Actúa como un asistente editorial inteligente de élite y experto en estructurar documentos corporativos.
Tu único objetivo es responder a las peticiones de edición o análisis de notas del usuario.
Devuelve únicamente el texto final optimizado, estructurado o corregido sin comentarios aclaratorios adicionales.`;

    const userPrompt = `
DOCUMENTO ORIGINAL:
"""
${activeNote.contenido}
"""

INSTRUCCIÓN: ${instruction}
`;

    // Query active AI provider
    try {
      const response = await aiService.askRaw(systemPrompt, userPrompt, {
        aiProvider: copilotModel,
        geminiKey: settings.geminiKey,
        deepseekKey: settings.deepseekKey,
        openrouterKey: settings.openrouterKey,
        deepseekModel: settings.deepseekModel,
        openrouterModel: settings.openrouterModel
      });

      if (response && !response.startsWith('❌') && !response.startsWith('⚠️')) {
        const cleanedResponse = response.trim();
        // Insert into copilot history
        setCopilotHistory(prev => [
          ...prev,
          { role: 'user', content: isCustom ? instruction : `Acción: ${instruction}` },
          { role: 'assistant', content: cleanedResponse }
        ]);
        if (isCustom) setCopilotQuery('');
      } else {
        alert("Error de IA: " + response);
      }
    } catch (e) {
      alert("Error al procesar con la IA: " + e.message);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex h-full w-full select-none overflow-hidden transition-all duration-300"
      style={{ backgroundColor: t.bg, color: t.text }}>
      
      {/* ===== PANEL 1 — Sidebar (Proyectos) ===== */}
      {sidebarVisible && (
        <div className="w-64 shrink-0 border-r flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: t.border, backgroundColor: t.bg }}>
          
          <div className="h-[52px] px-4 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: t.border }}>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: t.textDim }}>Proyectos</span>
            <button
              onClick={() => setShowFolderForm(!showFolderForm)}
              className="p-1 rounded hover:bg-white/[0.04] transition-all"
              style={{ color: t.textDim }}
            >
              <Icons.Plus />
            </button>
          </div>

          {showFolderForm && (
            <form onSubmit={handleCreateFolder} className="p-3 border-b space-y-2 shrink-0 animate-in fade-in duration-200"
              style={{ borderColor: t.border, backgroundColor: t.surface }}>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full border outline-none text-xs rounded px-2.5 py-1.5 focus:border-zinc-500"
                style={{ backgroundColor: t.bg, borderColor: t.border, color: t.text }}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFolderForm(false)}
                  className="px-2.5 py-1 text-[10px] font-semibold uppercase rounded hover:bg-white/5"
                  style={{ color: t.textDim }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[10px] font-semibold uppercase rounded text-black"
                  style={{ backgroundColor: t.accent }}
                >
                  Crear
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            <button
              onClick={() => setActiveFolderId('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left text-xs ${activeFolderId === 'all' ? 'bg-white/[0.04] border border-white/[0.08] font-medium' : 'border border-transparent hover:bg-white/[0.02]'}`}
              style={{ color: activeFolderId === 'all' ? t.accent : t.textDim }}
            >
              <div className="flex items-center gap-2.5">
                <Icons.Folder />
                <span>Todos los Proyectos</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded" style={{ backgroundColor: t.surface, color: t.textMuted }}>{getNoteCount('all')}</span>
            </button>

            {folders.map(folder => {
              const isActive = activeFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left text-xs ${isActive ? 'bg-white/[0.04] border border-white/[0.08] font-medium' : 'border border-transparent hover:bg-white/[0.02]'}`}
                  style={{ color: isActive ? t.accent : t.textDim }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icons.Folder />
                    <span>{folder.nombre}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded" style={{ backgroundColor: t.surface, color: t.textMuted }}>{getNoteCount(folder.id)}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t shrink-0" style={{ borderColor: t.border }}>
            <input
              type="text"
              placeholder="Buscar apuntes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border outline-none text-xs rounded px-2.5 py-1.5 focus:border-zinc-500"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}
            />
          </div>
        </div>
      )}

      {/* ===== PANEL 2 — List (Apuntes) ===== */}
      {sidebarVisible && (
        <div className="w-64 shrink-0 border-r flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: t.border, backgroundColor: t.bg }}>
          
          <div className="h-[52px] px-4 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: t.border }}>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: t.textDim }}>Apuntes</span>
            <div className="relative">
              <button
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="p-1 rounded hover:bg-white/[0.04] transition-all"
                style={{ color: t.accent }}
              >
                <Icons.Plus />
              </button>
              {showTypeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-lg overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
                    {[
                      { tipo: 'normal', icon: Icons.FileText, label: 'Nota Estándar', color: '#4ec9b0' },
                      { tipo: 'guion', icon: Icons.Play, label: 'Teleprompter', color: '#a855f7' },
                      { tipo: 'prompt', icon: Icons.Sparkles, label: 'Prompt Playground', color: '#3b82f6' }
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.tipo}
                          onClick={() => { handleCreateNote(item.tipo); setShowTypeMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-all text-left"
                          style={{ color: t.text, borderBottom: i < 2 ? `1px solid ${t.border}` : 'none', background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Icon /> {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {filteredNotas.map(note => {
              const isActive = activeNoteId === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); setEditMode('preview'); }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${isActive ? 'bg-white/[0.04] border-white/[0.08]' : 'border-transparent hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${note.tipo === 'guion' ? 'text-purple-400' : note.tipo === 'prompt' ? 'text-blue-400' : note.tipo === 'canvas' ? 'text-orange-400' : 'text-zinc-500'}`}>
                      {note.tipo === 'guion' ? 'Teleprompter' : note.tipo === 'prompt' ? 'Prompt' : note.tipo === 'canvas' ? 'Lean Canvas' : 'Nota'}
                    </span>
                    <span className="text-[8px]" style={{ color: t.textMuted }}>{new Date(note.updated_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-semibold mb-1 truncate" style={{ color: t.text }}>{note.titulo}</h4>
                  <p className="text-[10px] truncate" style={{ color: t.textDim }}>
                    {note.tipo === 'canvas' ? 'Lean Business Model Canvas' : (note.contenido || 'Sin contenido')}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t shrink-0 flex items-center justify-between text-[10px]"
            style={{ borderColor: t.border, color: t.textDim }}>
            <span>Sync Status</span>
            <span className={`font-semibold flex items-center gap-1.5 ${syncStatus === 'Guardado' ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>
              {syncStatus === 'Guardado' && <Icons.Check />}
              {syncStatus}
            </span>
          </div>
        </div>
      )}

      {/* ===== PANEL 3 — Sovereign Canvas (Editor) ===== */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden editor-workspace-clean" style={{ backgroundColor: t.bg }}>
        
        {activeNote ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <style>{`
              /* Specificity overrides for global input styles inside the clean editor workspace */
              .editor-workspace-clean input[type="text"].note-title-input {
                background-color: transparent !important;
                border: none !important;
                border-radius: 0px !important;
                padding: 4px 0px !important;
                box-shadow: none !important;
                outline: none !important;
              }
              .editor-workspace-clean input[type="text"].note-title-input:focus {
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
              }
              
              /* Premium markdown preview overrides */
              .markdown-preview h1 {
                font-size: 2.25rem !important; /* ~36px */
                font-weight: 800 !important;
                margin-top: 1.75rem !important;
                margin-bottom: 0.85rem !important;
                color: ${t.text} !important;
                border-bottom: 1px solid ${t.border} !important;
                padding-bottom: 0.4rem !important;
              }
              .markdown-preview h2 {
                font-size: 1.5rem !important; /* ~24px */
                font-weight: 700 !important;
                margin-top: 1.5rem !important;
                margin-bottom: 0.6rem !important;
                color: ${t.text} !important;
              }
              .markdown-preview h3 {
                font-size: 1.2rem !important; /* ~19px */
                font-weight: 600 !important;
                margin-top: 1.25rem !important;
                margin-bottom: 0.5rem !important;
                color: ${t.textDim} !important;
              }
              .markdown-preview p {
                font-size: 0.875rem !important; /* 14px text base */
                line-height: 1.7 !important;
                margin-bottom: 1rem !important;
                color: ${t.textDim} !important;
              }
              .markdown-preview ul, .markdown-preview ol {
                margin: 1rem 0 !important;
                padding-left: 1.5rem !important;
                color: ${t.textDim} !important;
              }
              .markdown-preview li {
                margin-bottom: 0.35rem !important;
                font-size: 0.875rem !important;
                line-height: 1.6 !important;
              }
              
              /* Ensure checkboxes render nicely in preview */
              .markdown-preview input[type="checkbox"] {
                margin-right: 0.5rem !important;
                accent-color: #4ec9b0 !important;
                cursor: pointer !important;
              }

              /* Elegant obsidian premium tables */
              .markdown-preview table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 1.5rem 0 !important;
                font-size: 0.85rem !important;
              }
              .markdown-preview th {
                font-weight: 700 !important;
                background-color: rgba(255,255,255,0.02) !important;
                padding: 10px 14px !important;
                border: 1px solid ${t.border} !important;
                color: ${t.text} !important;
                text-align: left !important;
              }
              .markdown-preview td {
                padding: 10px 14px !important;
                border: 1px solid ${t.border} !important;
                color: ${t.textDim} !important;
              }
            `}</style>
            
            {/* Header / Canvas Top details (replaces old gray bar) */}
            <div className="h-[52px] px-6 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: t.border, backgroundColor: t.bg }}>
              
              <div className="text-[9px] uppercase tracking-wider opacity-60" style={{ color: t.textDim }}>
                Modificado el {formatFullDate(activeNote.updated_at)}
              </div>

              <div className="flex items-center gap-3">
                {activeNote.tipo === 'normal' && (
                  <>
                    {/* Document Theme Switcher */}
                    <select
                      value={docTheme}
                      onChange={e => setDocTheme(e.target.value)}
                      className="bg-transparent border-0 outline-none text-[9px] font-bold text-zinc-400 cursor-pointer hover:text-white"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <option value="modern" style={{ backgroundColor: t.panel, color: '#fff' }}>Tema: Moderno</option>
                      <option value="elegant" style={{ backgroundColor: t.panel, color: '#fff' }}>Tema: Elegante</option>
                      <option value="technical" style={{ backgroundColor: t.panel, color: '#fff' }}>Tema: Técnico</option>
                    </select>

                    {/* Template Quick Insert */}
                    {editMode === 'write' && (
                      <select
                        value=""
                        onChange={e => {
                          if (!e.target.value) return;
                          const confirmInsert = window.confirm("¿Seguro que deseas insertar esta plantilla? Esto agregará la estructura al final del documento.");
                          if (confirmInsert) {
                            handleUpdateNoteField(activeNote.id, 'contenido', (activeNote.contenido || '') + '\n' + TEMPLATES[e.target.value]);
                          }
                          e.target.value = "";
                        }}
                        className="bg-transparent border-0 outline-none text-[9px] font-bold text-zinc-400 cursor-pointer hover:text-white"
                        style={{ border: 'none', background: 'transparent' }}
                      >
                        <option value="" disabled style={{ backgroundColor: t.panel, color: '#fff' }}>+ Plantilla</option>
                        <option value="minuta" style={{ backgroundColor: t.panel, color: '#fff' }}>Minuta de Reunión</option>
                        <option value="lean_canvas" style={{ backgroundColor: t.panel, color: '#fff' }}>Lean Canvas</option>
                        <option value="ficha" style={{ backgroundColor: t.panel, color: '#fff' }}>Ficha Técnica</option>
                      </select>
                    )}

                    {/* Asistente IA Toggle */}
                    <button
                      onClick={() => setShowCopilot(!showCopilot)}
                      className="px-2 py-1 rounded border transition-all text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ 
                        borderColor: showCopilot ? '#a855f7' : t.border, 
                        color: showCopilot ? '#a855f7' : t.textDim,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Icons.Sparkles />
                      <span>Copilot IA</span>
                    </button>

                    {/* Editar/Listo Button */}
                    <button
                      onClick={() => setEditMode(editMode === 'write' ? 'preview' : 'write')}
                      className="px-3 py-1 rounded border transition-all text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ 
                        borderColor: editMode === 'write' ? '#10b981' : t.border, 
                        color: editMode === 'write' ? '#10b981' : t.text,
                        backgroundColor: editMode === 'write' ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                      }}
                    >
                      {editMode === 'write' ? <Icons.Check /> : <Icons.Edit />}
                      <span>{editMode === 'write' ? 'Listo' : 'Editar'}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleDeleteNote}
                  className="p-1 rounded text-red-500 hover:text-red-400 hover:bg-white/5 transition-all"
                  title="Eliminar Nota"
                >
                  <Icons.Trash />
                </button>
              </div>

            </div>

            {/* main screen layout split */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              
              {/* Left Action Dock */}
              <div className="w-[44px] shrink-0 border-r flex flex-col items-center py-4 gap-4"
                style={{ borderColor: t.border, backgroundColor: t.bg }}>
                
                {/* Collapsing sidebar */}
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                  style={{ color: sidebarVisible ? t.accent : t.textDim }}
                  title="Colapsar Paneles"
                >
                  <Icons.Sidebar />
                </button>

                <div className="w-6 h-[1px]" style={{ backgroundColor: t.border }} />

                {/* Switcher tool icon selects */}
                {[
                  { id: 'normal', icon: Icons.FileText, label: 'Nota Estándar' },
                  { id: 'guion', icon: Icons.Play, label: 'Teleprompter' },
                  { id: 'prompt', icon: Icons.Sparkles, label: 'Prompt Playground' }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleUpdateNote({ tipo: tool.id })}
                    className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                    style={{ color: activeNote.tipo === tool.id ? t.accent : t.textDim }}
                    title={tool.label}
                  >
                    <tool.icon />
                  </button>
                ))}

                {/* Add elements specifically for normal/standard notes */}
                {activeNote.tipo === 'normal' && editMode === 'write' && (
                  <>
                    <div className="w-6 h-[1px]" style={{ backgroundColor: t.border }} />
                    <button
                      onClick={() => applyHeader('# ')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Añadir H1"
                    >
                      <Icons.Header1 />
                    </button>
                    <button
                      onClick={() => applyHeader('## ')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Añadir H2"
                    >
                      <Icons.Header2 />
                    </button>
                    <button
                      onClick={() => applyHeader('')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Texto Normal"
                    >
                      <Icons.Text />
                    </button>
                    <button
                      onClick={() => { setGridHover({ r: 2, c: 2 }); setShowTableModal(true); }}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Añadir Tabla"
                    >
                      <Icons.Table />
                    </button>
                    <button
                      onClick={() => applyHeader('- [ ] ')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Añadir Checklist"
                    >
                      <Icons.ListTodo />
                    </button>
                    <button
                      onClick={() => insertMarkdown('![Descripción](', ')')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      title="Añadir Imagen URL"
                    >
                      <Icons.Image />
                    </button>
                  </>
                )}

              </div>

              {/* Working space editor views */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ backgroundColor: t.bg }}>
                
                {activeNote.tipo === 'normal' ? (
                  <div className="w-full px-8 py-8 flex-1 flex justify-center">
                    
                    {/* The Page Sheet Container */}
                    <div 
                      className="w-full max-w-[850px] min-h-[85vh] p-12 rounded-2xl border flex flex-col shadow-xl transition-all duration-300"
                      style={{ 
                        backgroundColor: t.surface || '#1c1c1c', 
                        borderColor: t.border,
                        fontFamily: docTheme === 'elegant' ? 'Georgia, Cambria, "Times New Roman", Times, serif' : docTheme === 'technical' ? '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      {/* Clean title on canvas inside the page sheet */}
                      <input
                        type="text"
                        value={activeNote.titulo}
                        onChange={e => handleUpdateNote({ titulo: e.target.value })}
                        placeholder="Título de la nota..."
                        disabled={editMode !== 'write'}
                        className="w-full bg-transparent border-0 text-3xl font-extrabold outline-none px-0 py-0 mb-6 note-title-input"
                        style={{
                          color: t.text,
                          letterSpacing: '-0.03em',
                          fontWeight: 800,
                          borderBottom: `1px solid ${t.borderLight || 'rgba(255,255,255,0.05)'}`,
                          paddingBottom: '12px'
                        }}
                      />

                      <div className="flex-1 flex flex-col min-h-0 note-editor-canvas">
                        {editMode === 'write' ? (
                          <div className="flex-1 flex flex-col min-h-0 relative">
                            <textarea
                              ref={textareaRef}
                              value={activeNote.contenido}
                              onChange={e => handleUpdateNoteField(activeNote.id, 'contenido', e.target.value)}
                              placeholder="Escribe tu nota aquí usando Markdown... Puedes usar la barra lateral de herramientas para formatear encabezados, tablas y listas."
                              className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-sans text-xs leading-relaxed p-0 overflow-y-auto"
                              style={{ 
                                color: t.textDim, 
                                height: '100%',
                                minHeight: '400px',
                                lineHeight: '1.7',
                                caretColor: t.accent,
                                fontSize: '13px'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none markdown-preview" style={{ color: t.text, lineHeight: '1.7', fontSize: '13px' }}>
                            {activeNote.contenido ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.contenido}</ReactMarkdown>
                            ) : (
                              <p style={{ color: t.textDim, fontSize: '11px', fontStyle: 'italic' }}>Sin contenido para mostrar. Pulsa "Editar" arriba para empezar a escribir.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Word Count & Reading Time Footer inside the page sheet */}
                      <div className="flex justify-between items-center mt-8 pt-4 border-t text-[10px] uppercase tracking-wider font-bold" 
                        style={{ borderColor: t.border, color: t.textMuted }}>
                        <div>
                          {wordCount} palabras &bull; {charCount} caracteres
                        </div>
                        <div>
                          {readingTime} {readingTime === 1 ? 'minuto' : 'minutos'} de lectura
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  /* Other types like Teleprompter or Prompt Playground */
                  <div className="w-full px-8 py-6 flex-1 flex flex-col">
                    <input
                      type="text"
                      value={activeNote.titulo}
                      onChange={e => handleUpdateNote({ titulo: e.target.value })}
                      placeholder="Título de la nota..."
                      className="w-full bg-transparent border-0 text-xl font-bold outline-none px-0 py-0 mb-6 note-title-input"
                      style={{
                        color: t.text,
                        letterSpacing: '-0.02em',
                        fontWeight: 700,
                      }}
                    />

                    <div className="flex-1 flex flex-col min-h-0 note-editor-canvas">
                      {activeNote.tipo === 'guion' ? (
                        <TeleprompterWorkspace note={activeNote} onUpdate={handleUpdateNote} isDark={isDark} />
                      ) : (
                        <PromptPlayground note={activeNote} onUpdate={handleUpdateNote} isDark={isDark} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: AI Copilot Drawer */}
              {showCopilot && (
                <div 
                  className="w-80 shrink-0 border-l flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-right duration-200"
                  style={{ borderColor: t.border, backgroundColor: t.bg }}
                >
                  {/* Copilot Header */}
                  <div className="h-[52px] px-4 border-b flex items-center justify-between shrink-0"
                    style={{ borderColor: t.border }}>
                    <div className="flex items-center gap-2">
                      <Icons.Sparkles className="text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text }}>Copilot IA</span>
                    </div>
                    <button
                      onClick={() => setShowCopilot(false)}
                      className="p-1 rounded hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
                    >
                      <Icons.X />
                    </button>
                  </div>

                  {/* Copilot Config & Actions */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {/* Model Select */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Proveedor de IA</label>
                      <select
                        value={copilotModel}
                        onChange={e => setCopilotModel(e.target.value)}
                        className="w-full bg-transparent border rounded p-2 text-xs"
                        style={{ borderColor: t.border, color: t.text }}
                      >
                        <option value="gemini" style={{ backgroundColor: t.panel, color: '#fff' }}>Google Gemini (Directo)</option>
                        {settings.deepseekKey && <option value="deepseek" style={{ backgroundColor: t.panel, color: '#fff' }}>DeepSeek (Directo)</option>}
                        {settings.openrouterKey && <option value="openrouter" style={{ backgroundColor: t.panel, color: '#fff' }}>OpenRouter (Bóveda)</option>}
                      </select>
                    </div>

                    <div className="w-full h-[1px]" style={{ backgroundColor: t.border }} />

                    {/* Pre-defined Actions */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Acciones Rápidas</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: 'Corregir Ortografía', action: 'Corrige la ortografía y mejora la gramática del texto manteniendo la estructura original.' },
                          { label: 'Mejorar Redacción', action: 'Reescribe el texto para que suene más fluido, profesional y persuasivo.' },
                          { label: 'Resumir Nota', action: 'Genera un resumen ejecutivo breve con los puntos clave del documento.' },
                          { label: 'Hacer Formato Premium', action: 'Optimiza la estructura Markdown del documento utilizando títulos H1, H2, listas y viñetas elegantes para una lectura rápida.' },
                          { label: 'Generar Ideas Relacionadas', action: 'Propón 5 ideas adicionales o secciones recomendadas para añadir al documento.' }
                        ].map((act, idx) => (
                          <button
                            key={idx}
                            disabled={copilotLoading}
                            onClick={() => executeCopilotAction(act.action)}
                            className="w-full text-left px-3 py-2 rounded border text-[10px] font-medium transition-all hover:bg-white/5 active:scale-[0.98]"
                            style={{ borderColor: t.border, color: t.text }}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-[1px]" style={{ backgroundColor: t.border }} />

                    {/* Chat History */}
                    {copilotHistory.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Historial de Respuestas</label>
                        <div className="space-y-3.5">
                          {copilotHistory.map((chat, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: chat.role === 'user' ? t.accent : '#a855f7' }}>
                                {chat.role === 'user' ? 'Tú' : 'Copilot'}
                              </span>
                              <div 
                                className="text-xs p-3 rounded-lg border leading-relaxed font-sans overflow-x-auto whitespace-pre-wrap selection:bg-purple-900/30"
                                style={{ 
                                  backgroundColor: chat.role === 'user' ? 'transparent' : 'rgba(168, 85, 247, 0.03)',
                                  borderColor: chat.role === 'user' ? t.border : 'rgba(168, 85, 247, 0.15)',
                                  color: chat.role === 'user' ? t.textDim : t.text
                                }}
                              >
                                {chat.content}
                                {chat.role === 'assistant' && (
                                  <div className="flex gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'rgba(168, 85, 247, 0.1)' }}>
                                    <button
                                      onClick={() => {
                                        handleUpdateNoteField(activeNote.id, 'contenido', chat.content);
                                        alert("El contenido de la nota ha sido reemplazado con la respuesta de la IA.");
                                      }}
                                      className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40"
                                    >
                                      Reemplazar Nota
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleUpdateNoteField(activeNote.id, 'contenido', (activeNote.contenido || '') + '\n\n' + chat.content);
                                        alert("Respuesta insertada al final de la nota.");
                                      }}
                                      className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50"
                                    >
                                      Insertar al Final
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Prompt Input */}
                  <div className="p-3 border-t space-y-2 shrink-0 bg-black/10" style={{ borderColor: t.border }}>
                    <textarea
                      rows={2}
                      value={copilotQuery}
                      onChange={e => setCopilotQuery(e.target.value)}
                      placeholder="Pídele algo a la IA sobre tu nota..."
                      className="w-full bg-transparent border rounded p-2 text-xs outline-none focus:border-purple-500/50 resize-none"
                      style={{ borderColor: t.border, color: t.text }}
                    />
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setCopilotHistory([])}
                        className="text-[9px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider"
                      >
                        Limpiar chat
                      </button>
                      <button
                        disabled={copilotLoading || !copilotQuery.trim()}
                        onClick={() => executeCopilotAction(copilotQuery, true)}
                        className="px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-black bg-purple-400 hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: copilotLoading ? '#5c5c5c' : '#a855f7', color: copilotLoading ? '#ccc' : '#000' }}
                      >
                        {copilotLoading ? 'Pensando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border animate-pulse"
              style={{ borderColor: t.border, backgroundColor: t.surface }}>
              <Icons.FileText />
            </div>
            <h3 className="text-xs font-semibold" style={{ color: t.text }}>Selecciona un Apunte</h3>
            <p className="text-[10px] mt-1 max-w-xs leading-relaxed" style={{ color: t.textMuted }}>
              Selecciona una nota de la lista intermedia o crea una nueva utilizando los botones superiores de adición.
            </p>
          </div>
        )}
      </div>

      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in">
          <div 
            className="p-6 rounded-xl border max-w-sm w-full space-y-4 shadow-2xl"
            style={{ backgroundColor: t.panel, borderColor: t.border }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.text }}>Insertar Tabla</span>
              <button 
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
              >
                <Icons.X />
              </button>
            </div>
            
            <p className="text-[10px]" style={{ color: t.textDim }}>Arrastra el cursor sobre la cuadrícula para definir el tamaño de la tabla:</p>
            
            {/* Grid selector */}
            <div className="flex flex-col items-center py-2">
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', width: '180px' }}>
                {Array.from({ length: 8 }).map((_, rIdx) => (
                  Array.from({ length: 8 }).map((_, cIdx) => {
                    const isHovered = rIdx <= gridHover.r && cIdx <= gridHover.c;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onMouseEnter={() => setGridHover({ r: rIdx, c: cIdx })}
                        onClick={() => insertTable(rIdx + 1, cIdx + 1)}
                        className="w-5 h-5 rounded cursor-pointer transition-all border"
                        style={{
                          backgroundColor: isHovered ? 'rgba(78, 201, 176, 0.3)' : 'transparent',
                          borderColor: isHovered ? '#4ec9b0' : 'rgba(255,255,255,0.08)'
                        }}
                      />
                    );
                  })
                ))}
              </div>
              <div className="mt-3 text-[10px] font-mono font-bold" style={{ color: t.accent }}>
                {gridHover.r + 1} Filas x {gridHover.c + 1} Columnas
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase rounded border transition-all"
                style={{ borderColor: t.border, color: t.textDim }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// 1. TELEPROMPTER WORKSPACE COMPONENT
// ==========================================
const TeleprompterWorkspace = ({ note, onUpdate, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(25); // 5 to 45 fps
  const [fontSize, setFontSize] = useState(30); // 20px to 50px
  const [isVertical, setIsVertical] = useState(false); // vertical 9:16 or 16:9

  const scrollContainerRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Estimador de tiempo de lectura (150 palabras por minuto o 2.5 palabras por segundo)
  const readingTime = useMemo(() => {
    if (!note.contenido) return '0:00';
    const words = note.contenido.trim().split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.round(words / 2.5);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [note.contenido]);

  // Animación del teleprompter
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const scrollStep = () => {
      const step = speed / 30; 
      scrollContainer.scrollTop += step;

      if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2) {
        setIsPlaying(false);
      } else {
        animationFrameIdRef.current = requestAnimationFrame(scrollStep);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      
      {/* Teleprompter Controls Bar */}
      <div className="h-11 border-b px-4 flex items-center justify-between shrink-0 gap-6"
        style={{ borderColor: t.border, backgroundColor: t.bg }}>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded transition-all flex items-center justify-center ${isPlaying ? 'bg-red-900/30 text-red-400' : 'bg-teal-950/40 text-teal-400'}`}
          >
            {isPlaying ? <Icons.Pause /> : <Icons.Play />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all flex items-center justify-center"
            title="Reiniciar Scroll"
          >
            <Icons.Refresh />
          </button>
        </div>

        {/* Sliders for Font Size and Speed */}
        <div className="flex items-center gap-6 flex-1 max-w-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase whitespace-nowrap" style={{ color: t.textDim }}>Velocidad</span>
            <input
              type="range"
              min="5"
              max="45"
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <span className="text-[10px] font-mono w-6 text-right shrink-0" style={{ color: t.accent }}>{speed}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase whitespace-nowrap" style={{ color: t.textDim }}>Letra</span>
            <input
              type="range"
              min="20"
              max="50"
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <span className="text-[10px] font-mono w-8 text-right shrink-0" style={{ color: t.accent }}>{fontSize}px</span>
          </div>
        </div>

        {/* Aspect Ratio and Reading time */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsVertical(!isVertical)}
            className="px-2 py-0.5 rounded text-[9px] font-bold border transition-all uppercase tracking-wider bg-white/[0.02]"
            style={{ borderColor: t.border, color: isVertical ? '#a855f7' : t.textDim }}
          >
            Formato: {isVertical ? '9:16' : '16:9'}
          </button>
          <div className="flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold"
            style={{ borderColor: t.border, backgroundColor: t.bg }}>
            <span style={{ color: t.textMuted }}>LECTURA:</span>
            <span style={{ color: t.accent }} className="font-mono">{readingTime} MIN</span>
          </div>
        </div>

      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left Side: Raw Script Editor */}
        <div className="w-1/2 border-r flex flex-col p-4 space-y-2 shrink-0" style={{ borderColor: t.border }}>
          <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: t.textDim }}>Guión (Editar)</span>
          <textarea
            value={note.contenido}
            onChange={e => onUpdate({ contenido: e.target.value })}
            placeholder="Escribe el guión técnico o discurso de tu teleprompter aquí..."
            className="flex-1 bg-transparent border-0 outline-none resize-none text-xs leading-relaxed font-mono"
            style={{ color: t.text }}
          />
        </div>

        {/* Right Side: Teleprompter Reader View */}
        <div className="w-1/2 flex flex-col p-4 bg-zinc-950/20 relative">
          <span className="text-[9px] font-bold tracking-wider uppercase mb-3" style={{ color: t.textDim }}>Teleprompter</span>
          
          <div className="flex-1 flex justify-center items-center min-h-0">
            <div
              ref={scrollContainerRef}
              className="h-full w-full overflow-y-auto px-6 py-12 scroll-smooth scrollbar-none"
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                lineHeight: 1.6,
                color: t.text,
                maxWidth: isVertical ? '320px' : '100%',
                border: isVertical ? `1.5px solid ${t.border}` : 'none',
                borderRadius: isVertical ? '12px' : '0px',
                backgroundColor: t.bg
              }}
            >
              {note.contenido ? (
                note.contenido.split('\n').map((line, i) => (
                  <p key={i} className="mb-6 opacity-85">{line || ' '}</p>
                ))
              ) : (
                <p className="text-center text-xs font-normal" style={{ color: t.textMuted }}>Completa el guión de la izquierda para proyectarlo aquí.</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// ==========================================
// 2. PROMPT PLAYGROUND COMPONENT
// ==========================================
const PromptPlayground = ({ note, onUpdate, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [copied, setCopied] = useState(false);
  const [newVarName, setNewVarName] = useState('');

  const noteVariables = note.variables || {};

  const detectedVariables = useMemo(() => {
    if (!note.contenido) return [];
    const matches = note.contenido.match(/\[([A-Z0-9_]+)\]/gi);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/[\[\]]/g, '').toUpperCase()))];
  }, [note.contenido]);

  const handleVariableValueChange = (varName, val) => {
    const nextVars = { ...noteVariables, [varName]: val };
    onUpdate({ variables: nextVars });
  };

  const handleAddVariableToText = (e) => {
    e.preventDefault();
    if (!newVarName.trim()) return;
    const cleanVar = newVarName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const newContent = (note.contenido || '') + ` [${cleanVar}]`;
    onUpdate({
      contenido: newContent,
      variables: { ...noteVariables, [cleanVar]: '' }
    });
    setNewVarName('');
  };

  const compiledPrompt = useMemo(() => {
    if (!note.contenido) return '';
    let result = note.contenido;
    detectedVariables.forEach(v => {
      const replacedValue = noteVariables[v] || `[${v}]`;
      const escaped = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\[${escaped}\\]`, 'g');
      result = result.replace(regex, replacedValue);
    });
    return result;
  }, [note.contenido, detectedVariables, noteVariables]);

  const handleCopyPrompt = () => {
    if (!compiledPrompt) return;
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      
      {/* Left Column: Edit & Preview */}
      <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden border-r" style={{ borderColor: t.border }}>
        
        <div className="h-1/2 flex flex-col pb-3 min-h-0 overflow-hidden">
          <span className="text-[9px] font-bold tracking-wider uppercase mb-2" style={{ color: t.textDim }}>Prompt Base</span>
          <textarea
            value={note.contenido}
            onChange={e => onUpdate({ contenido: e.target.value })}
            placeholder="Escribe el prompt del sistema. Coloca variables usando corchetes, ej: [PRODUCTO]..."
            className="flex-1 bg-transparent border outline-none rounded p-3 text-xs leading-relaxed font-mono focus:border-zinc-500"
            style={{ borderColor: t.border, color: t.text }}
          />
        </div>

        <div className="h-1/2 flex flex-col pt-3 border-t min-h-0 overflow-hidden" style={{ borderColor: t.border }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: t.textDim }}>Resultado Compilado</span>
            <button
              onClick={handleCopyPrompt}
              disabled={!compiledPrompt}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 border ${copied ? 'bg-green-950/30 text-green-400 border-green-900/50' : 'bg-teal-950/30 text-teal-400 border-teal-900/50 hover:bg-teal-900/40'}`}
            >
              {copied ? <Icons.Check /> : <Icons.Copy />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div
            className="flex-1 rounded p-3 text-xs leading-relaxed font-mono overflow-y-auto border"
            style={{ borderColor: t.border, backgroundColor: t.bg, color: t.text }}
          >
            {compiledPrompt || <span style={{ color: t.textMuted }}>Sin resultado</span>}
          </div>
        </div>

      </div>

      {/* Right Column: Configurations */}
      <div className="w-80 shrink-0 flex flex-col p-4 space-y-4 overflow-y-auto" style={{ backgroundColor: t.bg, borderLeft: `1px solid ${t.border}` }}>
        
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: t.text }}>Variables del Prompt</span>
          <p className="text-[9px] mt-1" style={{ color: t.textDim }}>Completa los campos dinámicos para compilar tu prompt en caliente.</p>
        </div>

        <div className="space-y-3">
          {detectedVariables.length > 0 ? (
            detectedVariables.map(variable => (
              <div key={variable} className="space-y-1">
                <span className="text-[9px] font-bold font-mono uppercase" style={{ color: t.textDim }}>[{variable}]</span>
                <input
                  type="text"
                  value={noteVariables[variable] || ''}
                  onChange={e => handleVariableValueChange(variable, e.target.value)}
                  placeholder={`Valor para ${variable}...`}
                  className="w-full border outline-none text-xs rounded px-2.5 py-1.5 focus:border-zinc-500"
                  style={{ backgroundColor: t.bg, borderColor: t.border, color: t.text }}
                />
              </div>
            ))
          ) : (
            <div className="text-[10px] py-3 text-center border border-dashed rounded" style={{ borderColor: t.border, color: t.textMuted }}>
              No se detectaron variables [PARAMETRO] en el prompt base.
            </div>
          )}
        </div>

        <div className="w-full h-[1px]" style={{ backgroundColor: t.border }} />

        <form onSubmit={handleAddVariableToText} className="space-y-2">
          <span className="text-[9px] font-bold uppercase" style={{ color: t.textDim }}>Añadir Variable</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVarName}
              onChange={e => setNewVarName(e.target.value)}
              placeholder="Ej. PRODUCTO..."
              className="flex-1 border outline-none text-xs rounded px-2 py-1 focus:border-zinc-500"
              style={{ backgroundColor: t.bg, borderColor: t.border, color: t.text }}
            />
            <button
              type="submit"
              className="px-3 text-black font-bold text-[10px] rounded"
              style={{ backgroundColor: t.accent }}
            >
              +
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};

export default Notas;
