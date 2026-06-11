import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, Heading1, Heading2, Heading3, Heading4, ListTodo, List, ListOrdered, 
  Minus, ChevronRight, FileText, AlertCircle, Quote, Table, Code, Link, 
  Image, Video, Music, File, Bookmark, Grid, Trello, Image as GalleryIcon, 
  AlignJustify, Calendar, Plus, Trash2, ArrowUp, ArrowDown, Settings, Check, X,
  ExternalLink, ChevronDown, Sparkles
} from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

export default function NotionBlockEditor({ value = '', onChange, isDark = true }) {
  const t = useTheme(isDark);
  const [blocks, setBlocks] = useState([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);
  const [slashMenu, setSlashMenu] = useState({ visible: false, query: '', index: 0, blockId: null });
  const blockRefs = useRef({});

  // Parse markdown input to blocks when value changes (only if blocks is empty or has changed externally)
  useEffect(() => {
    if (value !== undefined) {
      const parsed = parseMarkdownToBlocks(value);
      // Only set if different to prevent cursor jumps
      const currentMd = serializeBlocksToMarkdown(blocks);
      if (value !== currentMd || blocks.length === 0) {
        setBlocks(parsed);
      }
    }
  }, [value]);

  // Trigger change handler
  const triggerChange = (newBlocks) => {
    setBlocks(newBlocks);
    if (onChange) {
      onChange(serializeBlocksToMarkdown(newBlocks));
    }
  };

  // --- PARSER MD -> BLOCOS ---
  const parseMarkdownToBlocks = (md) => {
    if (!md || md.trim() === '') {
      return [{ id: 'blk-init-' + Date.now(), tipo: 'texto', contenido: '' }];
    }

    const lines = md.split('\n');
    const parsedBlocks = [];
    let currentTable = null;
    let currentTextBlock = [];

    const flushTextBlock = () => {
      if (currentTextBlock.length > 0) {
        currentTextBlock.forEach((line) => {
          const trimmed = line.trim();
          
          // Custom tag parsers
          if (trimmed.startsWith('<!-- NOTION_DB_VIEW:')) {
            const match = trimmed.match(/<!-- NOTION_DB_VIEW:(\w+):(.*?) -->/);
            if (match) {
              const type = match[1];
              try {
                const data = JSON.parse(match[2]);
                parsedBlocks.push({
                  id: 'blk-db-' + Math.random().toString(36).substr(2, 9),
                  tipo: `vista-${type}`,
                  contenido: data
                });
                return;
              } catch (e) { console.error('Error parsing db view json', e); }
            }
          }

          if (trimmed.startsWith('<details><summary>') && trimmed.endsWith('</details>')) {
            const match = trimmed.match(/<details><summary>(.*?)<\/summary>(.*?)<\/details>/);
            if (match) {
              parsedBlocks.push({
                id: 'blk-toggle-' + Math.random().toString(36).substr(2, 9),
                tipo: 'desplegable',
                contenido: match[1],
                extra: match[2]
              });
              return;
            }
          }

          if (trimmed.startsWith('<div class="notion-callout"') && trimmed.endsWith('</div>')) {
            const emojiMatch = trimmed.match(/data-emoji="(.*?)"/);
            const contentMatch = trimmed.match(/>(.*?)<\/div>/);
            parsedBlocks.push({
              id: 'blk-callout-' + Math.random().toString(36).substr(2, 9),
              tipo: 'destacado',
              contenido: contentMatch ? contentMatch[1] : '',
              extra: emojiMatch ? emojiMatch[1] : '💡'
            });
            return;
          }

          // Native headers
          if (trimmed.startsWith('# ')) {
            parsedBlocks.push({ id: 'blk-h1-' + Math.random().toString(36).substr(2, 9), tipo: 'h1', contenido: trimmed.replace('# ', '') });
          } else if (trimmed.startsWith('## ')) {
            parsedBlocks.push({ id: 'blk-h2-' + Math.random().toString(36).substr(2, 9), tipo: 'h2', contenido: trimmed.replace('## ', '') });
          } else if (trimmed.startsWith('### ')) {
            parsedBlocks.push({ id: 'blk-h3-' + Math.random().toString(36).substr(2, 9), tipo: 'h3', contenido: trimmed.replace('### ', '') });
          } else if (trimmed.startsWith('#### ')) {
            parsedBlocks.push({ id: 'blk-h4-' + Math.random().toString(36).substr(2, 9), tipo: 'h4', contenido: trimmed.replace('#### ', '') });
          } 
          // Divider
          else if (trimmed === '---') {
            parsedBlocks.push({ id: 'blk-div-' + Math.random().toString(36).substr(2, 9), tipo: 'divisor', contenido: '' });
          }
          // Checklist (todo) with 3 states
          else if (trimmed.match(/^\s*[-*]\s+\[([ xX/])\]\s*(.*)$/)) {
            const m = trimmed.match(/^\s*[-*]\s+\[([ xX/])\]\s*(.*)$/);
            const statusChar = m[1];
            const text = m[2];
            let status = 'pendiente';
            if (statusChar === '/') status = 'proceso';
            else if (statusChar.toLowerCase() === 'x') status = 'completado';
            parsedBlocks.push({
              id: 'blk-check-' + Math.random().toString(36).substr(2, 9),
              tipo: 'checklist',
              contenido: text,
              extra: status
            });
          }
          // Bullet list
          else if (trimmed.match(/^\s*[-*]\s+(.*)$/)) {
            const m = trimmed.match(/^\s*[-*]\s+(.*)$/);
            parsedBlocks.push({ id: 'blk-bullet-' + Math.random().toString(36).substr(2, 9), tipo: 'lista-vinetas', contenido: m[1] });
          }
          // Numbered list
          else if (trimmed.match(/^\s*\d+\.\s+(.*)$/)) {
            const m = trimmed.match(/^\s*\d+\.\s+(.*)$/);
            parsedBlocks.push({ id: 'blk-num-' + Math.random().toString(36).substr(2, 9), tipo: 'lista-numerada', contenido: m[1] });
          }
          // Quote
          else if (trimmed.startsWith('> ')) {
            parsedBlocks.push({ id: 'blk-quote-' + Math.random().toString(36).substr(2, 9), tipo: 'cita', contenido: trimmed.replace('> ', '') });
          }
          // Code/Visor block
          else if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
            const m = trimmed.match(/^```(\w*)\s*([\s\S]*?)\s*```$/);
            parsedBlocks.push({
              id: 'blk-code-' + Math.random().toString(36).substr(2, 9),
              tipo: 'visor',
              contenido: m ? m[2] : '',
              extra: m ? m[1] : 'javascript'
            });
          }
          // Images
          else if (trimmed.startsWith('![') && trimmed.includes('](') && trimmed.endsWith(')')) {
            const altMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
            let url = altMatch ? altMatch[2] : '';
            let cap = altMatch ? altMatch[1] : 'Imagen';
            
            // Sub-types of media links
            if (cap.startsWith('video:')) {
              parsedBlocks.push({ id: 'blk-vid-' + Math.random().toString(36).substr(2, 9), tipo: 'video', contenido: url, extra: cap.replace('video:', '') });
            } else if (cap.startsWith('audio:')) {
              parsedBlocks.push({ id: 'blk-aud-' + Math.random().toString(36).substr(2, 9), tipo: 'audio', contenido: url, extra: cap.replace('audio:', '') });
            } else if (cap.startsWith('file:')) {
              parsedBlocks.push({ id: 'blk-file-' + Math.random().toString(36).substr(2, 9), tipo: 'archivo', contenido: url, extra: cap.replace('file:', '') });
            } else if (cap.startsWith('bookmark:')) {
              const parts = cap.replace('bookmark:', '').split('|');
              parsedBlocks.push({ id: 'blk-bm-' + Math.random().toString(36).substr(2, 9), tipo: 'marcador-web', contenido: url, extra: parts[0], desc: parts[1] || '' });
            } else if (cap.startsWith('page-link:')) {
              parsedBlocks.push({ id: 'blk-pl-' + Math.random().toString(36).substr(2, 9), tipo: 'enlace-pagina', contenido: url, extra: cap.replace('page-link:', '') });
            } else if (cap.startsWith('page:')) {
              parsedBlocks.push({ id: 'blk-p-' + Math.random().toString(36).substr(2, 9), tipo: 'pagina', contenido: url, extra: cap.replace('page:', '') });
            } else {
              parsedBlocks.push({ id: 'blk-img-' + Math.random().toString(36).substr(2, 9), tipo: 'imagen', contenido: url, extra: cap });
            }
          }
          // Default text paragraph
          else {
            parsedBlocks.push({ id: 'blk-txt-' + Math.random().toString(36).substr(2, 9), tipo: 'texto', contenido: line });
          }
        });
        currentTextBlock = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = line.trim().startsWith('|');

      if (isTableLine) {
        flushTextBlock();
        if (!currentTable) {
          currentTable = [];
        }
        currentTable.push(line);
      } else {
        if (currentTable) {
          // Flush table block
          const headerLine = currentTable[0];
          const dataLines = currentTable.slice(2);
          const parseRow = (l) => l.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
          const columnas = parseRow(headerLine);
          const filas = dataLines.map((l, rIdx) => ({
            id: 'row-' + rIdx + '-' + Math.random().toString(36).substr(2, 5),
            celdas: parseRow(l)
          }));
          parsedBlocks.push({
            id: 'blk-tbl-' + Math.random().toString(36).substr(2, 9),
            tipo: 'tabla',
            contenido: columnas.length > 0 ? columnas : ['Columna 1', 'Columna 2'],
            extra: filas.length > 0 ? filas : [{ id: 'row-1', celdas: ['', ''] }]
          });
          currentTable = null;
        }
        currentTextBlock.push(line);
      }
    }

    flushTextBlock();
    return parsedBlocks;
  };

  // --- SERIALIZER BLOCOS -> MD ---
  const serializeBlocksToMarkdown = (blocksList) => {
    return blocksList.map((block) => {
      if (!block) return '';
      switch (block.tipo) {
        case 'h1': return `# ${block.contenido}`;
        case 'h2': return `## ${block.contenido}`;
        case 'h3': return `### ${block.contenido}`;
        case 'h4': return `#### ${block.contenido}`;
        case 'divisor': return '---';
        case 'cita': return `> ${block.contenido}`;
        case 'lista-vinetas': return `- ${block.contenido}`;
        case 'lista-numerada': return `1. ${block.contenido}`;
        case 'checklist': {
          let char = ' ';
          if (block.extra === 'proceso') char = '/';
          else if (block.extra === 'completado') char = 'x';
          return `- [${char}] ${block.contenido}`;
        }
        case 'desplegable': return `<details><summary>${block.contenido}</summary>${block.extra || ''}</details>`;
        case 'destacado': return `<div class="notion-callout" data-emoji="${block.extra || '💡'}">${block.contenido}</div>`;
        case 'visor': return `\`\`\`${block.extra || 'javascript'}\n${block.contenido}\n\`\`\``;
        case 'tabla': {
          const header = '| ' + block.contenido.join(' | ') + ' |';
          const separator = '| ' + block.contenido.map(() => '---------').join(' | ') + ' |';
          const rows = block.extra.map(row => '| ' + row.celdas.join(' | ') + ' |').join('\n');
          return [header, separator, rows].filter(Boolean).join('\n');
        }
        case 'imagen': return `![${block.extra || 'Imagen'}](${block.contenido})`;
        case 'video': return `![video:${block.extra || 'Video'}](${block.contenido})`;
        case 'audio': return `![audio:${block.extra || 'Audio'}](${block.contenido})`;
        case 'archivo': return `![file:${block.extra || 'Descargar'}](${block.contenido})`;
        case 'marcador-web': return `![bookmark:${block.extra || 'Marcador'}|${block.desc || ''}](${block.contenido})`;
        case 'enlace-pagina': return `![page-link:${block.extra || 'Página'}](${block.contenido})`;
        case 'pagina': return `![page:${block.extra || 'Subpágina'}](${block.contenido})`;
        case 'vista-tabla':
        case 'vista-tablero':
        case 'vista-galeria':
        case 'vista-lista':
        case 'vista-calendario': {
          const type = block.tipo.replace('vista-', '');
          return `<!-- NOTION_DB_VIEW:${type}:${JSON.stringify(block.contenido)} -->`;
        }
        default:
          return block.contenido || '';
      }
    }).join('\n');
  };

  // --- EVENT HANDLERS ---
  const handleBlockChange = (index, value, extra = null, desc = null) => {
    const newBlocks = [...blocks];
    newBlocks[index].contenido = value;
    if (extra !== null) newBlocks[index].extra = extra;
    if (desc !== null) newBlocks[index].desc = desc;
    triggerChange(newBlocks);
  };

  const insertBlock = (index, tipo = 'texto', content = '') => {
    const newBlocks = [...blocks];
    let newBlock = { id: 'blk-' + tipo + '-' + Date.now(), tipo, contenido: content };
    
    // Add defaults for structured types
    if (tipo === 'checklist') newBlock.extra = 'pendiente';
    if (tipo === 'desplegable') newBlock.extra = 'Contenido colapsado...';
    if (tipo === 'destacado') newBlock.extra = '💡';
    if (tipo === 'visor') newBlock.extra = 'javascript';
    if (tipo === 'tabla') {
      newBlock.contenido = ['Columna 1', 'Columna 2'];
      newBlock.extra = [{ id: 'r1', celdas: ['Celda A', 'Celda B'] }];
    }
    if (tipo.startsWith('vista-')) {
      newBlock.contenido = getMockDatabaseData(tipo);
    }
    
    newBlocks.splice(index + 1, 0, newBlock);
    triggerChange(newBlocks);
    
    // Move focus to new block after render
    setTimeout(() => {
      const nextInput = blockRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }, 50);
  };

  const removeBlock = (index) => {
    if (blocks.length === 1) {
      // Don't remove last block, just make it normal text
      const newBlocks = [...blocks];
      newBlocks[0] = { id: 'blk-txt-' + Date.now(), tipo: 'texto', contenido: '' };
      triggerChange(newBlocks);
      return;
    }
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    triggerChange(newBlocks);
    
    // Move focus to previous block
    setTimeout(() => {
      const prevIdx = Math.max(0, index - 1);
      const prevInput = blockRefs.current[prevIdx];
      if (prevInput) prevInput.focus();
    }, 50);
  };

  // Navigation using keyboard
  const handleKeyDown = (e, index, block) => {
    const value = block.contenido || '';
    
    if (e.key === 'Enter') {
      if (slashMenu.visible) return; // Allow menu to consume Enter
      
      e.preventDefault();
      insertBlock(index, 'texto', '');
    } 
    
    else if (e.key === 'Backspace' && value === '') {
      e.preventDefault();
      // If it is a special block type, convert it back to standard text first
      if (block.tipo !== 'texto') {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...block, tipo: 'texto', extra: null, desc: null };
        triggerChange(newBlocks);
      } else {
        removeBlock(index);
      }
    } 
    
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = blockRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    } 
    
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = blockRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  // Slash commands trigger
  const handleKeyUp = (e, index, block) => {
    const value = block.contenido || '';
    
    // Detect slash key
    if (e.key === '/') {
      const selection = window.getSelection();
      const textNode = selection.anchorNode;
      if (textNode) {
        // Simple trigger if block ends with slash or contains it
        setSlashMenu({
          visible: true,
          query: '',
          index: 0,
          blockId: block.id,
          blockIndex: index
        });
      }
    } else if (slashMenu.visible) {
      if (e.key === 'Escape') {
        setSlashMenu({ ...slashMenu, visible: false });
      } else {
        // Update search query based on text after the last '/'
        const slashIdx = value.lastIndexOf('/');
        if (slashIdx !== -1) {
          const query = value.substr(slashIdx + 1);
          setSlashMenu({ ...slashMenu, query });
        } else {
          setSlashMenu({ ...slashMenu, visible: false });
        }
      }
    }
  };

  // --- FLOATING MENU TOOLS LIST ---
  const allTools = [
    { id: 'texto', name: 'Texto', desc: 'Escribe con texto normal', icon: Type, cat: 'Bloques básicos' },
    { id: 'h1', name: 'Encabezado 1', desc: 'Título de sección grande', icon: Heading1, cat: 'Bloques básicos' },
    { id: 'h2', name: 'Encabezado 2', desc: 'Título de sección mediano', icon: Heading2, cat: 'Bloques básicos' },
    { id: 'h3', name: 'Encabezado 3', desc: 'Título de sección estándar', icon: Heading3, cat: 'Bloques básicos' },
    { id: 'h4', name: 'Encabezado 4', desc: 'Título de sección pequeño', icon: Heading4, cat: 'Bloques básicos' },
    { id: 'checklist', name: 'Lista de tareas', desc: 'Lista con casillas de verificación', icon: ListTodo, cat: 'Sugerencias' },
    { id: 'lista-vinetas', name: 'Lista de viñetas', desc: 'Crea una lista con viñetas sencilla', icon: List, cat: 'Bloques básicos' },
    { id: 'lista-numerada', name: 'Lista numerada', desc: 'Crea una lista numerada', icon: ListOrdered, cat: 'Sugerencias' },
    { id: 'divisor', name: 'Divisor', desc: 'Divide secciones con una línea', icon: Minus, cat: 'Sugerencias' },
    { id: 'desplegable', name: 'Desplegable', desc: 'Oculta o muestra contenido', icon: ChevronRight, cat: 'Bloques básicos' },
    { id: 'destacado', name: 'Destacado', desc: 'Resalta texto en un recuadro', icon: AlertCircle, cat: 'Bloques básicos' },
    { id: 'cita', name: 'Cita', desc: 'Crea un bloque de cita elegante', icon: Quote, cat: 'Bloques básicos' },
    { id: 'tabla', name: 'Tabla', desc: 'Inserta una tabla simple', icon: Table, cat: 'Sugerencias' },
    { id: 'visor', name: 'Visor', desc: 'Inserta un bloque de código o prompt', icon: Code, cat: 'Bloques básicos' },
    { id: 'pagina', name: 'Página', desc: 'Crea un sublienzo independiente', icon: FileText, cat: 'Bloques avanzados' },
    { id: 'enlace-pagina', name: 'Enlace de página', desc: 'Enlaza una nota existente', icon: Link, cat: 'Bloques avanzados' },
    { id: 'imagen', name: 'Imagen', desc: 'Sube o enlaza una imagen / storyboard', icon: Image, cat: 'Multimedia' },
    { id: 'video', name: 'Video', desc: 'Enlaza un video de referencia', icon: Video, cat: 'Multimedia' },
    { id: 'audio', name: 'Audio', desc: 'Enlaza locuciones o clips de audio', icon: Music, cat: 'Multimedia' },
    { id: 'archivo', name: 'Archivo', desc: 'Adjunta un archivo o brief', icon: File, cat: 'Multimedia' },
    { id: 'marcador-web', name: 'Marcador web', desc: 'Guarda un enlace con previsualización', icon: Bookmark, cat: 'Multimedia' },
    { id: 'vista-tabla', name: 'Vista de tabla', desc: 'Base de datos en formato de tabla', icon: Grid, cat: 'Bases de datos' },
    { id: 'vista-tablero', name: 'Vista de tablero', desc: 'Tablero Kanban interactivo', icon: Trello, cat: 'Bases de datos' },
    { id: 'vista-galeria', name: 'Vista de galería', desc: 'Vista visual tipo grid de tarjetas', icon: GalleryIcon, cat: 'Bases de datos' },
    { id: 'vista-lista', name: 'Vista de lista', desc: 'Lista compacta de ítems con etiquetas', icon: AlignJustify, cat: 'Bases de datos' },
    { id: 'vista-calendario', name: 'Vista de Calendario', desc: 'Calendario de entregas mensual', icon: Calendar, cat: 'Bases de datos' }
  ];

  const filteredTools = allTools.filter(tool => 
    tool.name.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
    tool.desc.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  const applySlashCommand = (toolId) => {
    const index = slashMenu.blockIndex;
    const block = blocks[index];
    const cleanText = (block.contenido || '').replace(/\/[^/]*$/, ''); // Remove slash query

    // Replace the block type or transform it
    const newBlocks = [...blocks];
    let newBlock = { ...block, tipo: toolId, contenido: cleanText };

    // Initial setups for specific types
    if (toolId === 'checklist') newBlock.extra = 'pendiente';
    if (toolId === 'desplegable') newBlock.extra = 'Contenido colapsado...';
    if (toolId === 'destacado') newBlock.extra = '💡';
    if (toolId === 'visor') newBlock.extra = 'javascript';
    if (toolId === 'tabla') {
      newBlock.contenido = ['Columna 1', 'Columna 2'];
      newBlock.extra = [{ id: 'r1', celdas: ['Celda A', 'Celda B'] }];
    }
    if (toolId.startsWith('vista-')) {
      newBlock.contenido = getMockDatabaseData(toolId);
    }

    newBlocks[index] = newBlock;
    triggerChange(newBlocks);
    setSlashMenu({ ...slashMenu, visible: false });

    // Refocus
    setTimeout(() => {
      const input = blockRefs.current[index];
      if (input) input.focus();
    }, 50);
  };

  const handleSlashMenuKeyDown = (e) => {
    if (!slashMenu.visible) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashMenu(prev => ({
        ...prev,
        index: (prev.index + 1) % filteredTools.length
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashMenu(prev => ({
        ...prev,
        index: (prev.index - 1 + filteredTools.length) % filteredTools.length
      }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[slashMenu.index]) {
        applySlashCommand(filteredTools[slashMenu.index].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSlashMenu(prev => ({ ...prev, visible: false }));
    }
  };

  // Mock initial database states for tables, board kanban, calendars
  const getMockDatabaseData = (type) => {
    if (type === 'vista-tabla') {
      return {
        columns: ['Nombre de Tarea', 'Estado', 'Prioridad', 'Fecha de Entrega'],
        rows: [
          { id: '1', values: ['Hook de Intro Video Escape', 'En Proceso', 'Alta', '2026-06-12'] },
          { id: '2', values: ['Añadir transiciones dinámicas', 'Listo', 'Media', '2026-06-11'] },
          { id: '3', values: ['Sound Design y B-Rolls', 'Pendiente', 'Alta', '2026-06-15'] }
        ]
      };
    }
    if (type === 'vista-tablero') {
      return {
        columns: ['Sin empezar', 'En progreso', 'Listo'],
        cards: [
          { id: 'c1', title: 'Exportar Master 4K', col: 'Listo', desc: 'Exportación limpia' },
          { id: 'c2', title: 'Corrección de Color', col: 'En progreso', desc: 'Aplicar LUT Inefable' },
          { id: 'c3', title: 'Selección de Música de Fondo', col: 'Sin empezar', desc: 'Buscar tracks en drive' }
        ]
      };
    }
    if (type === 'vista-galeria') {
      return [
        { id: 'g1', title: 'Miniatura A - Estilo Alto Contraste', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', desc: 'Miniatura para YouTube' },
        { id: 'g2', title: 'Paleta de Color Ref', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400', desc: 'LUT de color cálido cinemático' }
      ];
    }
    if (type === 'vista-lista') {
      return [
        { id: 'l1', title: 'Brief del Cliente', tags: ['Entregado', 'PDF'] },
        { id: 'l2', title: 'Guión Técnico Aprobado', tags: ['Guion', 'Aprobado'] },
        { id: 'l3', title: 'Música sin copyright', tags: ['Assets', 'Audio'] }
      ];
    }
    if (type === 'vista-calendario') {
      return [
        { id: 'cal1', title: 'Sesión Edit 1', date: '2026-06-12', label: 'Video' },
        { id: 'cal2', title: 'Entrega Draft 1', date: '2026-06-15', label: 'Revisión' },
        { id: 'cal3', title: 'Feedback Final', date: '2026-06-18', label: 'Aprobación' }
      ];
    }
    return {};
  };

  return (
    <div 
      className="w-full flex-1 flex flex-col p-6 min-h-[500px] select-text relative select-none"
      onKeyDown={handleSlashMenuKeyDown}
    >
      <div className="w-full max-w-[900px] mx-auto flex flex-col gap-1.5 pb-24">
        {blocks.map((block, index) => {
          const Icon = allTools.find(t => t.id === block.tipo)?.icon || Type;
          
          return (
            <div 
              key={block.id} 
              className="group flex items-start gap-2 w-full relative transition-all duration-150 rounded px-1.5 py-0.5"
              style={{ backgroundColor: activeBlockIndex === index ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              {/* Left-hand actions bar for block options */}
              <div className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-200 z-10">
                <button 
                  onClick={() => insertBlock(index, 'texto', '')}
                  className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-white"
                  title="Insertar bloque abajo"
                >
                  <Plus size={10} />
                </button>
                <button 
                  onClick={() => removeBlock(index)}
                  className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-red-400"
                  title="Eliminar bloque"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Dynamic render block types */}
              <div className="flex-1 flex items-start gap-2.5 w-full">
                {renderBlockContent(block, index, handleBlockChange, blockRefs, handleKeyDown, handleKeyUp, setActiveBlockIndex, activeBlockIndex, t)}
              </div>
            </div>
          );
        })}
      </div>

      {/* RENDER THE FLOATING NOTION SLASH MENU */}
      {slashMenu.visible && filteredTools.length > 0 && (
        <div 
          className="absolute z-[1000] border rounded-xl shadow-2xl flex flex-col w-[300px] max-h-[350px] overflow-hidden backdrop-blur-xl animate-in scale-in duration-150 mac-scrollbar"
          style={{ 
            backgroundColor: 'rgba(20, 20, 22, 0.95)', 
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            left: '100px', // Fallback or dynamic position relative to caret could go here
            top: `${Math.min(500, (slashMenu.blockIndex || 0) * 32 + 80)}px`
          }}
        >
          <div className="px-3 py-2 border-b border-white/5 text-[9px] font-black tracking-widest text-neutral-500 uppercase">
            {slashMenu.query ? `Buscando "${slashMenu.query}"` : 'Sugerencias'}
          </div>
          <div className="flex-1 overflow-y-auto py-1.5 mac-scrollbar max-h-[280px]">
            {/* Group tools by category */}
            {['Sugerencias', 'Bloques básicos', 'Multimedia', 'Bases de datos', 'Bloques avanzados'].map((cat) => {
              const catTools = filteredTools.filter(t => t.cat === cat);
              if (catTools.length === 0) return null;
              
              return (
                <div key={cat}>
                  <div className="px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-neutral-600">{cat}</div>
                  {catTools.map((tool, tIdx) => {
                    const globalIdx = filteredTools.findIndex(x => x.id === tool.id);
                    const isSelected = globalIdx === slashMenu.index;
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => applySlashCommand(tool.id)}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-3 transition-colors duration-150"
                        style={{ 
                          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        }}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center border border-white/5 text-neutral-400"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <ToolIcon size={12} className={isSelected ? 'text-white' : 'text-neutral-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-neutral-200 uppercase tracking-wide">{tool.name}</div>
                          <div className="text-[8px] text-neutral-500 truncate">{tool.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="text-[7px] font-black uppercase text-neutral-500 px-1 py-0.5 rounded border border-white/10 bg-white/5">
                            enter
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="px-3 py-1.5 border-t border-white/5 flex justify-between items-center text-[8px] font-bold text-neutral-600 uppercase tracking-wider bg-white/[0.01]">
            <span>Cerrar menú</span>
            <span>esc</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Render the detailed elements for each block type inline
function renderBlockContent(block, index, onChange, refs, onKeyDown, onKeyUp, onFocus, activeBlockIndex, t) {
  const isSelected = activeBlockIndex === index;
  
  const baseInputStyle = {
    color: 'inherit',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    padding: '4px 0',
    fontFamily: 'inherit',
    lineHeight: '1.6'
  };

  // Helper text-input block wrapper
  const renderTextInput = (fontSizeClass, fontWeightClass, placeholderText, extraStyle = {}) => {
    return (
      <input
        ref={el => refs.current[index] = el}
        type="text"
        value={block.contenido || ''}
        onChange={e => onChange(index, e.target.value)}
        onKeyDown={e => onKeyDown(e, index, block)}
        onKeyUp={e => onKeyUp(e, index, block)}
        onFocus={() => onFocus(index)}
        placeholder={placeholderText}
        className={`${fontSizeClass} ${fontWeightClass} w-full text-neutral-300 placeholder-neutral-700 transition-colors duration-150`}
        style={{ ...baseInputStyle, ...extraStyle }}
      />
    );
  };

  switch (block.tipo) {
    case 'h1':
      return renderTextInput('text-xl', 'font-black uppercase tracking-tight text-white border-b border-white/5 pb-1', 'Título 1', { letterSpacing: '-0.02em' });
    case 'h2':
      return renderTextInput('text-base', 'font-extrabold uppercase tracking-wide text-neutral-100', 'Título 2');
    case 'h3':
      return renderTextInput('text-sm', 'font-bold uppercase text-neutral-200', 'Título 3');
    case 'h4':
      return renderTextInput('text-xs', 'font-semibold uppercase text-neutral-300', 'Título 4');
    
    case 'divisor':
      return (
        <div className="w-full py-2 flex items-center justify-center">
          <div className="w-full h-[1px] bg-white/10" />
        </div>
      );

    case 'cita':
      return (
        <div className="w-full flex items-stretch pl-4 border-l-2 border-amber-500/60 bg-amber-500/[0.02] py-1">
          {renderTextInput('text-xs', 'font-medium italic text-amber-200/90', 'Escribe una cita...', { fontStyle: 'italic' })}
        </div>
      );

    case 'lista-vinetas':
      return (
        <div className="flex items-start w-full gap-2 pl-2">
          <div className="text-neutral-500 select-none pt-1">•</div>
          {renderTextInput('text-xs', 'font-normal', 'Elemento de lista')}
        </div>
      );

    case 'lista-numerada':
      return (
        <div className="flex items-start w-full gap-2 pl-2">
          <div className="text-neutral-500 select-none pt-0.5 text-xs font-bold">{index + 1}.</div>
          {renderTextInput('text-xs', 'font-normal', 'Elemento numerado')}
        </div>
      );

    case 'checklist':
      return (
        <div className="flex items-center w-full gap-3 pl-1">
          {/* Custom three-state check button */}
          <button
            onClick={() => {
              const nextStatus = block.extra === 'pendiente' ? 'proceso' : block.extra === 'proceso' ? 'completado' : 'pendiente';
              onChange(index, block.contenido, nextStatus);
            }}
            className="w-4 h-4 rounded flex items-center justify-center border transition-all duration-200"
            style={{ 
              borderColor: block.extra === 'completado' ? '#10b981' : block.extra === 'proceso' ? '#eab308' : 'rgba(255,255,255,0.2)',
              backgroundColor: block.extra === 'completado' ? 'rgba(16,185,129,0.1)' : block.extra === 'proceso' ? 'rgba(234,179,8,0.1)' : 'transparent',
              color: block.extra === 'completado' ? '#10b981' : block.extra === 'proceso' ? '#eab308' : 'transparent'
            }}
          >
            {block.extra === 'completado' && <Check size={10} strokeWidth={3} />}
            {block.extra === 'proceso' && <span className="text-[9px] font-black leading-none">/</span>}
          </button>
          
          <input
            ref={el => refs.current[index] = el}
            type="text"
            value={block.contenido || ''}
            onChange={e => onChange(index, e.target.value)}
            onKeyDown={e => onKeyDown(e, index, block)}
            onKeyUp={e => onKeyUp(e, index, block)}
            onFocus={() => onFocus(index)}
            placeholder="Tarea..."
            className={`text-xs font-medium w-full text-neutral-300 placeholder-neutral-700 transition-all duration-150 ${block.extra === 'completado' ? 'line-through text-neutral-500' : ''}`}
            style={baseInputStyle}
          />
        </div>
      );

    case 'desplegable':
      return (
        <div className="w-full flex flex-col pl-1 border border-white/5 rounded-lg p-2 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onChange(index, block.contenido, block.extra, block.isOpen ? 'closed' : 'open')}
              className="p-0.5 rounded hover:bg-white/5 text-neutral-500"
            >
              {block.desc === 'open' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {renderTextInput('text-xs', 'font-bold text-neutral-200', 'Toggle Title')}
          </div>
          {block.desc === 'open' && (
            <div className="pl-6 pr-2 py-1 mt-1 border-l border-white/5">
              <textarea
                value={block.extra || ''}
                onChange={e => onChange(index, block.contenido, e.target.value)}
                placeholder="Contenido colapsado..."
                className="w-full bg-transparent border-none outline-none text-[11px] text-neutral-400 resize-none font-mono py-1"
                rows={3}
              />
            </div>
          )}
        </div>
      );

    case 'destacado':
      return (
        <div className="w-full flex gap-3 p-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.02] items-start">
          <input 
            type="text" 
            value={block.extra || '💡'} 
            onChange={e => onChange(index, block.contenido, e.target.value)}
            className="w-6 h-6 flex items-center justify-center bg-transparent border-0 outline-none text-sm text-center"
          />
          <div className="flex-1">
            {renderTextInput('text-xs', 'font-medium text-neutral-200', 'Escribe algo destacado...')}
          </div>
        </div>
      );

    case 'visor':
      return (
        <div className="w-full flex flex-col rounded-lg border border-white/10 bg-[#0d0d0e] overflow-hidden">
          <div className="px-3 py-1 border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-[9px] font-black uppercase text-neutral-500 tracking-wider">
            <select
              value={block.extra || 'javascript'}
              onChange={e => onChange(index, block.contenido, e.target.value)}
              className="bg-transparent border-0 outline-none font-bold cursor-pointer text-neutral-400 hover:text-white"
            >
              <option value="javascript">Javascript</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="prompts">Prompts IA</option>
            </select>
            <span>Visor de código</span>
          </div>
          <textarea
            value={block.contenido || ''}
            onChange={e => onChange(index, e.target.value)}
            placeholder="Introduce tu código o prompt aquí..."
            className="w-full p-3 bg-transparent border-none outline-none font-mono text-[10px] text-emerald-400/90 leading-relaxed resize-y min-h-[100px]"
          />
        </div>
      );

    case 'tabla':
      return (
        <div className="w-full overflow-x-auto border border-white/10 rounded-lg bg-white/[0.01] p-1">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {block.contenido.map((col, cIdx) => (
                  <th key={cIdx} className="p-2 border-r border-white/10">
                    <input
                      type="text"
                      value={col}
                      onChange={e => {
                        const newCols = [...block.contenido];
                        newCols[cIdx] = e.target.value;
                        onChange(index, newCols, block.extra);
                      }}
                      className="bg-transparent border-0 outline-none font-extrabold uppercase text-white w-full tracking-wider text-[8px]"
                    />
                  </th>
                ))}
                <th className="p-1 w-8 text-center">
                  <button 
                    onClick={() => {
                      const newCols = [...block.contenido, `Columna ${block.contenido.length + 1}`];
                      const newRows = block.extra.map(r => ({ ...r, celdas: [...r.celdas, ''] }));
                      onChange(index, newCols, newRows);
                    }}
                    className="p-1 rounded hover:bg-white/5 text-neutral-500 hover:text-white"
                  >
                    <Plus size={10} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {block.extra.map((row, rIdx) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  {row.celdas.map((cell, cIdx) => (
                    <td key={cIdx} className="p-1 border-r border-white/5">
                      <input
                        type="text"
                        value={cell}
                        onChange={e => {
                          const newRows = [...block.extra];
                          newRows[rIdx].celdas[cIdx] = e.target.value;
                          onChange(index, block.contenido, newRows);
                        }}
                        className="bg-transparent border-0 outline-none w-full text-neutral-300 py-1"
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => {
                        const newRows = block.extra.filter((_, idx) => idx !== rIdx);
                        onChange(index, block.contenido, newRows);
                      }}
                      className="p-1 rounded hover:bg-white/5 text-neutral-600 hover:text-red-400"
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              const newRows = [...block.extra, { id: 'row-' + Date.now(), celdas: block.contenido.map(() => '') }];
              onChange(index, block.contenido, newRows);
            }}
            className="w-full py-1.5 border-t border-dashed border-white/5 hover:bg-white/[0.01] flex items-center justify-center gap-1.5 text-neutral-500 hover:text-neutral-300 text-[9px] font-black uppercase tracking-wider mt-1 transition-all"
          >
            <Plus size={10} /> Añadir Fila
          </button>
        </div>
      );

    case 'imagen':
    case 'video':
    case 'audio':
    case 'archivo':
      return (
        <div className="w-full flex flex-col p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {block.tipo === 'imagen' && <Image size={14} className="text-blue-400" />}
              {block.tipo === 'video' && <Video size={14} className="text-emerald-400" />}
              {block.tipo === 'audio' && <Music size={14} className="text-purple-400" />}
              {block.tipo === 'archivo' && <File size={14} className="text-yellow-400" />}
              <span className="text-[9px] font-black uppercase tracking-wider text-white">
                Bloque de {block.tipo === 'imagen' ? 'Imagen' : block.tipo === 'video' ? 'Video' : block.tipo === 'audio' ? 'Audio' : 'Archivo'}
              </span>
            </div>
            <input
              type="text"
              value={block.extra || ''}
              onChange={e => onChange(index, block.contenido, e.target.value)}
              className="bg-transparent border-0 outline-none text-right text-[9px] font-bold text-neutral-400 hover:text-white placeholder-neutral-600"
              placeholder="Añadir descripción..."
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={block.contenido || ''}
              onChange={e => onChange(index, e.target.value, block.extra)}
              className="flex-1 px-3 py-1.5 rounded bg-black/40 border border-white/5 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Introduce la URL del archivo de medios..."
            />
          </div>
          
          {/* Real pre-render elements if URL is set */}
          {block.contenido && block.contenido.startsWith('http') && (
            <div className="mt-3 rounded overflow-hidden max-w-full flex justify-center bg-black/20 border border-white/5 p-2">
              {block.tipo === 'imagen' && <img src={block.contenido} alt={block.extra} className="max-h-[250px] object-contain rounded" />}
              {block.tipo === 'video' && <video src={block.contenido} controls className="max-h-[250px] rounded w-full" />}
              {block.tipo === 'audio' && <audio src={block.contenido} controls className="w-full py-2" />}
              {block.tipo === 'archivo' && (
                <a href={block.contenido} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-yellow-400 text-[10px] font-bold py-2 hover:underline">
                  <File size={16} /> Descargar Archivo ({block.extra || 'Link'})
                </a>
              )}
            </div>
          )}
        </div>
      );

    case 'marcador-web':
      return (
        <div className="w-full flex flex-col p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark size={14} className="text-orange-400" />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Marcador Web</span>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={block.contenido || ''}
              onChange={e => onChange(index, e.target.value, block.extra, block.desc)}
              className="w-full px-3 py-1.5 rounded bg-black/40 border border-white/5 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="URL de Enlace..."
            />
            <input
              type="text"
              value={block.extra || ''}
              onChange={e => onChange(index, block.contenido, e.target.value, block.desc)}
              className="w-full px-3 py-1.5 rounded bg-black/40 border border-white/5 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Título del Marcador..."
            />
            <input
              type="text"
              value={block.desc || ''}
              onChange={e => onChange(index, block.contenido, block.extra, e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-black/40 border border-white/5 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Breve descripción..."
            />
          </div>
          {block.contenido && (
            <a href={block.contenido} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-between p-2 rounded bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 text-[10px] text-neutral-300 font-bold transition-all">
              <span className="truncate flex-1 pr-4">{block.extra || block.contenido}</span>
              <ExternalLink size={12} className="text-neutral-500 shrink-0" />
            </a>
          )}
        </div>
      );

    case 'enlace-pagina':
    case 'pagina':
      return (
        <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer">
          <FileText size={16} className="text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={block.extra || ''}
              onChange={e => onChange(index, block.contenido, e.target.value)}
              className="bg-transparent border-0 outline-none font-bold text-[10px] text-neutral-200 w-full"
              placeholder={block.tipo === 'pagina' ? 'Nombre de Subpágina...' : 'Enlace a Nota / Página...'}
            />
            <input
              type="text"
              value={block.contenido || ''}
              onChange={e => onChange(index, e.target.value, block.extra)}
              className="bg-transparent border-0 outline-none text-[8px] text-neutral-500 w-full truncate"
              placeholder="Enlace ID o URL de destino..."
            />
          </div>
        </div>
      );

    // DATABASE VIEWS RENDERERS
    case 'vista-tabla':
      return (
        <div className="w-full flex flex-col border border-white/10 rounded-xl bg-black/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Grid size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Vista de Tabla (Database)</span>
            </div>
            <Sparkles size={12} className="text-neutral-600 animate-pulse" />
          </div>
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-white/10">
                  {block.contenido.columns?.map((col, cIdx) => (
                    <th key={cIdx} className="p-2 border-r border-white/5 font-extrabold uppercase text-neutral-400 tracking-wider text-[8px]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.contenido.rows?.map((row, rIdx) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                    {row.values.map((val, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-white/5">
                        <input
                          type="text"
                          value={val}
                          onChange={e => {
                            const newContent = { ...block.contenido };
                            newContent.rows[rIdx].values[cIdx] = e.target.value;
                            onChange(index, newContent);
                          }}
                          className="bg-transparent border-0 outline-none w-full text-neutral-300"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'vista-tablero':
      return (
        <div className="w-full flex flex-col border border-white/10 rounded-xl bg-black/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trello size={14} className="text-yellow-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Vista de Tablero (Kanban)</span>
            </div>
            <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">db board</span>
          </div>
          <div className="p-3 grid grid-cols-3 gap-3">
            {block.contenido.columns?.map((col, cIdx) => {
              const colCards = block.contenido.cards?.filter(c => c.col === col) || [];
              return (
                <div key={cIdx} className="flex flex-col gap-2 p-2 rounded-lg bg-white/[0.01] border border-white/5 min-h-[150px]">
                  <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 pb-1 border-b border-white/5 mb-1 flex items-center justify-between">
                    <span>{col}</span>
                    <span className="text-[8px] bg-white/5 px-1 rounded text-neutral-500 font-bold">{colCards.length}</span>
                  </div>
                  {colCards.map(card => (
                    <div 
                      key={card.id} 
                      className="p-2.5 rounded-lg border border-white/10 bg-[#0d0d0e] hover:border-white/20 transition-all flex flex-col gap-1 cursor-pointer select-none"
                    >
                      <input
                        type="text"
                        value={card.title}
                        onChange={e => {
                          const newContent = { ...block.contenido };
                          const target = newContent.cards.find(c => c.id === card.id);
                          if (target) target.title = e.target.value;
                          onChange(index, newContent);
                        }}
                        className="bg-transparent border-0 outline-none font-bold text-[9px] text-neutral-200 w-full"
                      />
                      <input
                        type="text"
                        value={card.desc || ''}
                        onChange={e => {
                          const newContent = { ...block.contenido };
                          const target = newContent.cards.find(c => c.id === card.id);
                          if (target) target.desc = e.target.value;
                          onChange(index, newContent);
                        }}
                        className="bg-transparent border-0 outline-none text-[8px] text-neutral-500 w-full"
                        placeholder="Descripción..."
                      />
                      {/* Simple move trigger column */}
                      <div className="flex gap-1 mt-1.5 border-t border-white/5 pt-1.5">
                        {block.contenido.columns.map(destCol => {
                          if (destCol === col) return null;
                          return (
                            <button
                              key={destCol}
                              onClick={() => {
                                const newContent = { ...block.contenido };
                                const target = newContent.cards.find(c => c.id === card.id);
                                if (target) target.col = destCol;
                                onChange(index, newContent);
                              }}
                              className="text-[7px] font-black uppercase px-1 py-0.5 rounded border border-white/5 bg-white/5 text-neutral-500 hover:text-white"
                            >
                              ir a {destCol.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'vista-galeria':
      return (
        <div className="w-full flex flex-col border border-white/10 rounded-xl bg-black/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GalleryIcon size={14} className="text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Vista de Galería</span>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3">
            {block.contenido.map?.((item, iIdx) => (
              <div key={item.id} className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0e] flex flex-col">
                <div className="h-28 bg-neutral-900 overflow-hidden relative group">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <input
                    type="text"
                    value={item.img}
                    onChange={e => {
                      const newContent = [...block.contenido];
                      newContent[iIdx].img = e.target.value;
                      onChange(index, newContent);
                    }}
                    className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/80 rounded border border-white/10 text-[7px] outline-none text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    placeholder="URL de Imagen..."
                  />
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => {
                      const newContent = [...block.contenido];
                      newContent[iIdx].title = e.target.value;
                      onChange(index, newContent);
                    }}
                    className="bg-transparent border-0 outline-none font-extrabold text-[10px] text-white w-full uppercase tracking-wider"
                  />
                  <input
                    type="text"
                    value={item.desc}
                    onChange={e => {
                      const newContent = [...block.contenido];
                      newContent[iIdx].desc = e.target.value;
                      onChange(index, newContent);
                    }}
                    className="bg-transparent border-0 outline-none text-[8px] text-neutral-500 w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'vista-lista':
      return (
        <div className="w-full flex flex-col border border-white/10 rounded-xl bg-black/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlignJustify size={14} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Vista de Lista (Resumen)</span>
            </div>
          </div>
          <div className="p-2 flex flex-col gap-1.5">
            {block.contenido.map?.((item, iIdx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-[#0d0d0e] hover:border-white/10 transition-colors">
                <input
                  type="text"
                  value={item.title}
                  onChange={e => {
                    const newContent = [...block.contenido];
                    newContent[iIdx].title = e.target.value;
                    onChange(index, newContent);
                  }}
                  className="bg-transparent border-0 outline-none font-bold text-[10px] text-neutral-200 flex-1 pr-4"
                />
                <div className="flex gap-1 shrink-0">
                  {item.tags?.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'vista-calendario':
      return (
        <div className="w-full flex flex-col border border-white/10 rounded-xl bg-black/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Vista de Calendario</span>
            </div>
            <span className="text-[8px] text-neutral-400 font-bold uppercase">junio 2026</span>
          </div>
          <div className="p-2 grid grid-cols-7 gap-1 border-b border-white/5 text-center text-[7px] font-black uppercase tracking-widest text-neutral-500 bg-white/[0.01]">
            <div>lun</div><div>mar</div><div>mié</div><div>jue</div><div>vie</div><div>sáb</div><div>dom</div>
          </div>
          <div className="p-2 grid grid-cols-7 gap-1 min-h-[180px]">
            {/* Simple month visualization with 14 dummy cells starting from Monday June 8th to June 21st */}
            {Array.from({ length: 14 }).map((_, cIdx) => {
              const dayNum = cIdx + 8;
              const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayEvents = block.contenido.filter?.(e => e.date === dateStr) || [];
              
              return (
                <div key={cIdx} className="border border-white/5 rounded p-1.5 min-h-[45px] bg-[#0d0d0e] flex flex-col gap-1 justify-between">
                  <div className="text-[8px] font-bold text-neutral-500">{dayNum}</div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.map(ev => (
                      <div key={ev.id} className="text-[6px] font-black uppercase tracking-wide px-1 py-0.5 rounded truncate border border-rose-500/20 bg-rose-500/10 text-rose-400">
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    default:
      return renderTextInput('text-xs', 'font-normal', 'Escribe aquí tu texto o usa / para insertar comandos...');
  }
}
