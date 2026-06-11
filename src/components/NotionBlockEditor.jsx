import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, Heading1, Heading2, Heading3, Heading4, ListTodo, List, ListOrdered, 
  Minus, ChevronRight, FileText, AlertCircle, Quote, Table, Code, Link, 
  Image, Video, Music, File, Bookmark, Grid, Trello, Image as GalleryIcon, 
  AlignJustify, Calendar, Plus, Trash2, ArrowUp, ArrowDown, Settings, Check, X,
  ExternalLink, ChevronDown, Sparkles, Tag
} from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';
import { aiService } from '../services/aiService';

export default function NotionBlockEditor({ value = '', onChange, isDark = true, settings = {}, title = '' }) {
  const t = useTheme(isDark);
  const [blocks, setBlocks] = useState([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);
  const [slashMenu, setSlashMenu] = useState({ visible: false, query: '', index: 0, blockId: null });
  
  // AI Assistant States
  const [aiActiveBlockIndex, setAiActiveBlockIndex] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Nested Subpage Dialog State
  const [activePageModal, setActivePageModal] = useState(null); // { blockIndex, pageId }

  // Block handles menu state
  const [blockMenu, setBlockMenu] = useState({ visible: false, query: '', index: null, x: 0, y: 0 });
  const [showConvertMenu, setShowConvertMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (blockMenu.visible && !e.target.closest('.notion-block-menu-popup') && !e.target.closest('.cursor-grab') && !e.target.closest('button')) {
        setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
        setShowConvertMenu(false);
        setShowColorMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [blockMenu.visible]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    triggerChange(newBlocks);
    setDraggedIndex(null);
  };

  const duplicateBlock = (idx) => {
    const blockToDup = blocks[idx];
    if (!blockToDup) return;
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, {
      ...blockToDup,
      id: 'blk-dup-' + Date.now() + '-' + Math.floor(Math.random()*1000),
    });
    triggerChange(newBlocks);
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
  };

  const deleteBlock = (idx) => {
    const newBlocks = blocks.filter((_, i) => i !== idx);
    if (newBlocks.length === 0) {
      newBlocks.push({ id: 'blk-init-' + Date.now(), tipo: 'texto', contenido: '' });
    }
    triggerChange(newBlocks);
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
  };

  const moveBlock = (idx, direction) => {
    if (direction === 'up' && idx > 0) {
      const newBlocks = [...blocks];
      const temp = newBlocks[idx];
      newBlocks[idx] = newBlocks[idx - 1];
      newBlocks[idx - 1] = temp;
      triggerChange(newBlocks);
    } else if (direction === 'down' && idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      const temp = newBlocks[idx];
      newBlocks[idx] = newBlocks[idx + 1];
      newBlocks[idx + 1] = temp;
      triggerChange(newBlocks);
    }
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
  };

  const convertBlock = (idx, newType) => {
    const newBlocks = [...blocks];
    const block = newBlocks[idx];
    if (block) {
      block.tipo = newType;
      if (newType === 'tabla' && !Array.isArray(block.contenido)) {
        block.contenido = ['Columna 1', 'Columna 2'];
        block.extra = [{ id: 'r1', celdas: ['', ''] }];
      } else if (newType.startsWith('vista-') && (typeof block.contenido !== 'object' || Array.isArray(block.contenido))) {
        block.contenido = getInitialMockData(newType);
      }
      triggerChange(newBlocks);
    }
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
    setShowConvertMenu(false);
  };

  const changeBlockColor = (idx, color) => {
    const newBlocks = [...blocks];
    const block = newBlocks[idx];
    if (block) {
      block.color = color;
      triggerChange(newBlocks);
    }
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
    setShowColorMenu(false);
  };

  const copyBlockLink = (idx) => {
    navigator.clipboard.writeText(`${window.location.origin}/block/${blocks[idx]?.id}`);
    alert("¡Enlace del bloque copiado al portapapeles!");
    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
  };

  const blockRefs = useRef({});

  // Parse markdown input to blocks when value changes
  useEffect(() => {
    if (value !== undefined) {
      const parsed = parseMarkdownToBlocks(value);
      const currentMd = serializeBlocksToMarkdown(blocks);
      if (value !== currentMd || blocks.length === 0) {
        setBlocks(parsed);
      }
    }
  }, [value, title]);

  // Trigger change handler
  const triggerChange = (newBlocks) => {
    setBlocks(newBlocks);
    if (onChange) {
      onChange(serializeBlocksToMarkdown(newBlocks));
    }
  };

  const updateNestedPage = (blockIndex, pageId, updatedFields) => {
    const newBlocks = [...blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.contenido) {
      let pages = [];
      if (Array.isArray(targetBlock.contenido)) {
        pages = targetBlock.contenido.map(item => ({
          id: item.id,
          title: item.title,
          img: item.img || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
          desc: item.desc || '',
          created: item.created || '10 de junio de 2026 23:05',
          tags: item.tags || 'Vacío',
          content: item.content || ''
        }));
      } else {
        pages = targetBlock.contenido.pages || [];
      }
      const pageIndex = pages.findIndex(p => p.id === pageId);
      if (pageIndex !== -1) {
        pages[pageIndex] = { ...pages[pageIndex], ...updatedFields };
        if (Array.isArray(targetBlock.contenido)) {
          targetBlock.contenido = pages;
        } else {
          targetBlock.contenido = { ...targetBlock.contenido, pages };
        }
        triggerChange(newBlocks);
      }
    }
  };

  // --- PARSER MD -> BLOCOS ---
  const parseMarkdownToBlocks = (md) => {
    let parsedBlocks = [];
    
    if (!md || md.trim() === '') {
      parsedBlocks = [{ id: 'blk-init-' + Date.now(), tipo: 'texto', contenido: '' }];
    } else {
      const lines = md.split('\n');
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
    }

    // Prepend Dynamic H1 Title if provided and not already matching
    if (title) {
      const firstBlock = parsedBlocks[0];
      if (!firstBlock || firstBlock.tipo !== 'h1' || firstBlock.contenido !== title) {
        // Remove duplicate automatic H1 if it was just named slightly different, or insert at top
        if (firstBlock && firstBlock.tipo === 'h1' && firstBlock.id === 'blk-title-h1') {
          firstBlock.contenido = title;
        } else {
          parsedBlocks.unshift({ id: 'blk-title-h1', tipo: 'h1', contenido: title });
        }
      }
    }

    return parsedBlocks;
  };

  // --- SERIALIZER ---
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

  // --- HANDLERS ---
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
    
    setTimeout(() => {
      const nextInput = blockRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }, 50);
  };

  const removeBlock = (index) => {
    if (blocks.length === 1) {
      const newBlocks = [...blocks];
      newBlocks[0] = { id: 'blk-txt-' + Date.now(), tipo: 'texto', contenido: '' };
      triggerChange(newBlocks);
      return;
    }
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    triggerChange(newBlocks);
    
    setTimeout(() => {
      const prevIdx = Math.max(0, index - 1);
      const prevInput = blockRefs.current[prevIdx];
      if (prevInput) prevInput.focus();
    }, 50);
  };

  const handleKeyDown = (e, index, block) => {
    const value = block.contenido || '';
    
    if (e.key === 'Enter') {
      if (slashMenu.visible) return;
      e.preventDefault();
      
      const isList = ['lista-vinetas', 'lista-numerada', 'checklist'].includes(block.tipo);
      if (isList && value.trim() === '') {
        // Si está vacío, resetear tipo de bloque a texto normal
        const newBlocks = [...blocks];
        newBlocks[index] = { ...block, tipo: 'texto', extra: null, desc: null };
        triggerChange(newBlocks);
      } else if (isList) {
        // Mantener e insertar el mismo tipo de lista abajo
        insertBlock(index, block.tipo, '');
      } else {
        insertBlock(index, 'texto', '');
      }
    } 
    else if (e.key === ' ' && value === '') {
      // Space key on empty text block triggers AI input bar
      e.preventDefault();
      setAiActiveBlockIndex(index);
    }
    else if (e.key === 'Backspace' && value === '') {
      e.preventDefault();
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

  const handleKeyUp = (e, index, block) => {
    const value = block.contenido || '';
    
    if (e.key === '/') {
      setSlashMenu({
        visible: true,
        query: '',
        index: 0,
        blockId: block.id,
        blockIndex: index
      });
    } else if (slashMenu.visible) {
      if (e.key === 'Escape') {
        setSlashMenu({ ...slashMenu, visible: false });
      } else {
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

  const handleAISubmit = async (index) => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const systemPrompt = `
        Actúas como un asistente de edición de video inteligente de élite integrado en un lienzo interactivo tipo Notion.
        Genera contenido estructurado en Markdown puro para responder a la solicitud del usuario de manera profesional.
        
        REGLAS DE FORMATO:
        1. Utiliza encabezados de Markdown (##, ###, ####) para estructurar secciones de tomas, ideas, guión o copy.
        2. Puedes crear tablas de Markdown, checklists (- [ ] para pendiente, - [/] para en proceso, - [x] para completado), listas de viñetas, bloques de código, divisores, etc.
        3. Escribe directamente el guión, copy, tabla o contenido solicitado en el lienzo sin introducciones ni saludos explicativos innecesarios.
      `;
      
      const response = await aiService.askRaw(systemPrompt, aiPrompt, settings);
      const aiBlocks = parseMarkdownToBlocks(response);
      
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1, ...aiBlocks);
      
      triggerChange(newBlocks);
      setAiActiveBlockIndex(null);
      setAiPrompt('');
    } catch (e) {
      alert('Error de IA: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

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
    const cleanText = (block.contenido || '').replace(/\/[^/]*$/, '');

    const newBlocks = [...blocks];
    let newBlock = { ...block, tipo: toolId, contenido: cleanText };

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
      return {
        title: 'Nueva base de datos',
        pages: [
          { id: 'g1', title: 'nota 1', created: '10 de junio de 2026 23:05', tags: 'Vacío', content: '' },
          { id: 'g2', title: 'nota 2', created: '10 de junio de 2026 23:05', tags: 'Vacío', content: '' }
        ]
      };
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
        { id: 'cal3', title: 'Feedback Final', date: '2026-06-18', label: 'Aprobación' }
      ];
    }
    return {};
  };

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('notion-block-editor-canvas') || (e.target.tagName === 'DIV' && e.target.className.includes('mx-auto'))) {
      const lastIdx = blocks.length - 1;
      if (lastIdx >= 0) {
        const lastBlock = blocks[lastIdx];
        if (lastBlock && (lastBlock.contenido || '').trim() !== '') {
          insertBlock(lastIdx, 'texto', '');
        } else {
          const lastInput = blockRefs.current[lastIdx];
          if (lastInput) lastInput.focus();
        }
      } else {
        setBlocks([{ id: 'blk-init-' + Date.now(), tipo: 'texto', contenido: '' }]);
      }
    }
  };

  return (
    <div className="w-full flex-1 flex flex-row overflow-hidden select-text relative notion-block-editor-wrapper">
      <div 
        className={`flex-1 flex flex-col p-6 min-h-[500px] overflow-y-auto mac-scrollbar notion-block-editor-canvas cursor-text transition-all duration-300 ${activePageModal ? 'w-1/2 max-w-[50%] border-r border-white/10' : 'w-full'}`}
        onKeyDown={handleSlashMenuKeyDown}
        onClick={handleCanvasClick}
      >
      <style>{`
        .notion-block-editor-wrapper input[type="text"],
        .notion-block-editor-canvas input[type="text"],
        .notion-block-editor-modal input[type="text"] {
          background-color: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 4px 0 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .notion-block-editor-wrapper input[type="text"]:focus,
        .notion-block-editor-canvas input[type="text"]:focus,
        .notion-block-editor-modal input[type="text"]:focus {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>
      <div className="w-full max-w-[900px] mx-auto flex flex-col gap-2 pb-24">
        {blocks.map((block, index) => {
          const isAIActive = aiActiveBlockIndex === index;
          
          return (
            <div 
              key={block.id} 
              className="group flex items-start gap-2 w-full relative transition-all duration-150 rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'transparent' }}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Left-hand actions bar: Add block (+) and Option handle (::) */}
              <div className="absolute -left-10 top-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-200 z-30">
                <button 
                  onClick={() => insertBlock(index, 'texto', '')}
                  className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-white"
                  title="Insertar bloque abajo"
                >
                  <Plus size={10} />
                </button>
                
                {/* Drag handle and Tooltip popup */}
                <div className="relative group/tooltip">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setBlockMenu({
                        visible: true,
                        query: '',
                        index: index,
                        x: rect.left - 260,
                        y: rect.top + window.scrollY
                      });
                    }}
                    className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-white cursor-grab"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-2">
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                      <div className="w-0.5 h-0.5 bg-current rounded-full" />
                    </div>
                  </button>
                  {/* Tooltip Note matching visual prompt */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-[1050]">
                    <div className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-[8px] leading-normal text-neutral-400 w-[140px] shadow-2xl">
                      <div><strong className="text-white font-black">Arrastra</strong> para mover</div>
                      <div className="text-neutral-500 mt-0.5"><strong className="text-white font-black">Haz clic</strong> o pulsa <strong className="text-white font-black">⌘/</strong> para abrir el menú.</div>
                    </div>
                    <div className="w-1.5 h-1.5 bg-[#141414] border-r border-b border-white/10 rotate-45 -mt-1" />
                  </div>
                </div>
              </div>
 
              {/* Dynamic render block contents or AI bar input */}
              <div className="flex-1 flex items-start gap-2.5 w-full">
                {isAIActive ? (
                  <div className="w-full flex flex-col gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.02] shadow-lg animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-3 bg-[#141414] border border-white/5 rounded-xl px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-neutral-400">
                        <Sparkles size={11} className="text-purple-400" />
                      </div>
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            await handleAISubmit(index);
                          } else if (e.key === 'Escape') {
                            setAiActiveBlockIndex(null);
                            setAiPrompt('');
                          }
                        }}
                        placeholder="Editar con IA (@ para usar una habilidad)"
                        className="flex-1 bg-transparent border-0 outline-none text-xs text-neutral-200 placeholder-neutral-600"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleAISubmit(index)}
                        disabled={aiLoading}
                        className="w-5 h-5 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors"
                      >
                        {aiLoading ? (
                          <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowUp size={10} />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  renderBlockContent(block, index, handleBlockChange, blockRefs, handleKeyDown, handleKeyUp, setActiveBlockIndex, activeBlockIndex, t, (pageId) => setActivePageModal({ blockIndex: index, pageId }))
                )}
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
            left: '100px',
            top: `${Math.min(500, (slashMenu.blockIndex || 0) * 32 + 80)}px`
          }}
        >
          <div className="px-3 py-2 border-b border-white/5 text-[9px] font-black tracking-widest text-neutral-500 uppercase">
            {slashMenu.query ? `Buscando "${slashMenu.query}"` : 'Sugerencias'}
          </div>
          <div className="flex-1 overflow-y-auto py-1.5 mac-scrollbar max-h-[280px]">
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

      {/* RENDER THE NOTION BLOCK ACTIONS MENU POPUP (IMAGE 1) */}
      {blockMenu.visible && (
        <div 
          className="absolute z-[2000] border rounded-xl shadow-2xl flex flex-col w-[240px] overflow-hidden backdrop-blur-xl animate-in scale-in duration-150 notion-block-menu-popup"
          style={{ 
            backgroundColor: '#141414', 
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            left: `${blockMenu.x}px`,
            top: `${blockMenu.y}px`
          }}
        >
          {/* Search bar matching Image 1 */}
          <div className="p-2 border-b border-white/5">
            <input 
              type="text" 
              placeholder="Buscar acciones..." 
              value={blockMenu.query}
              onChange={e => setBlockMenu(prev => ({ ...prev, query: e.target.value }))}
              className="w-full bg-[#1e1e20] border border-white/10 rounded-lg px-2.5 py-1 text-[10px] outline-none text-white focus:border-white/20"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto py-1 max-h-[300px] text-[11px] text-neutral-300 font-medium select-none">
            {/* Convert block */}
            {!showConvertMenu && !showColorMenu && (
              <>
                <div className="px-2 py-0.5 text-[8px] font-bold uppercase text-neutral-600 tracking-wider">Texto</div>
                <button 
                  onClick={() => setShowConvertMenu(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🔄 Convertir en</span>
                  <ChevronRight size={10} className="text-neutral-500" />
                </button>

                <button 
                  onClick={() => setShowColorMenu(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🎨 Color</span>
                  <ChevronRight size={10} className="text-neutral-500" />
                </button>

                <div className="h-[1px] bg-white/5 my-1" />

                <button 
                  onClick={() => copyBlockLink(blockMenu.index)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">🔗 Copiar enlace</span>
                  <span className="text-[8px] text-neutral-500 font-mono">⌘^L</span>
                </button>

                <button 
                  onClick={() => duplicateBlock(blockMenu.index)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">📋 Duplicar</span>
                  <span className="text-[8px] text-neutral-500 font-mono">⌘D</span>
                </button>

                <div className="relative group/mover">
                  <button 
                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">➡️ Mover a</span>
                    <span className="text-[8px] text-neutral-500 font-mono">⌘⇧P</span>
                  </button>
                  <div className="absolute left-full top-0 ml-1 bg-[#141414] border border-white/10 rounded-lg p-1 hidden group-hover/mover:flex flex-col gap-1 w-[120px]">
                    <button onClick={() => moveBlock(blockMenu.index, 'up')} className="w-full text-left p-1 hover:bg-white/5 rounded text-[9px] font-bold uppercase">Mover Arriba</button>
                    <button onClick={() => moveBlock(blockMenu.index, 'down')} className="w-full text-left p-1 hover:bg-white/5 rounded text-[9px] font-bold uppercase">Mover Abajo</button>
                  </div>
                </div>

                <button 
                  onClick={() => deleteBlock(blockMenu.index)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between text-rose-400 hover:text-rose-300"
                >
                  <span className="flex items-center gap-2">🗑️ Eliminar</span>
                  <span className="text-[8px] font-mono">Del</span>
                </button>

                <div className="h-[1px] bg-white/5 my-1" />

                <button 
                  onClick={() => {
                    setAiActiveBlockIndex(blockMenu.index);
                    setBlockMenu({ visible: false, query: '', index: null, x: 0, y: 0 });
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-purple-950/20 text-purple-300 flex items-center justify-between font-bold"
                >
                  <span className="flex items-center gap-2">✨ Pregúntale a la IA</span>
                  <span className="text-[8px] font-mono">⌘J</span>
                </button>
              </>
            )}

            {/* Convert Submenu */}
            {showConvertMenu && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 border-b border-white/5 mb-1">
                  <button onClick={() => setShowConvertMenu(false)} className="text-neutral-500 hover:text-white">◀</button>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Convertir a...</span>
                </div>
                {allTools.filter(t => t.name.toLowerCase().includes(blockMenu.query.toLowerCase())).map(t => {
                  const ToolIcon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => convertBlock(blockMenu.index, t.id)}
                      className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center gap-2"
                    >
                      <ToolIcon size={12} className="text-neutral-400" />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Color Submenu */}
            {showColorMenu && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 border-b border-white/5 mb-1">
                  <button onClick={() => setShowColorMenu(false)} className="text-neutral-500 hover:text-white">◀</button>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Cambiar Color</span>
                </div>
                {['default', 'rojo', 'azul', 'verde', 'amarillo', 'morado', 'gris', 'naranja'].map(col => (
                  <button
                    key={col}
                    onClick={() => changeBlockColor(blockMenu.index, col)}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between capitalize"
                  >
                    <span>{col}</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{
                      backgroundColor: col === 'default' ? '#fff' : 
                                       col === 'rojo' ? '#ef4444' : 
                                       col === 'azul' ? '#3b82f6' : 
                                       col === 'verde' ? '#10b981' : 
                                       col === 'amarillo' ? '#f59e0b' : 
                                       col === 'morado' ? '#8b5cf6' : 
                                       col === 'gris' ? '#6b7280' : '#f97316'
                    }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div> {/* Close Canvas Column */}

      {/* MODAL PARA NUEVAS PÁGINAS DENTRO DE VISTA DE GALERÍA (RENDERED SIDE-BY-SIDE SPLIT SCREEN) */}
      {activePageModal && (() => {
        const { blockIndex, pageId } = activePageModal;
        const block = blocks[blockIndex];
        if (!block || !block.contenido) return null;
        let pages = [];
        if (Array.isArray(block.contenido)) {
          pages = block.contenido;
        } else {
          pages = block.contenido.pages || [];
        }
        const page = pages.find(p => p.id === pageId);
        if (!page) return null;

        return (
          <div className="w-1/2 h-full bg-[#141414] border-l border-white/10 flex flex-col overflow-hidden relative select-text notion-block-editor-modal animate-in slide-in-from-right duration-200">
            {/* Toolbar */}
            <div className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-[#141414]">
                <button 
                  onClick={() => setActivePageModal(null)}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5"
                  title="Cerrar"
                >
                  <X size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Cerrar</span>
                </button>
                <div className="flex items-center gap-3">
                  <button className="text-[10px] font-bold text-neutral-400 hover:text-white px-2 py-0.5 rounded border border-white/10 bg-transparent flex items-center gap-1">
                    <span>Compartir</span>
                    <ChevronDown size={10} />
                  </button>
                  <button className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-all"><Link size={12} /></button>
                  <button className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-all">★</button>
                  <span className="text-neutral-600">|</span>
                  <button className="text-[10px] font-bold text-neutral-400 hover:text-white">•••</button>
                </div>
              </div>

              {/* Contenido de la Página */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 mac-scrollbar">
                {/* Título de la Página */}
                <input
                  type="text"
                  value={page.title || ''}
                  onChange={e => updateNestedPage(blockIndex, pageId, { title: e.target.value })}
                  placeholder="Nueva página"
                  className="text-3xl font-bold bg-transparent border-0 outline-none text-white w-full placeholder-neutral-700 font-sans"
                />

                {/* Propiedades */}
                <div className="flex flex-col gap-2.5 text-[11px] text-neutral-400 border-b border-white/5 pb-4 max-w-[400px]">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase tracking-wider text-[9px]"><Calendar size={11} /> Creado</div>
                    <div className="col-span-2 text-neutral-300 font-medium">{page.created || '10 de junio de 2026 23:05'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase tracking-wider text-[9px]"><Tag size={11} /> Etiquetas</div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={page.tags || ''}
                        onChange={e => updateNestedPage(blockIndex, pageId, { tags: e.target.value })}
                        placeholder="Vacío"
                        className="bg-transparent border-0 outline-none text-neutral-300 w-full placeholder-neutral-600 py-0.5"
                      />
                    </div>
                  </div>
                  <button className="text-[9px] font-bold text-neutral-500 hover:text-neutral-300 flex items-center gap-1 mt-1.5">
                    <Plus size={10} /> Add a property
                  </button>
                </div>

                {/* Comentarios */}
                <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Comentarios</div>
                  <div className="flex items-center gap-2 bg-transparent border border-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold">C</span>
                    <input 
                      type="text" 
                      placeholder="Agregar un comentario..." 
                      className="bg-transparent border-0 outline-none text-[10px] text-neutral-300 flex-1 placeholder-neutral-700"
                    />
                  </div>
                </div>

                {/* Lienzo Interior Recursivo */}
                <div className="flex-1 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Lienzo de la página</p>
                  <NotionBlockEditor 
                    value={page.content || ''} 
                    onChange={(newVal) => updateNestedPage(blockIndex, pageId, { content: newVal })}
                    isDark={isDark}
                    settings={settings}
                  />
                </div>
              </div>
            </div>
        );
      })()}
    </div>
  );
}

// Render block content inline
function renderBlockContent(block, index, onChange, refs, onKeyDown, onKeyUp, onFocus, activeBlockIndex, t, onOpenPage) {
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
        <div className="w-full flex flex-col pl-1 border border-white/10 p-2 bg-transparent">
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
            <div className="pl-6 pr-2 py-1 mt-1 border-l border-white/10">
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
        <div className="w-full flex gap-3 p-3 border border-white/10 bg-transparent items-start">
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
        <div className="w-full flex flex-col border border-white/10 bg-transparent overflow-hidden">
          <div className="px-3 py-1 border-b border-white/10 bg-transparent flex justify-between items-center text-[9px] font-black uppercase text-neutral-500 tracking-wider">
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
        <div className="w-full overflow-x-auto border border-white/10 bg-transparent p-1">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 bg-transparent">
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
                <tr key={row.id} className="border-b border-white/10 hover:bg-white/[0.01] transition-colors">
                  {row.celdas.map((cell, cIdx) => (
                    <td key={cIdx} className="p-1 border-r border-white/10">
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
            className="w-full py-1.5 border-t border-dashed border-white/10 hover:bg-white/[0.01] flex items-center justify-center gap-1.5 text-neutral-500 hover:text-neutral-300 text-[9px] font-black uppercase tracking-wider mt-1 transition-all"
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
        <div className="w-full flex flex-col p-3 border border-white/10 bg-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {block.tipo === 'imagen' && <Image size={14} className="text-neutral-400" />}
              {block.tipo === 'video' && <Video size={14} className="text-neutral-400" />}
              {block.tipo === 'audio' && <Music size={14} className="text-neutral-400" />}
              {block.tipo === 'archivo' && <File size={14} className="text-neutral-400" />}
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
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
              className="flex-1 px-3 py-1.5 bg-transparent border border-white/10 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Introduce la URL del archivo de medios..."
            />
          </div>
          
          {block.contenido && block.contenido.startsWith('http') && (
            <div className="mt-3 overflow-hidden max-w-[full] flex justify-center bg-transparent border border-white/10 p-2">
              {block.tipo === 'imagen' && <img src={block.contenido} alt={block.extra} className="max-h-[250px] object-contain" />}
              {block.tipo === 'video' && <video src={block.contenido} controls className="max-h-[250px] w-full" />}
              {block.tipo === 'audio' && <audio src={block.contenido} controls className="w-full py-2" />}
              {block.tipo === 'archivo' && (
                <a href={block.contenido} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 text-[10px] font-bold py-2 hover:underline">
                  <File size={16} /> Descargar Archivo ({block.extra || 'Link'})
                </a>
              )}
            </div>
          )}
        </div>
      );

    case 'marcador-web':
      return (
        <div className="w-full flex flex-col p-3 border border-white/10 bg-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark size={14} className="text-neutral-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Marcador Web</span>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={block.contenido || ''}
              onChange={e => onChange(index, e.target.value, block.extra, block.desc)}
              className="w-full px-3 py-1.5 bg-transparent border border-white/10 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="URL de Enlace..."
            />
            <input
              type="text"
              value={block.extra || ''}
              onChange={e => onChange(index, block.contenido, e.target.value, block.desc)}
              className="w-full px-3 py-1.5 bg-transparent border border-white/10 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Título del Marcador..."
            />
            <input
              type="text"
              value={block.desc || ''}
              onChange={e => onChange(index, block.contenido, block.extra, e.target.value)}
              className="w-full px-3 py-1.5 bg-transparent border border-white/10 text-[10px] outline-none text-neutral-300 placeholder-neutral-700"
              placeholder="Breve descripción..."
            />
          </div>
          {block.contenido && (
            <a href={block.contenido} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-between p-2 bg-transparent hover:bg-white/[0.02] border border-white/10 text-[10px] text-neutral-300 font-bold transition-all">
              <span className="truncate flex-1 pr-4">{block.extra || block.contenido}</span>
              <ExternalLink size={12} className="text-neutral-500 shrink-0" />
            </a>
          )}
        </div>
      );

    case 'enlace-pagina':
    case 'pagina':
      return (
        <div className="w-full flex items-center gap-3 p-3 border border-white/10 bg-transparent hover:bg-white/[0.02] transition-all cursor-pointer">
          <FileText size={16} className="text-neutral-400 shrink-0" />
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

    case 'vista-tabla':
      return (
        <div className="w-full flex flex-col overflow-hidden bg-transparent">
          <div className="py-2 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
              <Grid size={13} className="text-neutral-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Vista de Tabla</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  {block.contenido.columns?.map((col, cIdx) => (
                    <th key={cIdx} className="p-2 border-r border-white/5 font-bold uppercase text-neutral-400 tracking-wider text-[8px]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.contenido.rows?.map((row, rIdx) => (
                  <tr key={row.id} className="border-b border-white/5">
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
        <div className="w-full flex flex-col bg-transparent">
          <div className="py-2 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
              <Trello size={13} className="text-neutral-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Vista de Tablero</span>
            </div>
          </div>
          <div className="py-3 grid grid-cols-3 gap-3">
            {block.contenido.columns?.map((col, cIdx) => {
              const colCards = block.contenido.cards?.filter(c => c.col === col) || [];
              return (
                <div key={cIdx} className="flex flex-col gap-2 min-h-[150px]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 pb-1 border-b border-white/5 mb-1 flex items-center justify-between">
                    <span>{col}</span>
                    <span className="text-[8px] px-1 rounded text-neutral-500 font-bold">{colCards.length}</span>
                  </div>
                  {colCards.map(card => (
                    <div 
                      key={card.id} 
                      className="p-2 border border-white/5 bg-transparent flex flex-col gap-1 cursor-pointer select-none"
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
                      <div className="flex gap-1 mt-1 border-t border-white/5 pt-1">
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
                                className="text-[7px] font-bold uppercase px-1 py-0.5 rounded border border-white/5 bg-transparent text-neutral-500 hover:text-white"
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
  
      case 'vista-galeria': {
        const isLegacyArray = Array.isArray(block.contenido);
        const dbTitle = isLegacyArray ? 'Nueva base de datos' : (block.contenido.title || 'Nueva base de datos');
        const pages = isLegacyArray ? block.contenido.map(item => ({
          id: item.id || ('page-' + Math.random().toString(36).substr(2, 5)),
          title: item.title || 'nota 1',
          img: item.img || '',
          desc: item.desc || '',
          created: '10 de junio de 2026 23:05',
          tags: 'Vacío',
          content: ''
        })) : (block.contenido.pages || []);
  
        const handleAddPage = () => {
          const newPage = {
            id: 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title: `nota ${pages.length + 1}`,
            created: '10 de junio de 2026 23:05',
            tags: 'Vacío',
            content: ''
          };
          const newPages = [...pages, newPage];
          if (isLegacyArray) {
            onChange(index, newPages);
          } else {
            onChange(index, { ...block.contenido, pages: newPages });
          }
        };
  
        return (
          <div className="w-full flex flex-col pb-4 bg-transparent">
            <div className="py-2.5 flex justify-between items-center border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dbTitle}
                  onChange={e => {
                    if (isLegacyArray) {
                      onChange(index, { title: e.target.value, pages: pages });
                    } else {
                      onChange(index, { ...block.contenido, title: e.target.value });
                    }
                  }}
                  className="bg-transparent border-0 outline-none text-[11px] font-bold text-white uppercase tracking-wider placeholder-neutral-600 font-sans"
                  placeholder="Nueva base de datos"
                />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleAddPage}
                  className="text-[9px] font-bold px-3 py-1 rounded bg-[#0070f3] hover:bg-[#0060df] text-white transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  Nuevo <ChevronDown size={10} />
                </button>
              </div>
            </div>
  
            {/* Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pages.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onOpenPage && onOpenPage(item.id)}
                  className="border border-white/5 bg-transparent flex flex-col justify-between h-32 p-3.5 cursor-pointer transition-all select-none relative group"
                >
                  {/* Empty area for subpage body preview visual */}
                  <div className="flex-1 flex items-start text-neutral-600 pt-1">
                    <FileText size={20} className="stroke-[1.5]" />
                  </div>
                  {/* Note title bar at the bottom */}
                  <div className="border-t border-white/5 pt-2 flex items-center gap-2">
                    <FileText size={10} className="text-neutral-500" />
                    <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide truncate">{item.title}</span>
                  </div>
                  {/* Delete option on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = pages.filter(p => p.id !== item.id);
                      if (isLegacyArray) {
                        onChange(index, filtered);
                      } else {
                        onChange(index, { ...block.contenido, pages: filtered });
                      }
                    }}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-white/5 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar página"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
  
              {/* Nueva página button card layout */}
              <button 
                onClick={handleAddPage}
                className="border border-white/5 border-dashed bg-transparent flex items-center justify-center gap-2 h-32 text-neutral-500 hover:text-neutral-300 transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                <Plus size={12} /> Nueva página
              </button>
            </div>
          </div>
        );
      }
  
      case 'vista-lista':
        return (
          <div className="w-full flex flex-col bg-transparent">
            <div className="py-2 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlignJustify size={13} className="text-neutral-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Vista de Lista</span>
              </div>
            </div>
            <div className="py-2 flex flex-col">
              {block.contenido.map?.((item, iIdx) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 hover:bg-white/[0.01] transition-colors">
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
                      <span key={tIdx} className="text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border border-white/5 bg-transparent text-neutral-400">
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
          <div className="w-full flex flex-col bg-transparent">
            <div className="py-2 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-neutral-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Vista de Calendario</span>
              </div>
              <span className="text-[8px] text-neutral-400 font-bold uppercase">junio 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-0 border-b border-white/5 text-center text-[7px] font-bold uppercase tracking-widest text-neutral-500 py-1.5">
              <div>lun</div><div>mar</div><div>mié</div><div>jue</div><div>vie</div><div>sáb</div><div>dom</div>
            </div>
            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: 14 }).map((_, cIdx) => {
                const dayNum = cIdx + 8;
                const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const dayEvents = block.contenido.filter?.(e => e.date === dateStr) || [];
                
                return (
                  <div key={cIdx} className="border-r border-b border-white/5 p-1 min-h-[45px] bg-transparent flex flex-col gap-1 justify-between">
                    <div className="text-[8px] font-bold text-neutral-500">{dayNum}</div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.map(ev => (
                        <div key={ev.id} className="text-[6px] font-bold uppercase tracking-wide px-1 py-0.5 rounded truncate border border-white/5 bg-transparent text-neutral-400">
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
      return renderTextInput('text-xs', 'font-normal', 'Presiona "Espacio" para activar la IA o escribe "/" para mostrar los comandos');
  }
}
